/**
 * Edge HTML cache policy for the Worker's per-colo Cache API (see cf/worker.ts). Pure: no Worker
 * globals, so it is unit-tested (tests/unit/cf/edge-cache-policy.test.ts).
 *
 * Only locale-prefixed player and match HTML. The cache key is the full URL path, so en/fr/ar stay
 * separate; those pages read no cookies, headers or searchParams and next-intl's locale cookie is off
 * (src/lib/i18n/routing.ts), so nothing per-user or per-language-header can leak between visitors.
 */
import {
  FINISHED_CODES_ARRAY,
  INTERRUPTED_CODES_ARRAY,
  LIVE_CODES_ARRAY,
} from '../src/lib/match-status';

export type EdgeHtmlKind = 'player' | 'match';

/** Player pages change at most after a match; 10 min keeps bot floods off the origin. */
export const PLAYER_TTL = 600;
export const MATCH_TTL = {
  /** Server-rendered score; the client refreshes it after hydration, so 20 s is the worst HTML age. */
  live: 20,
  /** Kick-off passed but status not live/final yet (stale poller), or kick-off within the hour. */
  kickoffWindow: 20,
  soon: 60,
  /** Fixture far ahead: kick-off time, form, H2H change slowly. */
  upcoming: 600,
  /** Postponed / suspended: status can flip quickly. */
  interrupted: 300,
  /** Just finished: stats, events and lineups are still being finalised by the cron jobs. */
  finishedFresh: 300,
  /** Finished a while ago: settled. */
  finished: 21600,
} as const;

const FRESH_AFTER_KICKOFF_S = 3.5 * 3600;
const LIVE = new Set<string>(LIVE_CODES_ARRAY);
const FINAL = new Set<string>(FINISHED_CODES_ARRAY);
const INTERRUPTED = new Set<string>(INTERRUPTED_CODES_ARRAY);

const PATH = /^\/(?:en|fr|ar)\/(joueur|match)\/[^/]+\/?$/;

export function edgeHtmlKind(pathname: string): EdgeHtmlKind | null {
  const m = PATH.exec(pathname);
  if (!m) return null;
  return m[1] === 'joueur' ? 'player' : 'match';
}

/** TTL in seconds from the fixture status and kick-off (epoch seconds). 0 = do not cache. */
export function matchTtl(statusCode: string, kickoffSec: number, nowSec: number): number {
  if (!statusCode || !Number.isFinite(kickoffSec)) return 0;
  if (LIVE.has(statusCode)) return MATCH_TTL.live;
  // CANC/ABD are in both lists; the page treats them as finished, and they never change again.
  if (FINAL.has(statusCode)) {
    return nowSec - kickoffSec < FRESH_AFTER_KICKOFF_S
      ? MATCH_TTL.finishedFresh
      : MATCH_TTL.finished;
  }
  if (INTERRUPTED.has(statusCode)) return MATCH_TTL.interrupted;
  const untilKickoff = kickoffSec - nowSec;
  if (untilKickoff > 3600) return MATCH_TTL.upcoming;
  if (untilKickoff > 0) return MATCH_TTL.soon;
  // NS/TBD after kick-off: probably playing with a stale status.
  return untilKickoff > -4 * 3600 ? MATCH_TTL.kickoffWindow : MATCH_TTL.finishedFresh;
}

/**
 * The match page renders `data-edge-status` / `data-edge-ko` on its root (from the data it already
 * loaded). Returns null when the marker is missing, so an unexpected page is never cached.
 */
export function readMatchMarker(html: string): { status: string; ko: number } | null {
  const m = /data-edge-status="([A-Z0-9]+)"\s+data-edge-ko="(\d+)"/.exec(html);
  return m ? { status: m[1], ko: Number(m[2]) } : null;
}

export function edgeHtmlTtl(kind: EdgeHtmlKind, html: string | null, nowSec: number): number {
  if (kind === 'player') return PLAYER_TTL;
  const marker = html == null ? null : readMatchMarker(html);
  return marker ? matchTtl(marker.status, marker.ko, nowSec) : 0;
}
