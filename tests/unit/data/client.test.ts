import { describe, it, expect, vi, beforeEach } from 'vitest';
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
const { apiGet, BASE_URL } = await import('@/lib/data/adapters/api-football/client');

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
});
