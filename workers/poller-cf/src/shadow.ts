/**
 * One SHADOW tick of the Railway live poller (workers/live-poller/src/poller.ts), read-only:
 * - 1 API-Football call (`fixtures?live=all`) and Neon SELECTs only;
 * - computes the same deltas and detail-sync decisions as Railway, and LOGS what it would write
 *   to Neon and push to Soketi. No INSERT/UPDATE, no detail syncs (they cost API calls), no Pusher.
 * Neon itself also refuses writes: the Worker runs with DB_READ_ONLY=1 (READ ONLY transactions).
 */
import { inArray } from 'drizzle-orm';
import { getDataProvider } from '@/lib/data';
import { getClient } from '@/lib/data/adapters/api-football/client';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { CHANNELS, EVENTS, type ScoreUpdatePayload } from '@/lib/realtime/channels';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { computeDeltas, type FixtureRow } from '../../live-poller/src/diff';

const TRACKED_COMPETITION_IDS = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));
const EVENT_THROTTLE_MS = 120_000; // same as Railway
let errorLoggerInstalled = false;

export interface ShadowResult {
  liveCount: number;
  trackedCount: number;
  wouldUpdate: number;
  wouldDetails: number;
  apiCalls: number;
}

/** `lastEventSync` is owned by the caller (Durable Object storage) so it survives restarts. */
export async function shadowTick(
  lastEventSync: Record<string, number>,
  log: (line: string) => void,
): Promise<ShadowResult> {
  // Axios 1.20's browser/fetch adapter explicitly supplies cache:"default", which workerd rejects.
  // Scope the override to this shadow Worker only (the Railway entry point is unchanged).
  const client = getClient();
  client.defaults.adapter = 'fetch';
  client.defaults.fetchOptions = { cache: 'no-store' };
  client.defaults.signal = AbortSignal.timeout(10_000);
  if (!errorLoggerInstalled) {
    // API-Football answers HTTP 200 with an `errors` object (token, plan, rate limit) and an empty
    // `response`; log those messages (never the key) so an empty tick can be told apart from no matches.
    client.interceptors.response.use((res) => {
      const errors = (res.data as { errors?: unknown } | undefined)?.errors;
      const has = Array.isArray(errors)
        ? errors.length > 0
        : !!errors && Object.keys(errors).length > 0;
      if (has)
        console.warn(
          `  [shadow-api-errors] ${res.config.url ?? ''} status=${res.status} errors=${JSON.stringify(errors).slice(0, 300)}`,
        );
      return res;
    });
    errorLoggerInstalled = true;
  }
  const provider = getDataProvider();
  const allLive = await provider.getLiveFixtures();
  const apiCalls = 1;
  const liveFixtures = allLive.filter((f) => TRACKED_COMPETITION_IDS.has(f.league.id));
  if (liveFixtures.length === 0) {
    return {
      liveCount: allLive.length,
      trackedCount: 0,
      wouldUpdate: 0,
      wouldDetails: 0,
      apiCalls,
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

  // Detail-sync decisions, exactly as Railway makes them (coverage flags, lineups once, events on
  // a delta or every 2 min) — logged, not executed.
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
  let wouldDetails = 0;
  for (const f of liveFixtures) {
    const cov = resolveCov(f.league.id, f.league.season);
    if (!cov) continue;
    const wantLineups = cov.lineups && !hasLineups.has(f.id);
    const due = deltaIds.has(f.id) || now - (lastEventSync[String(f.id)] ?? 0) > EVENT_THROTTLE_MS;
    const wantEvents = cov.events && due;
    const wantStatistics = cov.statistics && due;
    if (!wantLineups && !wantEvents && !wantStatistics) continue;
    if (wantEvents || wantStatistics) lastEventSync[String(f.id)] = now;
    wouldDetails++;
    log(
      `  [shadow-details] fixture=${f.id} would_sync events=${wantEvents} lineups=${wantLineups} stats=${wantStatistics}`,
    );
  }
  // Forget fixtures that are no longer live (keeps DO storage small).
  for (const id of Object.keys(lastEventSync)) {
    if (!fixtureIds.includes(Number(id))) delete lastEventSync[id];
  }

  for (const delta of deltas) {
    const fixture = liveFixtures.find((f) => f.id === delta.fixtureId)!;
    const row = mapFixtureToInsert(fixture);
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
    const wouldWrite = {
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
    };
    log(
      `  [shadow-delta] fixture=${delta.fixtureId} changes=[${delta.changes.join(',')}] score=${fixture.goals.home}-${fixture.goals.away} status=${fixture.status.short} min=${fixture.status.elapsed} would_write=fixtures.upsert${JSON.stringify(wouldWrite)} would_push=${CHANNELS.LIVE_SCORES},${CHANNELS.fixture(delta.fixtureId)}:${EVENTS.SCORE_UPDATE} payload=${JSON.stringify(payload)}`,
    );
    const finished = ['FT', 'AET', 'PEN'].includes(fixture.status.short);
    if (finished && delta.changes.includes('statusCode')) {
      log(`  [shadow-ft-details] fixture=${delta.fixtureId} would_sync full details`);
    }
  }

  return {
    liveCount: allLive.length,
    trackedCount: liveFixtures.length,
    wouldUpdate: deltas.length,
    wouldDetails,
    apiCalls,
  };
}
