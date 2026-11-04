import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter, resolveBudget, DEFAULT_MINUTE_BUDGET } from '@/lib/quota/rate-limiter';
import type { LimiterRedis } from '@/lib/quota/rate-limiter';
import { RateLimitExceededError } from '@/lib/data/errors';

/** Minimal in-memory stand-in for the Upstash pipeline API (TTL ignored). */
function fakeRedis() {
  const store = new Map<string, unknown>();
  const redis: LimiterRedis & { store: Map<string, unknown> } = {
    store,
    pipeline() {
      const ops: (() => unknown)[] = [];
      return {
        incr(key: string) {
          ops.push(() => {
            const n = Number(store.get(key) ?? 0) + 1;
            store.set(key, n);
            return n;
          });
        },
        expire() {
          ops.push(() => 1);
        },
        get(key: string) {
          ops.push(() => store.get(key) ?? null);
        },
        async exec() {
          return ops.map((op) => op());
        },
      };
    },
    async set(key: string, value: string | number) {
      store.set(key, value);
      return 'OK';
    },
  };
  return redis;
}

function clock(start: number) {
  let t = start;
  return {
    now: () => t,
    sleep: vi.fn(async (ms: number) => {
      t += ms;
    }),
  };
}

describe('shared API-Football rate limiter', () => {
  it('is a no-op when Redis is not configured', async () => {
    const limiter = createRateLimiter({ getRedis: () => null });
    await expect(limiter.acquire()).resolves.toBeUndefined();
  });

  it('grants slots up to the budget, then waits for the next minute window', async () => {
    const redis = fakeRedis();
    const c = clock(60_000 * 1000 + 10_000); // 10s into a minute
    const limiter = createRateLimiter({
      getRedis: () => redis,
      budget: 3,
      maxWaitMs: 120_000,
      now: c.now,
      sleep: c.sleep,
      random: () => 0,
    });

    for (let i = 0; i < 3; i++) await limiter.acquire();
    expect(c.sleep).not.toHaveBeenCalled();

    await limiter.acquire(); // 4th call in the same window must wait ~50s
    expect(c.sleep).toHaveBeenCalledTimes(1);
    expect(c.sleep.mock.calls[0][0]).toBe(50_000);
  });

  it('shares the budget across limiter instances (i.e. processes) via Redis', async () => {
    const redis = fakeRedis();
    const c = clock(60_000 * 2000);
    const opts = {
      getRedis: () => redis,
      budget: 2,
      maxWaitMs: 120_000,
      now: c.now,
      sleep: c.sleep,
    };
    const a = createRateLimiter(opts);
    const b = createRateLimiter(opts);
    await a.acquire();
    await b.acquire();
    await b.acquire(); // third across both → waits
    expect(c.sleep).toHaveBeenCalledTimes(1);
  });

  it('pauses everyone after the provider reports the minute exhausted', async () => {
    const redis = fakeRedis();
    const c = clock(60_000 * 3000 + 1_000);
    const limiter = createRateLimiter({
      getRedis: () => redis,
      budget: 100,
      now: c.now,
      sleep: c.sleep,
      random: () => 0,
    });
    await limiter.noteProviderExhausted(5_000);
    await limiter.acquire();
    expect(c.sleep).toHaveBeenCalledWith(5_000);
  });

  it('throws RateLimitExceededError when no slot is available within maxWaitMs', async () => {
    const redis = fakeRedis();
    const c = clock(60_000 * 4000 + 5_000);
    const limiter = createRateLimiter({
      getRedis: () => redis,
      budget: 1,
      maxWaitMs: 10_000,
      now: c.now,
      sleep: c.sleep,
      random: () => 0,
    });
    await limiter.acquire();
    await expect(limiter.acquire()).rejects.toBeInstanceOf(RateLimitExceededError);
  });

  it('fails open when Redis errors', async () => {
    const limiter = createRateLimiter({
      getRedis: () =>
        ({
          pipeline: () => ({
            incr() {},
            expire() {},
            get() {},
            exec: async () => {
              throw new Error('redis down');
            },
          }),
          set: async () => 'OK',
        }) as unknown as LimiterRedis,
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(limiter.acquire()).resolves.toBeUndefined();
    warn.mockRestore();
  });

  it('derives the budget from env, then the provider limit, then a default', () => {
    expect(resolveBudget(null)).toBe(DEFAULT_MINUTE_BUDGET);
    expect(resolveBudget(450)).toBe(360);
    expect(resolveBudget(450, 50)).toBe(50);
    vi.stubEnv('API_FOOTBALL_MINUTE_BUDGET', '120');
    expect(resolveBudget(450)).toBe(120);
    vi.unstubAllEnvs();
  });
});
