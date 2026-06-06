'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LiveFixturePatch } from '@/lib/realtime/live-types';

export type { LiveFixturePatch };

const REFRESH_MS = 30_000;

async function fetchLiveFixtures(): Promise<LiveFixturePatch[]> {
  const res = await fetch('/api/v1/live', { cache: 'no-store' });
  if (!res.ok) throw new Error(`live fetch failed: ${res.status}`);
  const data = (await res.json()) as { fixtures: LiveFixturePatch[] };
  return data.fixtures;
}

/**
 * Polls /api/v1/live every 30s and returns a Map of fixtureId → live patch.
 * Pauses while the tab is hidden (refetchIntervalInBackground: false). A single
 * shared query key means every surface (homepage list, ticker, match page)
 * dedupes onto one request.
 */
export function useLiveFixtures(): Map<number, LiveFixturePatch> {
  const { data } = useQuery({
    queryKey: ['live-fixtures'],
    queryFn: fetchLiveFixtures,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  return useMemo(() => {
    const map = new Map<number, LiveFixturePatch>();
    if (data) {
      for (const f of data) map.set(f.id, f);
    }
    return map;
  }, [data]);
}
