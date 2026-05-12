import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('quota tracker no-op when Redis unconfigured', () => {
  beforeEach(() => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  });

  it('setQuota resolves without throwing when env vars are empty', async () => {
    // Dynamic import to pick up stubbed env
    const { setQuota } = await import('@/lib/quota/tracker');

    await expect(
      setQuota({
        daily: { limit: 75000, remaining: 74000 },
        minute: { limit: 450, remaining: 449 },
      }),
    ).resolves.toBeUndefined();
  });

  it('getQuota returns null when env vars are empty', async () => {
    const { getQuota } = await import('@/lib/quota/tracker');
    const result = await getQuota();
    expect(result).toBeNull();
  });

  it('isNearDailyLimit returns false when env vars are empty', async () => {
    const { isNearDailyLimit } = await import('@/lib/quota/tracker');
    const result = await isNearDailyLimit();
    expect(result).toBe(false);
  });
});
