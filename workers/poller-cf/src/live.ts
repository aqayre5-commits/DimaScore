/**
 * One LIVE tick: the same writes and Pusher events as workers/live-poller/src/poller.ts.
 * Axios is forced onto the workerd-safe fetch adapter (same as shadow.ts). lastEventSync is
 * owned by the Durable Object so it survives deploys.
 */
import { inArray } from 'drizzle-orm';
import { getDataProvider } from '@/lib/data';
import { getClient } from '@/lib/data/adapters/api-football/client';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { syncLiveFixtureDetails, syncFixtureDetails } from '@/lib/ingestion/fixture-details';
import { CHANNELS, EVENTS, type ScoreUpdatePayload } from '@/lib/realtime/channels';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { computeDeltas, type FixtureRow } from '../../live-poller/src/diff';
import { trackCall, resetTick, isQuotaExhausted } from '../../live-poller/src/quota';
import { triggerPusher } from './pusher-rest';
import { isRateLimitErrors, RateLimitError } from './rate-limit';

const TRACKED_COMPETITION_IDS = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));
const EVENT_THROTTLE_MS = 120_000;
let adaptersInstalled = false;

export interface LiveResult {
  liveCount: number;
  trackedCount: number;
  updatedCount: number;
  detailsCount: number;
  apiCalls: number;
  pushes: number;
  rateLimited: boolean;
}

function installAdapters() {
  if (adaptersInstalled) return;
  const client = getClient();
  client.defaults.adapter = 'fetch';
  client.defaults.fetchOptions = { cache: 'no-store' };
  client.defaults.signal = AbortSignal.timeout(10_000);
  client.interceptors.response.use((res) => {
    const errors = (res.data as { errors?: unknown } | undefined)?.errors;
    const has = Array.isArray(errors)
      ? errors.length > 0
      : !!errors && Object.keys(errors).length > 0;
    if (has) {
      console.warn(
        `  [live-api-errors] ${res.config.url ?? ''} status=${res.status} errors=${JSON.stringify(errors).slice(0, 300)}`,
      );
      if (res.status === 429 || isRateLimitErrors(errors)) {
        throw new RateLimitError(
          `API-Football rate limit (${res.status}): ${JSON.stringify(errors).slice(0, 200)}`,
          res.status,
        );
      }
    }
    return res;
  });
  adaptersInstalled = true;
}

export async function liveTick(
  lastEventSync: Record<string, number>,
  log: (line: string) => void,
): Promise<LiveResult> {
  installAdapters();
  resetTick();

  if (isQuotaExhausted()) {
    console.warn('[live] Quota nearly exhausted, skipping poll');
    return {
      liveCount: 0,
      trackedCount: 0,
      updatedCount: 0,
      detailsCount: 0,
      apiCalls: 0,
      pushes: 0,
      rateLimited: false,
    };
  }

  const provider = getDataProvider();
  const allLive = await provider.getLiveFixtures();
  trackCall();

  const liveFixtures = allLive.filter((f) => TRACKED_COMPETITION_IDS.has(f.league.id));
  if (liveFixtures.length === 0) {
    const { tickCalls } = resetTick();
    return {
      liveCount: allLive.length,
      trackedCount: 0,
      updatedCount: 0,
      detailsCount: 0,
      apiCalls: tickCalls,
      pushes: 0,
      rateLimited: false,
    };
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

  let detailsCount = 0;
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
      const due = deltaIds.has(f.id) || now - (lastEventSync[String(f.id)] ?? 0) > EVENT_THROTTLE_MS;
      const wantEvents = cov.events && due;
      const wantStatistics = cov.statistics && due;
      if (!wantLineups && !wantEvents && !wantStatistics) continue;
      try {
        const counts = await syncLiveFixtureDetails(provider, db, f.id, {
          events: wantEvents,
          lineups: wantLineups,
          statistics: wantStatistics,
        });
        detailsCount++;
        if (wantEvents || wantStatistics) {
          trackCall();
          lastEventSync[String(f.id)] = now;
        }
        if (wantLineups) trackCall();
        if (wantStatistics) trackCall();
        log(
          `  [details] fixture=${f.id} events=${counts.events} lineups=${counts.lineups} stats=${counts.statistics}`,
        );
      } catch (err) {
        log(`  [details] fixture=${f.id} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  for (const id of Object.keys(lastEventSync)) {
    if (!fixtureIds.includes(Number(id))) delete lastEventSync[id];
  }

  let pushes = 0;
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
      await triggerPusher(CHANNELS.LIVE_SCORES, EVENTS.SCORE_UPDATE, payload);
      await triggerPusher(CHANNELS.fixture(delta.fixtureId), EVENTS.SCORE_UPDATE, payload);
      pushes += 2;
    } catch (pusherErr) {
      log(
        `  [pusher] Failed to trigger for fixture=${delta.fixtureId}: ${pusherErr instanceof Error ? pusherErr.message : String(pusherErr)}`,
      );
    }

    log(
      `  [delta] fixture=${delta.fixtureId} changes=[${delta.changes.join(',')}] score=${fixture.goals.home}-${fixture.goals.away} status=${fixture.status.short} min=${fixture.status.elapsed}`,
    );

    const finished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
    if (finished && delta.changes.includes('statusCode') && !isQuotaExhausted()) {
      try {
        const counts = await syncFixtureDetails(provider, db, delta.fixtureId);
        trackCall();
        detailsCount++;
        log(
          `  [ft-details] fixture=${delta.fixtureId} events=${counts.events} lineups=${counts.lineups} stats=${counts.statistics}`,
        );
      } catch (err) {
        log(
          `  [ft-details] fixture=${delta.fixtureId} failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  const { tickCalls } = resetTick();
  return {
    liveCount: allLive.length,
    trackedCount: liveFixtures.length,
    updatedCount: deltas.length,
    detailsCount,
    apiCalls: tickCalls,
    pushes,
    rateLimited: false,
  };
}
