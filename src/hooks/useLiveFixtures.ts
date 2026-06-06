'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LiveFixturePatch } from '@/lib/realtime/live-types';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

export type { LiveFixturePatch };

const ACTIVE_MS = 15_000;
const IDLE_MS = 60_000;
const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
// Halves where the match clock runs — safe to advance the minute locally between polls.
const RUNNING_CODES = new Set<string>(['1H', '2H', 'ET']);

async function fetchLiveFixtures(): Promise<LiveFixturePatch[]> {
  // Default cache mode (not no-store) so the browser sends If-None-Match and honours the
  // route's max-age=0 + s-maxage: cheap 304s on unchanged polls, fresh on every change.
  const res = await fetch('/api/v1/live');
  if (!res.ok) throw new Error(`live fetch failed: ${res.status}`);
  const data = (await res.json()) as { fixtures: LiveFixturePatch[] };
  return data.fixtures;
}

/**
 * Polls /api/v1/live and returns a Map of fixtureId → live patch.
 *
 * - Backs off to IDLE_MS when nothing is live (still catches kickoffs), runs at ACTIVE_MS
 *   while a match is live, and pauses entirely while the tab is hidden.
 * - Between polls, the minute of a running half is advanced locally on a 60s tick so the
 *   clock never sits still (corrected by the next poll).
 * - One shared query key means every surface dedupes onto a single request.
 */
export function useLiveFixtures(): Map<number, LiveFixturePatch> {
  const { data, dataUpdatedAt } = useQuery({
    queryKey: ['live-fixtures'],
    queryFn: fetchLiveFixtures,
    refetchInterval: (query) => {
      const rows = query.state.data;
      const anyLive = rows?.some((f) => LIVE_CODES.has(f.statusCode)) ?? false;
      return anyLive ? ACTIVE_MS : IDLE_MS;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  // Re-render on a 60s tick so a running match's minute advances between polls.
  // Starts at 0 (no local adjustment) until mounted, avoiding any SSR/now divergence.
  const [tickAt, setTickAt] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTickAt(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const elapsedMin =
      tickAt && dataUpdatedAt ? Math.max(0, Math.floor((tickAt - dataUpdatedAt) / 60_000)) : 0;
    const map = new Map<number, LiveFixturePatch>();
    if (data) {
      for (const f of data) {
        const minute =
          elapsedMin > 0 && f.minute != null && RUNNING_CODES.has(f.statusCode)
            ? f.minute + elapsedMin
            : f.minute;
        map.set(f.id, minute === f.minute ? f : { ...f, minute });
      }
    }
    return map;
  }, [data, dataUpdatedAt, tickAt]);
}
