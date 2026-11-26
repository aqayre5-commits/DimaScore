import { beforeEach, describe, expect, it, vi } from 'vitest';

const cacheLife = vi.fn();
vi.mock('next/cache', () => ({ cacheLife: (...args: unknown[]) => cacheLife(...args) }));

import { cacheCompetitionData } from '@/lib/competitions/cache-life';

describe('cacheCompetitionData', () => {
  beforeEach(() => cacheLife.mockClear());

  it('running season: refresh within a minute, serve a cached copy for up to 6 h', () => {
    cacheCompetitionData(false);
    expect(cacheLife).toHaveBeenCalledWith({ stale: 300, revalidate: 60, expire: 21600 });
  });

  it('finished season: hourly refresh, a week of retention', () => {
    cacheCompetitionData(true);
    expect(cacheLife).toHaveBeenCalledWith({ stale: 3600, revalidate: 3600, expire: 604800 });
  });

  it('never lets the entry expire before it revalidates (Next rejects that)', () => {
    for (const finished of [false, true]) {
      cacheLife.mockClear();
      cacheCompetitionData(finished);
      const p = cacheLife.mock.calls[0][0] as { revalidate: number; expire: number };
      expect(p.expire).toBeGreaterThan(p.revalidate);
    }
  });
});
