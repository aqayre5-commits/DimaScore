import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type * as schema from '@/lib/db/schema';

/**
 * Idle-season skipping for the 30-minute sync jobs (fixtures-schedule, standings).
 *
 * A current season is IDLE when it has fixtures in the database but none kicking off between
 * `IDLE_LOOKBACK_DAYS` ago and `IDLE_LOOKAHEAD_DAYS` ahead. Idle seasons (finished tournaments,
 * leagues on a long break, qualifiers months away) do not change, so polling them every 30 minutes
 * only burns API-Football quota. They are still synced ONCE A DAY, in a deterministic slot spread
 * across the day by competition id, so a newly scheduled fixture or a season rollover is picked up
 * within 24 hours. Active seasons sync on every run, as before.
 *
 * A season with NO fixtures in the database yet is never idle (it has just been loaded and needs
 * its first sync), and neither is one this query does not know about (fail-open).
 *
 * The once-a-day jobs (teams, top-scorers) already sync every season once a day, so they need no
 * idle handling and are unchanged.
 */
export const IDLE_LOOKAHEAD_DAYS = 30;
/** A recent match day still needs its final result / standings refresh, so it keeps a season active. */
export const IDLE_LOOKBACK_DAYS = 3;

const HALF_HOUR_MS = 30 * 60 * 1000;
const SLOTS_PER_DAY = 48;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SeasonRef {
  competitionId: number;
  year: number;
}

export const seasonKey = (s: SeasonRef): string => `${s.competitionId}-${s.year}`;

export interface SeasonFixtureCounts {
  competition_id: unknown;
  year: unknown;
  total: unknown;
  in_window: unknown;
}

/** Keys of the seasons that have fixtures but none inside the activity window. */
export function idleKeysFromCounts(rows: readonly SeasonFixtureCounts[]): Set<string> {
  const idle = new Set<string>();
  for (const r of rows) {
    const competitionId = Number(r.competition_id);
    const year = Number(r.year);
    if (!Number.isFinite(competitionId) || !Number.isFinite(year)) continue;
    if (Number(r.total) > 0 && Number(r.in_window) === 0)
      idle.add(seasonKey({ competitionId, year }));
  }
  return idle;
}

/**
 * Reads, for every current season, how many fixtures it has in total and inside the activity window.
 * Fail-open: on any error it returns an empty set, so every season is synced as before.
 */
export async function getIdleSeasonKeys(
  db: NeonHttpDatabase<typeof schema>,
  now: Date = new Date(),
): Promise<Set<string>> {
  try {
    const from = new Date(now.getTime() - IDLE_LOOKBACK_DAYS * DAY_MS).toISOString();
    const to = new Date(now.getTime() + IDLE_LOOKAHEAD_DAYS * DAY_MS).toISOString();
    const res = await db.execute(sql`
      SELECT s.competition_id,
             s.year,
             COUNT(f.id) AS total,
             COUNT(f.id) FILTER (
               WHERE f.kickoff_at >= ${from}::timestamptz AND f.kickoff_at < ${to}::timestamptz
             ) AS in_window
      FROM seasons s
      LEFT JOIN fixtures f
             ON f.competition_id = s.competition_id AND f.season_year = s.year
      WHERE s.is_current = true
      GROUP BY s.competition_id, s.year
    `);
    return idleKeysFromCounts(res.rows as unknown as SeasonFixtureCounts[]);
  } catch (error) {
    console.error('[idle-seasons] could not read fixture windows; syncing every season:', error);
    return new Set();
  }
}

/**
 * Whether an idle season's once-a-day sync falls on this 30-minute run: exactly one of the 48 runs
 * per UTC day, chosen by competition id. Deterministic, no stored state. Works for jobs scheduled
 * at :00/:30 and at :15/:45, since consecutive runs always fall in different half-hour buckets.
 */
export function idleSyncDue(competitionId: number, now: Date): boolean {
  const slot = Math.floor(now.getTime() / HALF_HOUR_MS) % SLOTS_PER_DAY;
  return slot === Math.abs(competitionId) % SLOTS_PER_DAY;
}

/** Splits seasons into those to sync now and those skipped as idle on this run. */
export function selectSeasonsToSync<T extends SeasonRef>(
  seasons: readonly T[],
  idleKeys: ReadonlySet<string>,
  now: Date,
): { run: T[]; idleSkipped: T[] } {
  const run: T[] = [];
  const idleSkipped: T[] = [];
  for (const s of seasons) {
    if (idleKeys.has(seasonKey(s)) && !idleSyncDue(s.competitionId, now)) {
      idleSkipped.push(s);
    } else {
      run.push(s);
    }
  }
  return { run, idleSkipped };
}
