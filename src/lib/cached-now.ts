import { cacheLife } from 'next/cache';

/**
 * TTL-bounded "current time" (epoch ms) for static-prerenderable server
 * components. cacheComponents forbids a raw `new Date()` / `Date.now()` in a
 * static prerender (it would bake build-time into the HTML); reading the clock
 * through a `'use cache'` boundary bounds its staleness to cacheLife instead.
 *
 * Callers that need a Date do `new Date(await getCachedNow())` — `new Date(ms)`
 * is deterministic and therefore allowed in a prerender.
 */
export async function getCachedNow(): Promise<number> {
  'use cache';
  cacheLife('minutes');
  return Date.now();
}
