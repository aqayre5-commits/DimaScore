import type { TeamSnapshot } from '@/lib/db/queries-hydrate';

/** Minimal shape needed to decide whether a Home fixture has usable team names. */
export type HomeDisplayableFixture = {
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
};

/** Exact placeholder labels the feed stores when a side is not a real team. */
const PLACEHOLDER_NAME = /^(tbd|t\.b\.d\.?|tbc|n\/?a|n\.a\.|unknown)$/i;

function listedNames(team: TeamSnapshot): string[] {
  const out: string[] = [];
  for (const src of [team.name, team.shortName]) {
    if (!src) continue;
    for (const value of Object.values(src)) {
      if (typeof value === 'string' && value.trim()) out.push(value.trim());
    }
  }
  return out;
}

/**
 * A side is unusable when it is missing, has no name/shortName, or every stored name is a
 * placeholder (TBD, Unknown, and the same idea). A FIFA/club code alone is not a name.
 */
export function isBrokenHomeTeam(team: TeamSnapshot | null): boolean {
  if (!team) return true;
  const names = listedNames(team);
  if (names.length === 0) return true;
  return names.every((name) => PLACEHOLDER_NAME.test(name));
}

/**
 * Home-only gate. Youth matches, youth friendlies included, are shown. A fixture is hidden only
 * when a side's data is broken (TBD, unknown, or no name).
 *
 * The ticker and the old homepage keep using `isDisplayableFixture` in
 * `src/lib/db/queries/homepage.ts`, which still hides youth sides in the Friendlies feed. Home
 * used to call that shared function; it now uses this one so those other surfaces do not change.
 */
export function isHomeDisplayableFixture(f: HomeDisplayableFixture): boolean {
  return !isBrokenHomeTeam(f.homeTeam) && !isBrokenHomeTeam(f.awayTeam);
}
