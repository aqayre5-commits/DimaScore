import { useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchMatch } from '@/lib/api/match';

/**
 * Returns an onMouseEnter handler that prefetches the match summary
 * into the TanStack Query cache. Attach to any fixture link wrapper.
 */
export function usePrefetchMatch(matchId: string) {
  const queryClient = useQueryClient();
  return {
    onMouseEnter: () => {
      queryClient.prefetchQuery({
        queryKey: qk.match(matchId),
        queryFn: () => fetchMatch(matchId),
        staleTime: 60_000,
      });
    },
  };
}
