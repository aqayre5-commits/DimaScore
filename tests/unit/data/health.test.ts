import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';

// Mock @upstash/redis
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    set = vi.fn().mockResolvedValue('OK');
    get = vi.fn().mockResolvedValue(null);
  },
}));

const { GET } = await import('@/app/api/health/route');

describe('/api/health route', () => {
  it('returns ok without leaking account info on success', async () => {
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    // SEC-001: the provider account/subscription/quota must never be serialized.
    expect(body.account).toBeUndefined();
    expect(body.subscription).toBeUndefined();
  });

  it('returns 502 on upstream failure', async () => {
    server.use(
      http.get('https://v3.football.api-sports.io/status', () => {
        return HttpResponse.error();
      }),
    );

    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.status).toBe('error');
    expect(body).toHaveProperty('message');
  });
});
