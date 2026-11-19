import axios from 'axios';
import { createQuotaResponseInterceptor } from '@/lib/quota/middleware';
import { acquireApiSlot, noteProviderExhausted } from '@/lib/quota/rate-limiter';
import { ApiFootballError, RateLimitExceededError } from '@/lib/data/errors';
import type { ApiResponse } from './types';

const BASE_URL = 'https://v3.football.api-sports.io';

function createClient() {
  const apiKey = process.env.API_FOOTBALL_KEY;
  if (!apiKey) {
    throw new Error('API_FOOTBALL_KEY environment variable is required');
  }

  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-apisports-key': apiKey,
    },
    timeout: 15_000,
  });

  // Raw axios errors are passed through untouched so `apiGet` can inspect status / error code to
  // decide on a retry; they're converted to ApiFootballError only once retries are exhausted.
  instance.interceptors.response.use(createQuotaResponseInterceptor());

  return instance;
}

let client: ReturnType<typeof createClient> | null = null;

export function getClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

export interface RetryOptions {
  /** Number of retries after the first attempt. */
  maxRetries: number;
  /** Base delay for exponential backoff (attempt n waits ~base * 2^n). */
  baseDelayMs: number;
  /** Upper bound for a single backoff delay. */
  maxDelayMs: number;
}

const DEFAULT_RETRY: RetryOptions = { maxRetries: 3, baseDelayMs: 1_000, maxDelayMs: 15_000 };
let retryOptions: RetryOptions = { ...DEFAULT_RETRY };

/** Test hook: shrink delays / retries. Pass nothing to restore defaults. */
export function setRetryOptions(opts?: Partial<RetryOptions>) {
  retryOptions = { ...DEFAULT_RETRY, ...opts };
}

export function isRetryable(error: unknown): boolean {
  // Our own minute-quota signals (x-ratelimit-remaining: 0, or errors.rateLimit in a 200 body).
  // The limiter's shared block makes the next attempt wait for the window to roll over.
  if (error instanceof RateLimitExceededError) return error.limitType === 'minute';
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 429) return true;
  if (status && status >= 500) return true;
  // No response at all → transport-level failure (timeout, reset, DNS, offline). A deliberate
  // abort is the only no-response case we don't retry.
  if (!error.response) return error.code !== 'ERR_CANCELED';
  return false;
}

/** Full-jitter exponential backoff, honouring Retry-After (seconds) when the API sends one. */
export function backoffDelay(attempt: number, error?: unknown, random = Math.random): number {
  const { baseDelayMs, maxDelayMs } = retryOptions;
  const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
  const jittered = exp / 2 + random() * (exp / 2);
  const retryAfter = retryAfterMs(error);
  return Math.round(retryAfter !== undefined ? Math.max(retryAfter, jittered) : jittered);
}

function retryAfterMs(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const raw = error.response?.headers?.['retry-after'];
  const secs = Number(raw);
  return Number.isFinite(secs) && secs > 0 ? secs * 1000 : undefined;
}

function toApiFootballError(error: unknown): unknown {
  if (error instanceof ApiFootballError) return error;
  if (axios.isAxiosError(error)) {
    return new ApiFootballError(
      error.message,
      error.response?.status,
      error.config?.url ?? undefined,
    );
  }
  return error;
}

/** API-Football sometimes reports the per-minute limit as HTTP 200 with `errors.rateLimit`. */
function bodyRateLimitError<T>(data: ApiResponse<T>): RateLimitExceededError | null {
  const errors = data?.errors;
  if (errors && !Array.isArray(errors) && typeof errors === 'object' && 'rateLimit' in errors) {
    return new RateLimitExceededError('minute', 0);
  }
  return null;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): Promise<ApiResponse<T>> {
  const { maxRetries } = retryOptions;
  for (let attempt = 0; ; attempt++) {
    // Outside the try: if the shared limiter can't grant a slot within its max wait, that's final
    // (retrying would just wait again).
    await acquireApiSlot();
    try {
      const response = await getClient().get<ApiResponse<T>>(endpoint, { params });
      const limited = bodyRateLimitError(response.data);
      if (limited) throw limited;
      return response.data;
    } catch (error) {
      const minuteLimited =
        error instanceof RateLimitExceededError ||
        (axios.isAxiosError(error) && error.response?.status === 429);
      if (minuteLimited) {
        await noteProviderExhausted(retryAfterMs(error));
      }
      if (attempt < maxRetries && isRetryable(error)) {
        const delay = backoffDelay(attempt, error);
        console.warn(
          `[api-football] ${endpoint} attempt ${attempt + 1} failed (${describe(error)}); retrying in ${delay}ms`,
        );
        await sleep(delay);
        continue;
      }
      throw toApiFootballError(error);
    }
  }
}

function describe(error: unknown): string {
  if (axios.isAxiosError(error))
    return error.response?.status?.toString() ?? error.code ?? 'network';
  return error instanceof Error ? error.message : String(error);
}

export { BASE_URL };
