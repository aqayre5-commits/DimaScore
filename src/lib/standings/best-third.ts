import type { StandingRow } from '@/lib/db/queries';

export interface BestThirdRow {
  crossGroupRank: number;
  group: string;
  teamId: number | null;
  rank: number;
  points: number;
  played: number;
  won: number | null;
  drawn: number | null;
  lost: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDiff: number | null;
  form: string | null;
  team: StandingRow['team'];
}

export interface BestThirdResult {
  rows: BestThirdRow[];
  hasTiesRequiringFallback: boolean;
}

/**
 * Derive sorted best-third-placed table from group standings.
 * Sort: points DESC → goalDiff DESC → goalsFor DESC → stable fallback.
 * FIFA's full chain (fair-play, world ranking) requires unseeded data.
 */
export function computeBestThirdPlaced(standings: StandingRow[]): BestThirdResult {
  const thirdPlaced = standings.filter((s) => s.rank === 3);

  const sorted = [...thirdPlaced].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffB = b.goalDiff ?? 0;
    const diffA = a.goalDiff ?? 0;
    if (diffB !== diffA) return diffB - diffA;
    const gfB = b.goalsFor ?? 0;
    const gfA = a.goalsFor ?? 0;
    if (gfB !== gfA) return gfB - gfA;
    return 0;
  });

  // Detect ties that fell through to stable sort (equal through GF)
  let hasTiesRequiringFallback = false;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (
      a.points === b.points &&
      (a.goalDiff ?? 0) === (b.goalDiff ?? 0) &&
      (a.goalsFor ?? 0) === (b.goalsFor ?? 0)
    ) {
      hasTiesRequiringFallback = true;
      break;
    }
  }

  const rows: BestThirdRow[] = sorted.map((row, i) => ({
    crossGroupRank: i + 1,
    group: row.groupLabel,
    teamId: row.teamId,
    rank: row.rank,
    points: row.points,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalDiff,
    form: row.form,
    team: row.team,
  }));

  return { rows, hasTiesRequiringFallback };
}
