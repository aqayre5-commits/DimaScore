'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchMatchEvents, fetchMatchLineups, fetchMatchStats } from '@/lib/api/match';
import type { MatchCoverage } from '@/lib/db/queries/match-detail';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { isLive } from '@/lib/match-status';

/**
 * Events, line-ups and team/player stats for the match page. The server seeds these query keys
 * (HydrationBoundary), so the first render, on the server and on the client, already has the
 * data and the HTML carries every panel. While the match is live they refetch every 30 s.
 */
export function useMatchData(matchId: string, coverage: MatchCoverage | null, isUpcoming: boolean) {
  const live = useLiveMatch();
  const refetchInterval = live && isLive(live.statusCode) ? 30_000 : false;

  const events = useQuery({
    queryKey: qk.matchEvents(matchId),
    queryFn: () => fetchMatchEvents(matchId),
    enabled: !isUpcoming && (coverage?.events ?? false),
    refetchInterval,
  });
  const lineups = useQuery({
    queryKey: qk.matchLineups(matchId),
    queryFn: () => fetchMatchLineups(matchId),
    enabled: !isUpcoming && (coverage?.lineups ?? false),
    refetchInterval,
  });
  const stats = useQuery({
    queryKey: qk.matchStats(matchId),
    queryFn: () => fetchMatchStats(matchId),
    enabled:
      !isUpcoming &&
      ((coverage?.statisticsFixtures ?? false) || (coverage?.statisticsPlayers ?? false)),
    refetchInterval,
  });

  return {
    events: events.data ?? [],
    lineups: lineups.data ?? [],
    teamStats: stats.data?.teamStats ?? [],
    playerStats: stats.data?.playerStats ?? [],
  };
}
