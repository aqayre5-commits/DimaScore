import { and, or, eq, gt, lt, inArray, asc, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import * as schema from '@/lib/db/schema';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import { syncLiveFixtureDetails } from './fixture-details';

/**
 * Vercel-cron safety net for live match details (lineups + events).
 *
 * The Railway poller is the primary source of in-play details via
 * `syncLiveFixtureDetails`. When it's down or degraded, live matches keep their
 * score (the `finalize-stale` cron re-fetches those) but show no lineups/events
 * until FT. This mirrors that same backstop philosophy for details:
 *
 * - Live backstop: for covered live fixtures, fetch events when they're missing
 *   or stale (the poller hasn't bumped `updated_at` within `staleMinutes`, and
 *   the match isn't paused at HT); fetch lineups when still missing. When the
 *   poller is healthy every live fixture is fresh, so this returns ≈nothing.
 * - Pre-kickoff lineups: for covered NS fixtures kicking off within 45 min with
 *   no lineups yet, fetch lineups once. This is a genuine gap even with a healthy
 *   poller (it only touches live fixtures) — api-football publishes lineups ~1h
 *   before kickoff.
 *
 * Coverage resolution mirrors the poller (exact season, falling back to the
 * previous season's flags — api-football sometimes only tags the prior row).
 * Statistics are intentionally excluded to keep quota low; see BACKLOG.
 */

export interface LiveDetailTarget {
  id: number;
  events: boolean;
  lineups: boolean;
}

export interface LiveDetailsFallbackResult {
  fixtures: number;
  events: number;
  lineups: number;
  apiCalls: number;
}

const LIVE_CODES: readonly string[] = LIVE_CODES_ARRAY;

/**
 * Live/imminent fixtures whose lineups or events the poller hasn't delivered,
 * with per-fixture flags for which feeds to fetch. Bounded to `max`.
 */
export async function getLiveFixturesNeedingDetails(
  db: NeonHttpDatabase<typeof schema>,
  { staleMinutes, max }: { staleMinutes: number; max: number },
): Promise<LiveDetailTarget[]> {
  const candidates = await db
    .select({
      id: schema.fixtures.id,
      competitionId: schema.fixtures.competitionId,
      seasonYear: schema.fixtures.seasonYear,
      statusCode: schema.fixtures.statusCode,
      hasEvents: sql<boolean>`EXISTS (SELECT 1 FROM ${schema.fixtureEvents} WHERE ${schema.fixtureEvents.fixtureId} = ${schema.fixtures.id})`,
      hasLineups: sql<boolean>`EXISTS (SELECT 1 FROM ${schema.fixtureLineups} WHERE ${schema.fixtureLineups.fixtureId} = ${schema.fixtures.id})`,
      stale: sql<boolean>`${schema.fixtures.updatedAt} < NOW() - make_interval(mins => ${staleMinutes})`,
    })
    .from(schema.fixtures)
    .where(
      or(
        inArray(schema.fixtures.statusCode, [...LIVE_CODES_ARRAY]),
        and(
          eq(schema.fixtures.statusCode, 'NS'),
          gt(schema.fixtures.kickoffAt, sql`NOW()`),
          lt(schema.fixtures.kickoffAt, sql`NOW() + make_interval(mins => 45)`),
        ),
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt));

  if (candidates.length === 0) return [];

  const leagueIds = [
    ...new Set(candidates.map((c) => c.competitionId).filter((id): id is number => id != null)),
  ];
  const covRows = await db
    .select({
      leagueId: schema.leagueCoverage.leagueId,
      season: schema.leagueCoverage.season,
      events: schema.leagueCoverage.events,
      lineups: schema.leagueCoverage.lineups,
    })
    .from(schema.leagueCoverage)
    .where(inArray(schema.leagueCoverage.leagueId, leagueIds));

  const covMap = new Map<string, { events: boolean; lineups: boolean }>();
  for (const r of covRows) {
    covMap.set(`${r.leagueId}-${r.season}`, { events: !!r.events, lineups: !!r.lineups });
  }
  const resolveCov = (leagueId: number, season: number) =>
    covMap.get(`${leagueId}-${season}`) ?? covMap.get(`${leagueId}-${season - 1}`) ?? null;

  const out: LiveDetailTarget[] = [];
  for (const c of candidates) {
    if (c.competitionId == null) continue;
    const cov = resolveCov(c.competitionId, c.seasonYear);
    if (!cov) continue;

    let wantEvents = false;
    let wantLineups = false;
    if (LIVE_CODES.includes(c.statusCode)) {
      if (cov.events && (!c.hasEvents || (c.stale && c.statusCode !== 'HT'))) wantEvents = true;
      if (cov.lineups && !c.hasLineups) wantLineups = true;
    } else {
      // NS imminent: lineups only.
      if (cov.lineups && !c.hasLineups) wantLineups = true;
    }

    if (wantEvents || wantLineups) out.push({ id: c.id, events: wantEvents, lineups: wantLineups });
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Fetch and upsert missing/stale live details for the selected fixtures. Events
 * + lineups only (statistics excluded to keep quota low). `syncLiveFixtureDetails`
 * never sets `detailsSyncedAt`, so the post-FT cron still runs its full pass.
 */
export async function runLiveDetailsFallback(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  opts: { staleMinutes?: number; max?: number } = {},
): Promise<LiveDetailsFallbackResult> {
  const staleMinutes = opts.staleMinutes ?? 4;
  const max = opts.max ?? 12;

  const targets = await getLiveFixturesNeedingDetails(db, { staleMinutes, max });
  let events = 0;
  let lineups = 0;
  let apiCalls = 0;

  for (const t of targets) {
    const counts = await syncLiveFixtureDetails(provider, db, t.id, {
      events: t.events,
      lineups: t.lineups,
      statistics: false,
    });
    events += counts.events;
    lineups += counts.lineups;
    if (t.events) apiCalls++;
    if (t.lineups) apiCalls++;
  }

  return { fixtures: targets.length, events, lineups, apiCalls };
}
