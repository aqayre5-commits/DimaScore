/**
 * In-memory per-IP fixed-window rate limiter for the public JSON API. Zero external services and
 * zero cost: state lives in the warm serverless instance's memory. FAIL-OPEN by design — any error
 * resolves to "allowed", so the limiter can never take the site down.
 *
 * Trade-off: memory is per-instance and resets on cold start, so the effective ceiling is roughly
 * MAX × (number of live instances). That's enough to price out a single-IP scraper hammering the
 * JSON API, without any dependency or bill. Scoped by the caller to enumeration-prone /api/v1/*
 * routes only, so search-engine / AI crawlers (which fetch HTML, not this API) are never affected.
 */

const MAX = Number(process.env.RATE_LIMIT_MAX ?? '200'); // requests per window per IP
const WINDOW_S = Number(process.env.RATE_LIMIT_WINDOW ?? '10'); // window length in seconds
const DISABLED = process.env.RATE_LIMIT_DISABLED === '1';
const MAX_KEYS = 50_000; // hard cap on tracked keys, to bound memory under a distributed flood

const hits = new Map<string, number>();
let lastSweepWindow = -1;

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the current window resets (for the Retry-After header). */
  retryAfter: number;
}

/** Drop counters from windows older than the current one. Keys are `${bucket}:${ip}:${window}`. */
function sweep(currentWindow: number): void {
  for (const key of hits.keys()) {
    const idx = Number(key.slice(key.lastIndexOf(':') + 1));
    if (idx < currentWindow) hits.delete(key);
  }
}

export function checkRateLimit(ip: string, bucket = 'api'): RateLimitResult {
  if (DISABLED) return { ok: true, retryAfter: 0 };
  try {
    const now = Math.floor(Date.now() / 1000);
    const windowIndex = Math.floor(now / WINDOW_S);

    // Sweep at most once per window; hard-clear if a flood blows past the key cap.
    if (windowIndex !== lastSweepWindow) {
      sweep(windowIndex);
      lastSweepWindow = windowIndex;
    }
    if (hits.size > MAX_KEYS) hits.clear();

    const key = `${bucket}:${ip}:${windowIndex}`;
    const count = (hits.get(key) ?? 0) + 1;
    hits.set(key, count);

    if (count > MAX) {
      const retryAfter = (windowIndex + 1) * WINDOW_S - now;
      return { ok: false, retryAfter: Math.max(1, retryAfter) };
    }
    return { ok: true, retryAfter: 0 };
  } catch {
    return { ok: true, retryAfter: 0 }; // fail-open
  }
}
