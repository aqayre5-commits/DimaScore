import { useSyncExternalStore } from 'react';

/**
 * "Now" (epoch ms) for rendering time-dependent UI in a Client Component that is part of a
 * prerendered page.
 *
 * With cacheComponents, reading the clock (`Date.now()`, `new Date()`) while a Client Component
 * is server-rendered aborts the prerender of the nearest Suspense boundary. On the home page that
 * boundary was the route's loading.tsx, so the whole page body (H1, hero, match list) left the
 * HTML and was only in the RSC payload. So: on the server and in the hydration pass this returns
 * `serverNow` (a TTL-bounded time from the page's cached data, passed down as a prop); after
 * hydration it is the browser's clock, refreshed every TICK_MS.
 */
const TICK_MS = 30_000;
let current: number | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
      current = null;
    }
  };
}

// Cached between ticks: useSyncExternalStore needs a stable snapshot.
function getSnapshot() {
  if (current === null) current = Date.now();
  return current;
}

export function useRenderNow(serverNow: number): number {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverNow);
}
