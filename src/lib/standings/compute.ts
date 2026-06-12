import type { StandingRow } from '@/lib/db/queries';

/** Minimal fixture shape needed to aggregate a group table. */
export interface ComputeFixture {
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
}

const FINISHED = new Set(['FT', 'AET', 'PEN']);

function applyOne(row: StandingRow, scored: number, conceded: number) {
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

/**
 * Fallback group-standings computation. When a group's API standings are unpopulated (all rows
 * `played === 0`) but its teams have finished fixtures, aggregate P/W/D/L/GF/GA/GD/Pts (+ a W/D/L
 * form string) from those results and re-rank by points → GD → GF. Groups whose API table is
 * already populated, or that have no finished fixtures, are returned unchanged — so competitions
 * with a working `/standings` feed keep their official tables (and correct tiebreakers).
 *
 * Used to fix cases where the upstream standings feed is empty/stale but the fixture results are
 * correct (e.g. the WC 2026 origin-cache gap). The team→group mapping comes from the standings rows
 * themselves; fixtures (which carry no group) are attributed by requiring both teams in the group.
 *
 * `fixtures` should be ordered by kickoff ascending so the form string reads oldest→newest.
 */
export function applyComputedStandings(
  rows: StandingRow[],
  fixtures: ComputeFixture[],
): StandingRow[] {
  const result = rows.map((r) => ({ ...r }));

  const byGroup = new Map<string, StandingRow[]>();
  for (const r of result) {
    const arr = byGroup.get(r.groupLabel) ?? [];
    arr.push(r);
    byGroup.set(r.groupLabel, arr);
  }

  const finished = fixtures.filter(
    (f) =>
      FINISHED.has(f.statusCode) &&
      f.homeTeamId != null &&
      f.awayTeamId != null &&
      f.homeScore != null &&
      f.awayScore != null,
  );

  for (const groupRows of byGroup.values()) {
    // Only compute when the API table is empty for this group (don't override real standings).
    if (groupRows.some((r) => (r.played ?? 0) > 0)) continue;

    const byTeam = new Map<number, StandingRow>();
    for (const r of groupRows) if (r.teamId != null) byTeam.set(r.teamId, r);

    const form = new Map<number, string[]>();
    let applied = false;
    for (const f of finished) {
      const home = byTeam.get(f.homeTeamId!);
      const away = byTeam.get(f.awayTeamId!);
      // Attribute the fixture to this group only if both teams belong to it.
      if (!home || !away) continue;
      applyOne(home, f.homeScore!, f.awayScore!);
      applyOne(away, f.awayScore!, f.homeScore!);
      const hr = f.homeScore! > f.awayScore! ? 'W' : f.homeScore! < f.awayScore! ? 'L' : 'D';
      (form.get(f.homeTeamId!) ?? form.set(f.homeTeamId!, []).get(f.homeTeamId!)!).push(hr);
      const ar = hr === 'W' ? 'L' : hr === 'L' ? 'W' : 'D';
      (form.get(f.awayTeamId!) ?? form.set(f.awayTeamId!, []).get(f.awayTeamId!)!).push(ar);
      applied = true;
    }
    if (!applied) continue;

    for (const r of groupRows) {
      if (r.teamId != null && form.has(r.teamId)) r.form = form.get(r.teamId)!.join('');
    }
    groupRows.sort(
      (a, b) =>
        b.points - a.points ||
        (b.goalDiff ?? 0) - (a.goalDiff ?? 0) ||
        (b.goalsFor ?? 0) - (a.goalsFor ?? 0),
    );
    groupRows.forEach((r, i) => {
      r.rank = i + 1;
    });
  }

  // Re-order the flat array by group + (possibly recomputed) rank so consumers render correctly.
  result.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel) || a.rank - b.rank);
  return result;
}
