// Cache-Control header values per API endpoint pattern.
// Applied by API route handlers when setting response headers.

export const CACHE_HEADERS = {
  'fixtures-live': 'private, no-cache',
  'fixtures-today': 'public, s-maxage=15, stale-while-revalidate=30',
  'fixtures-past': 'public, s-maxage=86400, stale-while-revalidate=43200',
  'fixtures-future': 'public, s-maxage=3600, stale-while-revalidate=1800',
  standings: 'public, s-maxage=1800, stale-while-revalidate=3600',
  entity: 'public, s-maxage=86400, stale-while-revalidate=43200',
  reference: 'public, s-maxage=86400, stale-while-revalidate=86400',
} as const;

export type CachePattern = keyof typeof CACHE_HEADERS;

export function getCacheHeaders(pattern: CachePattern): string {
  return CACHE_HEADERS[pattern];
}
