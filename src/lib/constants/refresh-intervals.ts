// SWR refreshInterval (ms) by fixture status code.
// Matches the 18 API-Football status codes from §A.6.

const LIVE = 5_000;
const UPCOMING_SOON = 30_000;
const INTERRUPTED = 60_000;
const DISABLED = 0;

const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const INTERRUPTED_STATUSES = new Set(['SUSP', 'INT']);
const TERMINAL_STATUSES = new Set(['PST', 'CANC', 'ABD', 'AWD', 'WO']);
const UPCOMING_STATUSES = new Set(['NS', 'TBD']);

/**
 * Returns the SWR refreshInterval for a fixture based on its status code.
 *
 * @param statusCode - One of the 18 API-Football short status codes.
 * @param isWithinOneHour - For upcoming matches (NS/TBD), whether kickoff
 *   is within 1 hour. Caller is responsible for computing this.
 */
export function getRefreshInterval(statusCode: string, isWithinOneHour?: boolean): number {
  if (LIVE_STATUSES.has(statusCode)) return LIVE;
  if (FINISHED_STATUSES.has(statusCode)) return DISABLED;
  if (INTERRUPTED_STATUSES.has(statusCode)) return INTERRUPTED;
  if (TERMINAL_STATUSES.has(statusCode)) return DISABLED;
  if (UPCOMING_STATUSES.has(statusCode)) return isWithinOneHour ? UPCOMING_SOON : DISABLED;
  return DISABLED;
}
