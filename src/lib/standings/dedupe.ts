import type { StandingRow } from '@/lib/db/queries';

/**
 * Collapse a standings list to one row per team (keep-first, order preserved).
 *
 * The `standings` table holds duplicate rows per team under variant `group_label`s for some
 * competitions (e.g. Botola Pro: "Botola Pro" + "Botola Pro D1"). For single-table / team-list
 * surfaces (a league's Teams grid, a flat league standings table, a top-N widget) a team must
 * appear exactly once. Group tournaments must NOT use this — there each team legitimately sits in
 * one group and rows should stay partitioned by group_label.
 */
export function dedupeStandingsByTeam(rows: StandingRow[]): StandingRow[] {
  const seen = new Set<number>();
  const out: StandingRow[] = [];
  for (const row of rows) {
    if (row.teamId == null) {
      out.push(row);
      continue;
    }
    if (seen.has(row.teamId)) continue;
    seen.add(row.teamId);
    out.push(row);
  }
  return out;
}
