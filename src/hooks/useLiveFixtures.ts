'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LiveFixturePatch } from '@/lib/realtime/live-types';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import { BUILD_ID } from '@/lib/constants/build';

export type { LiveFixturePatch };

const ACTIVE_MS = 15_000;
const IDLE_MS = 60_000;
// Version-check cadence on pages with no live surface mounted (the banner self-polls this slowly).
const VERSION_POLL_MS = 5 * 60_000;
const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
// Halves where the match clock runs — safe to advance the minute locally between polls.
const RUNNING_CODES = new Set<string>(['1H', '2H', 'ET']);
// Natural end of each running half — local extrapolation parks at the boundary instead of
// inventing minutes past it (a stale "2H 90" patch must never climb to 98').
const HALF_CAP: Record<string, number> = { '1H': 45, '2H': 90, ET: 120 };

interface LivePayload {
  fixtures: LiveFixturePatch[];
  buildId?: string;
}

async function fetchLiveFixtures(): Promise<LivePayload> {
  // Default cache mode (not no-store) so the browser sends If-None-Match and honours the
  // route's max-age=0 + s-maxage: cheap 304s on unchanged polls, fresh on every change.
  const res = await fetch('/api/v1/live');
  if (!res.ok) throw new Error(`live fetch failed: ${res.status}`);
  return (await res.json()) as LivePayload;
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
      const anyLive =
        query.state.data?.fixtures?.some((f) => LIVE_CODES.has(f.statusCode)) ?? false;
      return anyLive ? ACTIVE_MS : IDLE_MS;
    },
    refetchIntervalInBackground: false,
    // Catch up immediately on return-to-tab — the interval pauses while hidden, and the
    // global QueryProvider default disables focus refetches.
    refetchOnWindowFocus: 'always',
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
    const fixtures = data?.fixtures;
    if (fixtures) {
      for (const f of fixtures) {
        let minute = f.minute;
        if (elapsedMin > 0 && f.minute != null && RUNNING_CODES.has(f.statusCode)) {
          const cap = HALF_CAP[f.statusCode];
          const advanced = f.minute + elapsedMin;
          // Never below the server value; extrapolation stops at the half boundary.
          minute = cap != null ? Math.max(f.minute, Math.min(advanced, cap)) : advanced;
        }
        map.set(f.id, minute === f.minute ? f : { ...f, minute });
      }
    }
    return map;
  }, [data, dataUpdatedAt, tickAt]);
}

/**
 * True when the server's build id differs from this bundle's — i.e. a new deployment is live and
 * the open tab is running stale code. Shares the live-fixtures query (so it dedupes on live pages);
 * on idle/static pages it self-polls every VERSION_POLL_MS and pauses while the tab is hidden.
 */
export function useUpdateAvailable(): boolean {
  const { data } = useQuery({
    queryKey: ['live-fixtures'],
    queryFn: fetchLiveFixtures,
    refetchInterval: VERSION_POLL_MS,
    refetchIntervalInBackground: false,
    // A tab returning from days in the background should learn about a new deploy
    // (and any live matches) immediately, not at the next 5-minute tick.
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  });
  const serverBuildId = data?.buildId;
  return serverBuildId != null && serverBuildId !== BUILD_ID;
}

/**
 * True once the shared live-fixtures query has resolved at least once this session.
 * Lets surfaces treat the feed as authoritative: a fixture whose server-rendered status
 * is live but which is absent from a successful payload is not live anymore (the feed
 * only returns live + last-4h-finished fixtures). Observes the same query — no extra
 * network beyond the shared poll.
 */
export function useLiveFeedReady(): boolean {
  const { isSuccess } = useQuery({
    queryKey: ['live-fixtures'],
    queryFn: fetchLiveFixtures,
    refetchOnWindowFocus: 'always',
    staleTime: 0,
  });
  return isSuccess;
}
