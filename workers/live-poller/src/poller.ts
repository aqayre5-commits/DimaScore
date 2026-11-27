import { inArray } from 'drizzle-orm';
import { getDataProvider } from '@/lib/data';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { syncLiveFixtureDetails, syncFixtureDetails } from '@/lib/ingestion/fixture-details';
import { getPusherServer } from '@/lib/realtime/pusher-server';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload } from '@/lib/realtime/channels';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { areDetailsDue, computeDeltas, type FixtureRow } from './diff';
import {
  createCompetitionAutoLoader,
  createCompetitionIdCache,
  describePgError,
  filterKnownCompetitions,
  missingCompetitionIds,
} from './guards';
import { trackCall, resetTick, isQuotaExhausted } from './quota';
import { fixturesWithCompleteKits } from '@/lib/match/kit-colours';

const TRACKED_COMPETITION_IDS = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));

// Re-fetch a live fixture's events at most this often (or immediately on a score delta).
const EVENT_THROTTLE_MS = 120_000;
// Per-fixture last events-sync time; persists across ticks in the long-running worker.
const lastEventSync = new Map<number, number>();

// Competition ids present in `competitions`. A fixture whose competition is missing would fail the
// fixtures -> competitions foreign key on every tick, so it is skipped instead. Cached for 5 min.
const COMPETITION_CACHE_TTL_MS = 5 * 60_000;
const getKnownCompetitionIds = createCompetitionIdCache(async () => {
  const rows = await db.select({ id: schema.competitions.id }).from(schema.competitions);
  return rows.map((r) => r.id);
}, COMPETITION_CACHE_TTL_MS);
// Fixture ids already reported as skipped, so each is logged once, not every tick.
const loggedSkips = new Set<number>();

// An allow-listed competition missing from `competitions` (the 26 Nov U17 World Cup incident) is
// loaded automatically: one league id, ~1 API-Football call (/leagues?id=). Each id is tried at most
// once per cooldown, success or failure, and never blocks or aborts a tick.
const AUTOLOAD_COOLDOWN_MS = 45 * 60_000;
const autoLoadCompetitions = createCompetitionAutoLoader({
  allowList: TRACKED_COMPETITION_IDS,
  cooldownMs: AUTOLOAD_COOLDOWN_MS,
  log: (message) => console.log(message),
  onLoaded: () => getKnownCompetitionIds.invalidate(),
  load: async (competitionId) => {
    const meta = VERIFIED_COMPETITIONS.find((c) => c.id === competitionId);
    if (!meta) throw new Error(`competition ${competitionId} is not on the allow-list`);
    trackCall();
    const res = await syncCompetitionsWithSeasons(getDataProvider(), db, [meta]);
    if (res.competitions.updated === 0)
      throw new Error('API-Football returned no league for this id');
  },
});

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

  const trackedLive = allLive.filter((f) => TRACKED_COMPETITION_IDS.has(f.league.id));
  const knownCompetitionIds =
    trackedLive.length > 0 ? await getKnownCompetitionIds() : new Set<number>();
  const { kept: liveFixtures, newlySkipped } = filterKnownCompetitions(
    trackedLive,
    knownCompetitionIds,
    loggedSkips,
  );
  // Fire and forget: the loader never rejects and has its own cooldown, so it cannot block the tick.
  const missingIds = missingCompetitionIds(trackedLive, knownCompetitionIds);
  if (missingIds.length > 0) void autoLoadCompetitions(missingIds);
  for (const f of newlySkipped) {
    console.warn(
      `  [skip] fixture=${f.id} competition=${f.league.id} is not in competitions; skipping (logged once)`,
    );
  }

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
      .select({ fixtureId: schema.fixtureLineups.fixtureId, colors: schema.fixtureLineups.colors })
      .from(schema.fixtureLineups)
      .where(inArray(schema.fixtureLineups.fixtureId, fixtureIds));
    const hasCompleteKits = fixturesWithCompleteKits(existingLineups);

    const deltaChanges = new Map(deltas.map((d) => [d.fixtureId, d.changes]));
    const now = Date.now();
    for (const f of liveFixtures) {
      if (isQuotaExhausted()) break;
      const cov = resolveCov(f.league.id, f.league.season);
      if (!cov) continue;
      const wantLineups = cov.lineups && !hasCompleteKits.has(f.id);
      // A minute-only delta (every live fixture, about once a minute) must not bypass the throttle:
      // only real changes (new fixture, score, status) fetch events/statistics immediately.
      const due = areDetailsDue({
        changes: deltaChanges.get(f.id),
        lastSyncAt: lastEventSync.get(f.id),
        now,
        throttleMs: EVENT_THROTTLE_MS,
      });
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
  let upserted = 0;

  for (const delta of deltas) {
    const fixture = liveFixtures.find((f) => f.id === delta.fixtureId)!;
    const row = mapFixtureToInsert(fixture);

    try {
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
    } catch (upsertErr) {
      // One bad row must not abort the tick: log the Postgres reason and move on to the next delta.
      console.error(
        `  [upsert] fixture=${delta.fixtureId} competition=${fixture.league.id} failed: ${describePgError(upsertErr)}`,
      );
      continue;
    }
    upserted++;

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
    updatedCount: upserted,
    apiCalls: tickCalls,
  };
}
