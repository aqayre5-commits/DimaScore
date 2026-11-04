import { getRedis } from './tracker';
import { RateLimitExceededError } from '@/lib/data/errors';

/**
 * Shared, Redis-backed limiter for API-Football calls.
 *
 * Every caller (Vercel crons, route handlers, the Railway live-poller, scripts) goes through
 * `apiGet`, which calls `acquireApiSlot()` before each HTTP attempt. Because the counter lives in
 * Upstash, all processes share one per-minute budget instead of each assuming it owns the quota.
 *
 * - Fixed one-minute windows: `INCR api:ratelimit:minute:<epochMinute>`. Over budget → wait for the
 *   next window (plus jitter so waiting callers don't stampede the boundary).
 * - Provider back-pressure: when API-Football says the minute is spent (429, `errors.rateLimit`, or
 *   `x-ratelimit-remaining: 0`), `noteProviderExhausted()` writes a shared "blocked until" key so
 *   every process pauses, not just the one that got the 429.
 * - Fail-open: if Redis is unconfigured or unreachable the limiter never blocks; the retry/backoff in
 *   the client still applies.
 */

const WINDOW_MS = 60_000;
const WINDOW_KEY_PREFIX = 'api:ratelimit:minute:';
const BLOCK_KEY = 'api:ratelimit:blocked-until';
// Quota snapshot written by tracker.ts from the provider's rate-limit headers.
const MINUTE_QUOTA_KEY = 'api:quota:minute';

/** Fallback per-minute budget when neither env nor a recorded provider limit is available. */
export const DEFAULT_MINUTE_BUDGET = 240;
/** Share of the provider's per-minute limit we allow ourselves (headroom for manual/ad-hoc calls). */
const BUDGET_SHARE = 0.8;
const MAX_JITTER_MS = 1_000;

export interface LimiterRedis {
  pipeline(): {
    incr(key: string): unknown;
    expire(key: string, seconds: number): unknown;
    get(key: string): unknown;
    exec(): Promise<unknown[]>;
  };
  set(key: string, value: string | number, opts: { px: number }): Promise<unknown>;
}

export interface RateLimiterOptions {
  getRedis?: () => LimiterRedis | null;
  /** Explicit per-minute budget; otherwise env / provider limit / default. */
  budget?: number;
  /** Give up (throw RateLimitExceededError) if a slot can't be had within this long. */
  maxWaitMs?: number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

function envNumber(name: string): number | undefined {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}

export function resolveBudget(providerMinuteLimit?: number | null, explicit?: number): number {
  if (explicit && explicit > 0) return explicit;
  const fromEnv = envNumber('API_FOOTBALL_MINUTE_BUDGET');
  if (fromEnv) return fromEnv;
  if (providerMinuteLimit && providerMinuteLimit > 0) {
    return Math.max(1, Math.floor(providerMinuteLimit * BUDGET_SHARE));
  }
  return DEFAULT_MINUTE_BUDGET;
}

function parseMinuteLimit(raw: unknown): number | null {
  if (!raw) return null;
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const limit = (obj as { limit?: unknown }).limit;
  return typeof limit === 'number' ? limit : null;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createRateLimiter(opts: RateLimiterOptions = {}) {
  const redisFn = opts.getRedis ?? (() => getRedis() as unknown as LimiterRedis | null);
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? defaultSleep;
  const random = opts.random ?? Math.random;
  const maxWaitMs = opts.maxWaitMs ?? envNumber('API_FOOTBALL_LIMITER_MAX_WAIT_MS') ?? 45_000;

  async function acquire(): Promise<void> {
    const redis = redisFn();
    if (!redis) return;
    const deadline = now() + maxWaitMs;

    for (;;) {
      const t = now();
      const window = Math.floor(t / WINDOW_MS);
      const key = `${WINDOW_KEY_PREFIX}${window}`;

      let count: number;
      let blockedUntil: number;
      let providerLimit: number | null;
      try {
        const p = redis.pipeline();
        p.incr(key);
        p.expire(key, 90);
        p.get(BLOCK_KEY);
        p.get(MINUTE_QUOTA_KEY);
        const res = await p.exec();
        count = Number(res[0]);
        blockedUntil = Number(res[2] ?? 0) || 0;
        providerLimit = parseMinuteLimit(res[3]);
      } catch (err) {
        console.warn(
          '[rate-limiter] Redis unavailable, proceeding without shared limit:',
          err instanceof Error ? err.message : err,
        );
        return;
      }

      const budget = resolveBudget(providerLimit, opts.budget);
      const blocked = blockedUntil > t;
      if (!blocked && count <= budget) return;

      const resumeAt = blocked ? blockedUntil : (window + 1) * WINDOW_MS;
      const wait = Math.max(0, resumeAt - t) + Math.floor(random() * MAX_JITTER_MS);
      if (t + wait > deadline) {
        throw new RateLimitExceededError('minute', 0);
      }
      console.warn(
        `[rate-limiter] ${blocked ? 'provider minute quota spent' : `budget ${budget}/min reached`}; waiting ${wait}ms`,
      );
      await sleep(wait);
    }
  }

  /** Tell every process to pause API-Football calls until `retryAfterMs` from now (or the next minute). */
  async function noteProviderExhausted(retryAfterMs?: number): Promise<void> {
    const redis = redisFn();
    if (!redis) return;
    const t = now();
    const until =
      retryAfterMs && retryAfterMs > 0
        ? t + retryAfterMs
        : (Math.floor(t / WINDOW_MS) + 1) * WINDOW_MS;
    try {
      await redis.set(BLOCK_KEY, until, { px: Math.max(1, until - t) });
    } catch {
      // best-effort
    }
  }

  return { acquire, noteProviderExhausted };
}

const shared = createRateLimiter();

export const acquireApiSlot = () => shared.acquire();
export const noteProviderExhausted = (retryAfterMs?: number) =>
  shared.noteProviderExhausted(retryAfterMs);
