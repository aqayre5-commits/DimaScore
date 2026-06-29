import type { StandingRow } from '@/lib/db/queries';

/**
 * Mutate a standings row to apply one match result from this team's perspective:
 * `scored` goals for, `conceded` goals against. Increments P / GF / GA / GD,
 * and exactly one of W (3 pts) / D (1 pt) / L (0 pts).
 *
 * Single source of truth for standings math — used by the official-feed-empty fallback
 * (compute.ts), the live-overlay util (overlay-live.ts), and the homepage live-group
 * provisional table (HomeLiveGroupStandings.tsx).
 */
export function applyResult(row: StandingRow, scored: number, conceded: number): void {
  row.played = (row.played ?? 0) + 1;
  row.goalsFor = (row.goalsFor ?? 0) + scored;
  row.goalsAgainst = (row.goalsAgainst ?? 0) + conceded;
  row.goalDiff = (row.goalDiff ?? 0) + (scored - conceded);
  if (scored > conceded) {
    row.won = (row.won ?? 0) + 1;
    row.points = (row.points ?? 0) + 3;
  } else if (scored < conceded) {
    row.lost = (row.lost ?? 0) + 1;
  } else {
    row.drawn = (row.drawn ?? 0) + 1;
    row.points = (row.points ?? 0) + 1;
  }
}
