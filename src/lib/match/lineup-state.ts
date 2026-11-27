/**
 * Fixture-level lineup presentation: hide the tab, list the XI, or draw the pitch.
 * Derived only from stored lineup rows — not from live API responses.
 */

export type LineupState = 'none' | 'list' | 'full';

/** A stored side, as returned by getMatchLineups (or a test double). */
export type LineupStateInput = {
  formation?: string | null;
  starters?: Array<{ grid?: string | null }> | null;
  substitutes?: unknown[] | null;
};

/** Provider "line:column" grid used to place a starter on the pitch. */
export const STARTER_GRID = /^\d+:\d+$/;

function hasPlayers(side: LineupStateInput): boolean {
  return (side.starters?.length ?? 0) + (side.substitutes?.length ?? 0) > 0;
}

function hasFormation(side: LineupStateInput): boolean {
  return !!side.formation?.trim();
}

function hasUsableGrid(grid: string | null | undefined): boolean {
  return !!grid && STARTER_GRID.test(String(grid).trim());
}

/** True when this side can be drawn on the pitch: a formation, and every starter has a grid. */
export function isFullPitchSide(side: LineupStateInput): boolean {
  const starters = side.starters ?? [];
  return hasFormation(side) && starters.length > 0 && starters.every((s) => hasUsableGrid(s.grid));
}

/**
 * One state for the whole fixture. Both sides must have players; otherwise `none`.
 * `full` requires a formation and a usable grid on every starter of every side
 * that has players. Anything else with players is `list`.
 */
export function lineupState(lineups: readonly LineupStateInput[] | null | undefined): LineupState {
  const sides = (lineups ?? []).filter(hasPlayers);
  if (sides.length < 2) return 'none';
  return sides.every(isFullPitchSide) ? 'full' : 'list';
}
