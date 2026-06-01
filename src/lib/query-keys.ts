/**
 * Co-located query key factory for TanStack Query.
 * All keys in one place to avoid typos and enable targeted invalidation.
 */
export const qk = {
  match: (id: string) => ['match', id] as const,
  matchEvents: (id: string) => ['match', id, 'events'] as const,
  matchLineups: (id: string) => ['match', id, 'lineups'] as const,
  matchStats: (id: string) => ['match', id, 'stats'] as const,
  competition: (id: string, season: string) => ['competition', id, season] as const,
  standings: (id: string, season: string) => ['competition', id, season, 'standings'] as const,
  team: (id: string) => ['team', id] as const,
  player: (id: string) => ['player', id] as const,
};
