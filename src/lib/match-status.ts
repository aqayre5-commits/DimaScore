/**
 * Shared match status detection.
 * Single source of truth — uses both statusCode and kickoffAt
 * to handle stale DB statuses (e.g. NS for matches already played).
 */

export type MatchState = 'live' | 'finished' | 'upcoming';

/** Exported arrays for SQL IN-clause reuse */
export const LIVE_CODES_ARRAY = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'] as const;
export const FINISHED_CODES_ARRAY = ['FT', 'AET', 'PEN', 'WO', 'AWD', 'CANC', 'ABD'] as const;
/**
 * Subset of FINISHED that produced a meaningful sporting result and should count toward
 * standings / scorer aggregations. Excludes CANC + ABD (no winner determined).
 * WO + AWD ARE included because forfeits and awarded results both yield an official score.
 */
export const SCORED_STATUSES_ARRAY = ['FT', 'AET', 'PEN', 'WO', 'AWD'] as const;

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
const FINISHED_CODES = new Set<string>(FINISHED_CODES_ARRAY);

export function getMatchState(statusCode: string, kickoffAt: Date, now?: Date): MatchState {
  if (LIVE_CODES.has(statusCode)) return 'live';
  if (FINISHED_CODES.has(statusCode)) return 'finished';
  // Status not updated but kickoff already passed — treat as finished.
  // `now` is passed by static-prerenderable server callers (TTL-bounded via
  // getCachedNow); omitted on the client, where a live `new Date()` is fine.
  if (kickoffAt <= (now ?? new Date())) return 'finished';
  return 'upcoming';
}

export function isLive(statusCode: string): boolean {
  return LIVE_CODES.has(statusCode);
}

export function isFinished(statusCode: string, kickoffAt?: Date): boolean {
  if (FINISHED_CODES.has(statusCode)) return true;
  if (kickoffAt && kickoffAt <= new Date()) return true;
  return false;
}
