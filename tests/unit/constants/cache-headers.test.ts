import { describe, it, expect } from 'vitest';
import { getCacheHeaders, CACHE_HEADERS, type CachePattern } from '@/lib/constants/cache-headers';

describe('getCacheHeaders', () => {
  const expectations: Record<CachePattern, string> = {
    'fixtures-live': 'private, no-cache',
    'fixtures-today': 'public, s-maxage=15, stale-while-revalidate=30',
    'fixtures-past': 'public, s-maxage=86400, stale-while-revalidate=43200',
    'fixtures-future': 'public, s-maxage=3600, stale-while-revalidate=1800',
    standings: 'public, s-maxage=1800, stale-while-revalidate=3600',
    entity: 'public, s-maxage=86400, stale-while-revalidate=43200',
    reference: 'public, s-maxage=86400, stale-while-revalidate=86400',
  };

  it.each(Object.entries(expectations))(
    'returns correct header for pattern "%s"',
    (pattern, expected) => {
      expect(getCacheHeaders(pattern as CachePattern)).toBe(expected);
    },
  );

  it('CACHE_HEADERS has exactly 7 entries', () => {
    expect(Object.keys(CACHE_HEADERS)).toHaveLength(7);
  });
});
