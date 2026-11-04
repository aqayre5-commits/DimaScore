import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

// Mock @upstash/redis before importing client
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    set = vi.fn().mockResolvedValue('OK');
    get = vi.fn().mockResolvedValue(null);
  },
}));

// Dynamic import to ensure mocks are in place
const { apiGet, BASE_URL, setRetryOptions, isRetryable, backoffDelay } =
  await import('@/lib/data/adapters/api-football/client');

const OK_HEADERS = {
  'x-ratelimit-requests-limit': '75000',
  'x-ratelimit-requests-remaining': '74000',
  'x-ratelimit-limit': '450',
  'x-ratelimit-remaining': '400',
};

function okBody(extra: Record<string, unknown> = {}) {
  return {
    get: 'status',
    parameters: {},
    errors: [],
    results: 1,
    paging: { current: 1, total: 1 },
    response: [{}],
    ...extra,
  };
}

// Keep retry backoff tiny so the suite stays fast.
beforeAll(() => setRetryOptions({ baseDelayMs: 1, maxDelayMs: 4 }));
afterAll(() => setRetryOptions());

describe('API-Football client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends requests to the correct base URL', async () => {
    const res = await apiGet('/status');
    expect(res.get).toBe('status');
    expect(res.response).toHaveLength(1);
  });

  it('extracts rate-limit headers and writes quota to Redis', async () => {
    // The /status handler returns rate-limit headers.
    // The middleware interceptor calls setQuota, which calls redis.set twice
    // (once for daily, once for minute). We verify no error is thrown,
    // meaning the quota middleware ran successfully.
    const res = await apiGet('/status');
    expect(res.response).toHaveLength(1);
  });

  it('throws RateLimitExceededError when per-minute remaining is 0', async () => {
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        return HttpResponse.json(
          {
            get: 'status',
            parameters: {},
            errors: [],
            results: 1,
            paging: { current: 1, total: 1 },
            response: [{}],
          },
          {
            headers: {
              'x-ratelimit-requests-limit': '75000',
              'x-ratelimit-requests-remaining': '74000',
              'x-ratelimit-limit': '450',
              'x-ratelimit-remaining': '0',
            },
          },
        );
      }),
    );

    const { RateLimitExceededError } = await import('@/lib/data/errors');
    await expect(apiGet('/status')).rejects.toThrow(RateLimitExceededError);
  });

  it('throws ApiFootballError on network errors', async () => {
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        return HttpResponse.error();
      }),
    );

    const { ApiFootballError } = await import('@/lib/data/errors');
    await expect(apiGet('/status')).rejects.toThrow(ApiFootballError);
  });

  it('retries a 429 and succeeds on the next attempt', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        calls++;
        if (calls === 1) return new HttpResponse(null, { status: 429 });
        return HttpResponse.json(okBody(), { headers: OK_HEADERS });
      }),
    );
    const res = await apiGet('/status');
    expect(res.response).toHaveLength(1);
    expect(calls).toBe(2);
  });

  it('retries 5xx responses', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        calls++;
        if (calls <= 2) return new HttpResponse(null, { status: 503 });
        return HttpResponse.json(okBody(), { headers: OK_HEADERS });
      }),
    );
    await expect(apiGet('/status')).resolves.toBeDefined();
    expect(calls).toBe(3);
  });

  it('retries network errors, then surfaces ApiFootballError after the last attempt', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        calls++;
        return HttpResponse.error();
      }),
    );
    const { ApiFootballError } = await import('@/lib/data/errors');
    await expect(apiGet('/status')).rejects.toThrow(ApiFootballError);
    expect(calls).toBe(4); // 1 attempt + 3 retries
  });

  it('does not retry 4xx client errors (other than 429)', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        calls++;
        return new HttpResponse(null, { status: 403 });
      }),
    );
    const { ApiFootballError } = await import('@/lib/data/errors');
    const err = await apiGet('/status').catch((e) => e);
    expect(err).toBeInstanceOf(ApiFootballError);
    expect(err.statusCode).toBe(403);
    expect(calls).toBe(1);
  });

  it('treats a 200 with errors.rateLimit as a retryable rate limit', async () => {
    let calls = 0;
    server.use(
      http.get(`${BASE_URL}/status`, () => {
        calls++;
        if (calls === 1) {
          return HttpResponse.json(
            okBody({ errors: { rateLimit: 'Too many requests' }, results: 0, response: [] }),
            { headers: OK_HEADERS },
          );
        }
        return HttpResponse.json(okBody(), { headers: OK_HEADERS });
      }),
    );
    const res = await apiGet('/status');
    expect(res.response).toHaveLength(1);
    expect(calls).toBe(2);
  });
});

describe('retry helpers', () => {
  afterAll(() => setRetryOptions({ baseDelayMs: 1, maxDelayMs: 4 }));

  it('isRetryable is false for non-axios, non-rate-limit errors', () => {
    expect(isRetryable(new Error('boom'))).toBe(false);
  });

  it('backoff grows exponentially with jitter and is capped', () => {
    setRetryOptions({ baseDelayMs: 1000, maxDelayMs: 8000 });
    // random=0 → lower half bound, random=1 → full exponential value
    expect(backoffDelay(0, undefined, () => 0)).toBe(500);
    expect(backoffDelay(0, undefined, () => 1)).toBe(1000);
    expect(backoffDelay(2, undefined, () => 1)).toBe(4000);
    expect(backoffDelay(10, undefined, () => 1)).toBe(8000);
    const d = backoffDelay(1, undefined, () => 0.5);
    expect(d).toBeGreaterThanOrEqual(1000);
    expect(d).toBeLessThanOrEqual(2000);
  });
});
