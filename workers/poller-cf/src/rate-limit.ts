/** Detect API-Football per-minute rate limits (HTTP 429 or a 200 body with a rate-limit error). */

export class RateLimitError extends Error {
  readonly status: number;
  constructor(message: string, status = 429) {
    super(message);
    this.name = 'RateLimitError';
    this.status = status;
  }
}

function errorsLookLikeRateLimit(errors: unknown): boolean {
  if (!errors) return false;
  const s = JSON.stringify(errors).toLowerCase();
  return (
    s.includes('429') ||
    s.includes('rate limit') ||
    s.includes('ratelimit') ||
    s.includes('too many request') ||
    s.includes('requestlimit') ||
    s.includes('limit reach')
  );
}

export function isRateLimitErrors(errors: unknown): boolean {
  return errorsLookLikeRateLimit(errors);
}

export function isApiFootballRateLimit(err: unknown): boolean {
  if (err instanceof RateLimitError) return true;
  if (!err || typeof err !== 'object') {
    return typeof err === 'string' && /\b429\b|rate.?limit|too many requests/i.test(err);
  }
  const e = err as {
    status?: number;
    message?: string;
    response?: { status?: number; data?: { errors?: unknown } };
  };
  if (e.status === 429 || e.response?.status === 429) return true;
  if (isRateLimitErrors(e.response?.data?.errors)) return true;
  return /\b429\b|rate.?limit|too many requests/i.test(String(e.message ?? ''));
}
