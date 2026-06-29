import type { StandingRow } from '@/lib/db/queries';
import { isLive } from '@/lib/match-status';
import { applyResult } from './apply-result';

/** Minimal in-progress fixture shape needed to overlay a live result onto a group table. */
export interface LiveResultFixture {
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
}

/**
 * Overlay in-progress match results onto a clone of a group's standings rows so the table ticks
 * live (points/GF/GA/GD/W-D-L), then re-sort by points → GD → GF and re-rank 1..n so the displayed
 * order, rank column, and rank-based qualification zones all reflect the live standings.
 *
 * Only fixtures with a live status are applied — finished matches are already in the official rows,
 * so applying them would double-count. Returns the original rows untouched (and an empty live set)
 * when nothing in the group is in progress.
 */
export function overlayLiveStandings(
  rows: StandingRow[],
  liveFixtures: Iterable<LiveResultFixture>,
): { rows: StandingRow[]; liveTeamIds: Set<number> } {
  const liveTeamIds = new Set<number>();
  const clone = rows.map((r) => ({ ...r }));
  const byTeam = new Map<number, StandingRow>();
  for (const r of clone) if (r.teamId != null) byTeam.set(r.teamId, r);

  for (const f of liveFixtures) {
    if (!isLive(f.statusCode)) continue;
    if (f.homeTeamId == null || f.awayTeamId == null) continue;
    if (f.homeScore == null || f.awayScore == null) continue;
    const home = byTeam.get(f.homeTeamId);
    const away = byTeam.get(f.awayTeamId);
    // Attribute the fixture to this group only if both teams belong to it.
    if (!home || !away) continue;
    applyResult(home, f.homeScore, f.awayScore);
    applyResult(away, f.awayScore, f.homeScore);
    liveTeamIds.add(f.homeTeamId);
    liveTeamIds.add(f.awayTeamId);
  }

  if (liveTeamIds.size === 0) return { rows, liveTeamIds };

  clone.sort(
    (a, b) =>
      (b.points ?? 0) - (a.points ?? 0) ||
      (b.goalDiff ?? 0) - (a.goalDiff ?? 0) ||
      (b.goalsFor ?? 0) - (a.goalsFor ?? 0),
  );
  clone.forEach((r, i) => {
    r.rank = i + 1;
  });
  return { rows: clone, liveTeamIds };
}
