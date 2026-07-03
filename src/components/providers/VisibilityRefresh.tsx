'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// A tab hidden longer than this gets a full server-component refresh on return.
// Live patches only cover live + last-4h fixtures, so server-rendered props older
// than that (hero, carousel, ticker, candidates) can never self-heal client-side.
const STALE_AFTER_MS = 10 * 60_000;

/**
 * Mounted once in the app layout. Tracks how long the document stays hidden;
 * on return to a tab that was hidden ≥ 10 minutes, re-pulls all server components
 * via router.refresh(). Short hides do nothing — the live query's own
 * refetchOnWindowFocus covers those.
 */
export function VisibilityRefresh() {
  const router = useRouter();

  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt === null) return;
      const hiddenFor = Date.now() - hiddenAt;
      hiddenAt = null;
      if (hiddenFor >= STALE_AFTER_MS) router.refresh();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [router]);

  return null;
}
