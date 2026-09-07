/**
 * Shared match status detection.
 * Single source of truth — uses both statusCode and kickoffAt
 * to handle stale DB statuses (e.g. NS for matches already played).
 */

export type MatchState = 'live' | 'finished' | 'upcoming' | 'interrupted';

/** Upcoming / Live / Completed (Results) tabs — interrupted never counts as upcoming. */
export type MatchListBucket = 'live' | 'upcoming' | 'finished';

/** Exported arrays for SQL IN-clause reuse */
export const LIVE_CODES_ARRAY = ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'] as const;
export const FINISHED_CODES_ARRAY = ['FT', 'AET', 'PEN', 'WO', 'AWD', 'CANC', 'ABD'] as const;
/**
 * Codes with no meaningful sporting result to display — the match didn't produce a score
 * (postponed/suspended) or was voided (cancelled/abandoned). List surfaces show a status label
 * instead of "FT" + a blank score. Note: AWD/WO carry an official score so they stay FINISHED;
 * INT stays LIVE (it's in LIVE_CODES for live-fixture polling).
 */
export const INTERRUPTED_CODES_ARRAY = ['PST', 'SUSP', 'CANC', 'ABD'] as const;
/** Scheduled, not started. The only statuses that belong in Upcoming lists. */
export const UPCOMING_CODES_ARRAY = ['NS', 'TBD'] as const;
/**
 * Terminal non-played statuses — never upcoming, even if kickoff is still in the future.
 * CANC/ABD are voided; PST is postponed (no kickoff to play); WO/AWD are awarded results.
 */
export const TERMINAL_NON_PLAYED_CODES_ARRAY = ['CANC', 'ABD', 'PST', 'WO', 'AWD'] as const;

/** Maps an interrupted status code to its `matchDetail` i18n key, or null if not interrupted. */
export function getMatchStatusLabelKey(statusCode: string): string | null {
  switch (statusCode) {
    case 'PST':
      return 'postponed';
    case 'SUSP':
      return 'suspended';
    case 'CANC':
      return 'cancelled';
    case 'ABD':
      return 'abandoned';
    default:
      return null;
  }
}
/**
 * Subset of FINISHED that produced a meaningful sporting result and should count toward
 * standings / scorer aggregations. Excludes CANC + ABD (no winner determined).
 * WO + AWD ARE included because forfeits and awarded results both yield an official score.
 */
export const SCORED_STATUSES_ARRAY = ['FT', 'AET', 'PEN', 'WO', 'AWD'] as const;

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
const FINISHED_CODES = new Set<string>(FINISHED_CODES_ARRAY);
const INTERRUPTED_CODES = new Set<string>(INTERRUPTED_CODES_ARRAY);

export function getMatchState(statusCode: string, kickoffAt: Date, now?: Date): MatchState {
  if (LIVE_CODES.has(statusCode)) return 'live';
  // Before FINISHED / the kickoff-passed fallback: these produced no score to show.
  if (INTERRUPTED_CODES.has(statusCode)) return 'interrupted';
  if (FINISHED_CODES.has(statusCode)) return 'finished';
  // Status not updated but kickoff already passed — treat as finished.
  // `now` is passed by static-prerenderable server callers (TTL-bounded via
  // getCachedNow); omitted on the client, where a live `new Date()` is fine.
  if (kickoffAt <= (now ?? new Date())) return 'finished';
  return 'upcoming';
}

/**
 * Tab bucket for match lists (team Upcoming/Live/Completed, cup Upcoming/Results, etc.).
 * Upcoming is only NS/TBD (or any other non-terminal code) with kickoff still ahead.
 * Interrupted (CANC/ABD/PST/SUSP) and finished (FT/AET/PEN/WO/AWD) go to Completed/Results
 * so cancelled fixtures never appear as a future kickoff.
 */
export function getMatchListBucket(
  statusCode: string,
  kickoffAt: Date,
  now?: Date,
): MatchListBucket {
  const state = getMatchState(statusCode, kickoffAt, now);
  if (state === 'live') return 'live';
  if (state === 'upcoming') return 'upcoming';
  return 'finished';
}

export function isLive(statusCode: string): boolean {
  return LIVE_CODES.has(statusCode);
}

export function isFinished(statusCode: string, kickoffAt?: Date): boolean {
  if (FINISHED_CODES.has(statusCode)) return true;
  if (kickoffAt && kickoffAt <= new Date()) return true;
  return false;
}
