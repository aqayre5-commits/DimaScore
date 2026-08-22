import { inArray } from 'drizzle-orm';
import { getDataProvider } from '@/lib/data';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { syncLiveFixtureDetails, syncFixtureDetails } from '@/lib/ingestion/fixture-details';
import { getPusherServer } from '@/lib/realtime/pusher-server';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload } from '@/lib/realtime/channels';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { computeDeltas, type FixtureRow } from './diff';
import { trackCall, resetTick, isQuotaExhausted } from './quota';

const TRACKED_COMPETITION_IDS = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));

// Re-fetch a live fixture's events at most this often (or immediately on a score delta).
const EVENT_THROTTLE_MS = 120_000;
// Per-fixture last events-sync time; persists across ticks in the long-running worker.
const lastEventSync = new Map<number, number>();

export interface PollResult {
  liveCount: number;
  trackedCount: number;
  updatedCount: number;
  apiCalls: number;
}

export async function pollLiveFixtures(): Promise<PollResult> {
  if (isQuotaExhausted()) {
    console.warn('[poller] Quota nearly exhausted, skipping poll');
    return { liveCount: 0, trackedCount: 0, updatedCount: 0, apiCalls: 0 };
  }

  const provider = getDataProvider();

  const allLive = await provider.getLiveFixtures();
  trackCall();

  const liveFixtures = allLive.filter((f) => TRACKED_COMPETITION_IDS.has(f.league.id));

  if (liveFixtures.length === 0) {
    const { tickCalls } = resetTick();
    return { liveCount: allLive.length, trackedCount: 0, updatedCount: 0, apiCalls: tickCalls };
  }

  const fixtureIds = liveFixtures.map((f) => f.id);
  const dbRows = await db
    .select({
      id: schema.fixtures.id,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
    })
    .from(schema.fixtures)
    .where(inArray(schema.fixtures.id, fixtureIds));

  const dbMap = new Map<number, FixtureRow>(dbRows.map((r) => [r.id, r]));
  const deltas = computeDeltas(liveFixtures, dbMap);

  // Live detail ingestion: lineups once per fixture, events on a score delta or every
  // ~2 min, gated on each league's coverage flags (uncovered feeds skipped). Quota-aware.
  {
    const leagueIds = [...new Set(liveFixtures.map((f) => f.league.id))];
    const coverageRows = await db
      .select({
        leagueId: schema.leagueCoverage.leagueId,
        season: schema.leagueCoverage.season,
        events: schema.leagueCoverage.events,
        lineups: schema.leagueCoverage.lineups,
        statisticsFixtures: schema.leagueCoverage.statisticsFixtures,
      })
      .from(schema.leagueCoverage)
      .where(inArray(schema.leagueCoverage.leagueId, leagueIds));
    const coverage = new Map<string, { events: boolean; lineups: boolean; statistics: boolean }>();
    for (const r of coverageRows) {
      coverage.set(`${r.leagueId}-${r.season}`, {
        events: !!r.events,
        lineups: !!r.lineups,
        statistics: !!r.statisticsFixtures,
      });
    }

    const resolveCov = (leagueId: number, season: number) => {
      const current = coverage.get(`${leagueId}-${season}`);
      if (current && (current.events || current.lineups || current.statistics)) return current;
      const previous = coverage.get(`${leagueId}-${season - 1}`);
      if (previous && (previous.events || previous.lineups || previous.statistics)) return previous;
      return current ?? previous ?? null;
    };

    const existingLineups = await db
      .select({ fixtureId: schema.fixtureLineups.fixtureId })
      .from(schema.fixtureLineups)
      .where(inArray(schema.fixtureLineups.fixtureId, fixtureIds));
    const hasLineups = new Set(existingLineups.map((r) => r.fixtureId));

    const deltaIds = new Set(deltas.map((d) => d.fixtureId));
    const now = Date.now();
    for (const f of liveFixtures) {
      if (isQuotaExhausted()) break;
      const cov = resolveCov(f.league.id, f.league.season);
      if (!cov) continue;
      const wantLineups = cov.lineups && !hasLineups.has(f.id);
      const due = deltaIds.has(f.id) || now - (lastEventSync.get(f.id) ?? 0) > EVENT_THROTTLE_MS;
      const wantEvents = cov.events && due;
      const wantStatistics = cov.statistics && due;
      if (!wantLineups && !wantEvents && !wantStatistics) continue;
      try {
        const counts = await syncLiveFixtureDetails(provider, db, f.id, {
          events: wantEvents,
          lineups: wantLineups,
          statistics: wantStatistics,
        });
        if (wantEvents || wantStatistics) {
          trackCall();
          lastEventSync.set(f.id, now);
        }
        if (wantLineups) trackCall();
        if (wantStatistics) trackCall();
        console.log(
          `  [details] fixture=${f.id} events=${counts.events} lineups=${counts.lineups} stats=${counts.statistics}`,
        );
      } catch (err) {
        console.error(
          `  [details] fixture=${f.id} failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  if (deltas.length === 0) {
    const { tickCalls } = resetTick();
    return {
      liveCount: allLive.length,
      trackedCount: liveFixtures.length,
      updatedCount: 0,
      apiCalls: tickCalls,
    };
  }

  const pusher = getPusherServer();

  for (const delta of deltas) {
    const fixture = liveFixtures.find((f) => f.id === delta.fixtureId)!;
    const row = mapFixtureToInsert(fixture);

    await db
      .insert(schema.fixtures)
      .values(row)
      .onConflictDoUpdate({
        target: schema.fixtures.id,
        set: {
          statusCode: row.statusCode,
          minute: row.minute,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          homeScoreHt: row.homeScoreHt,
          awayScoreHt: row.awayScoreHt,
          homeScoreFt: row.homeScoreFt,
          awayScoreFt: row.awayScoreFt,
          homeScoreEt: row.homeScoreEt,
          awayScoreEt: row.awayScoreEt,
          homeScorePen: row.homeScorePen,
          awayScorePen: row.awayScorePen,
          updatedAt: new Date(),
        },
      });

    const payload: ScoreUpdatePayload = {
      fixtureId: delta.fixtureId,
      homeName: fixture.homeTeam.name,
      awayName: fixture.awayTeam.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      statusCode: fixture.status.short,
      minute: fixture.status.elapsed,
      extraMinute: null,
    };

    try {
      await pusher.trigger(CHANNELS.LIVE_SCORES, EVENTS.SCORE_UPDATE, payload);
      await pusher.trigger(CHANNELS.fixture(delta.fixtureId), EVENTS.SCORE_UPDATE, payload);
    } catch (pusherErr) {
      console.error(`  [pusher] Failed to trigger for fixture=${delta.fixtureId}:`, pusherErr);
    }

    console.log(
      `  [delta] fixture=${delta.fixtureId} changes=[${delta.changes.join(',')}] score=${fixture.goals.home}-${fixture.goals.away} status=${fixture.status.short} min=${fixture.status.elapsed}`,
    );

    const finished =
      fixture.status.short === 'FT' ||
      fixture.status.short === 'AET' ||
      fixture.status.short === 'PEN';
    if (finished && delta.changes.includes('statusCode') && !isQuotaExhausted()) {
      try {
        const counts = await syncFixtureDetails(provider, db, delta.fixtureId);
        trackCall();
        console.log(
          `  [ft-details] fixture=${delta.fixtureId} events=${counts.events} lineups=${counts.lineups} stats=${counts.statistics}`,
        );
      } catch (err) {
        console.error(
          `  [ft-details] fixture=${delta.fixtureId} failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  const { tickCalls } = resetTick();
  return {
    liveCount: allLive.length,
    trackedCount: liveFixtures.length,
    updatedCount: deltas.length,
    apiCalls: tickCalls,
  };
}
