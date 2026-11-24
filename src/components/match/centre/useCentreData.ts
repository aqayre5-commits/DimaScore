'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchMatchEvents, fetchMatchLineups, fetchMatchStats } from '@/lib/api/match';
import type { MatchCoverage } from '@/lib/db/queries/match-detail';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { isLive } from '@/lib/match-status';

/**
 * Events, line-ups and team stats. The server seeds these query keys (HydrationBoundary), so the
 * first render on the server and on the client already has the data and the HTML carries every
 * panel. While the match is live they refetch every 30 s. Line-ups are read before kick-off too
 * (the template's pre-match "Confirmed line-ups").
 */
export function useCentreData(matchId: string, coverage: MatchCoverage | null, started: boolean) {
  const live = useLiveMatch();
  const refetchInterval = live && isLive(live.statusCode) ? 30_000 : false;
  const events = useQuery({
    queryKey: qk.matchEvents(matchId),
    queryFn: () => fetchMatchEvents(matchId),
    enabled: started && (coverage?.events ?? false),
    refetchInterval,
  });
  const lineups = useQuery({
    queryKey: qk.matchLineups(matchId),
    queryFn: () => fetchMatchLineups(matchId),
    enabled: coverage?.lineups ?? false,
    refetchInterval,
  });
  const stats = useQuery({
    queryKey: qk.matchStats(matchId),
    queryFn: () => fetchMatchStats(matchId),
    enabled: started && (coverage?.statisticsFixtures ?? false),
    refetchInterval,
  });
  return {
    events: events.data ?? [],
    lineups: lineups.data ?? [],
    teamStats: stats.data?.teamStats ?? [],
  };
}
