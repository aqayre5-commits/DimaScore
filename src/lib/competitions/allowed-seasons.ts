/**
 * Which seasons a competition may surface in menus, links, and default backfills.
 *
 * Rule (Abdilahi, 25 Nov 2026 19:06 Europe/London):
 * - Annual leagues and cups: the current season plus only the previous season.
 * - Non-annual tournaments (World Cup, EURO, Copa América, AFCON, Club World Cup,
 *   Women's World Cup, Olympics, youth World Cups, continental youth cups, and
 *   their qualifiers — each qualifier is its own competition): ONLY the latest
 *   edition. "Latest" means the most recent edition that has been held or is
 *   underway, switching to the next edition when that next edition starts.
 *
 * This helper never deletes data. Older seasons may remain in the DB.
 */

import { getCompetitionFormat, type CompetitionFormatKind } from './formats';

export type SeasonRetention = 'latest-only' | 'current-and-previous';

export interface SeasonWindow {
  year: number;
  isCurrent?: boolean | null;
  /** Inclusive start of the edition, ISO date or datetime. */
  startDate?: string | Date | null;
  /** Inclusive end of the edition, ISO date or datetime. */
  endDate?: string | Date | null;
}

const LATEST_ONLY_KINDS = new Set<CompetitionFormatKind>([
  'finals-tournament',
  'qualifiers',
]);

/**
 * Known kick-off / final dates for finals tournaments, used to decide whether
 * an edition has started. Dates marked uncertain in comments should be
 * confirmed before a future edition is treated as "started".
 */
const KNOWN_EDITION_WINDOWS: Record<number, { year: number; start: string; end: string }[]> = {
  1: [
    { year: 2022, start: '2022-11-20', end: '2022-12-18' },
    { year: 2026, start: '2026-06-11', end: '2026-07-19' },
  ],
  4: [
    { year: 2024, start: '2024-06-14', end: '2024-07-14' },
    // EURO 2028 window is not fully published here; June 2028 is a conservative
    // lower bound so the helper does not switch before the tournament starts.
    { year: 2028, start: '2028-06-01', end: '2028-07-31' },
  ],
  6: [
    { year: 2023, start: '2024-01-13', end: '2024-02-11' },
    { year: 2025, start: '2025-12-21', end: '2026-01-18' },
  ],
  8: [
    { year: 2023, start: '2023-07-20', end: '2023-08-20' },
    { year: 2027, start: '2027-06-24', end: '2027-07-25' },
  ],
  9: [
    { year: 2024, start: '2024-06-20', end: '2024-07-14' },
    { year: 2028, start: '2028-06-01', end: '2028-07-31' },
  ],
  15: [
    { year: 2025, start: '2025-06-14', end: '2025-07-13' },
    { year: 2029, start: '2029-06-01', end: '2029-07-31' },
  ],
  480: [
    { year: 2024, start: '2024-07-24', end: '2024-08-09' },
    { year: 2028, start: '2028-07-14', end: '2028-07-30' },
  ],
  524: [
    { year: 2024, start: '2024-07-25', end: '2024-08-10' },
    { year: 2028, start: '2028-07-15', end: '2028-07-31' },
  ],
  // WAFCON: API-Football files the Jul 2026 edition under season 2025.
  922: [
    { year: 2024, start: '2025-07-05', end: '2025-07-26' },
    { year: 2025, start: '2026-07-25', end: '2026-08-16' },
  ],
  // AFCON 2027 qualifying (id 36) started 24 Sep 2026 (CAF MD1). API year is
  // usually the finals year (2027); without this window, year 2027 would look
  // unstarted in calendar 2026 and the helper would incorrectly keep 2025.
  36: [
    { year: 2025, start: '2024-03-20', end: '2025-03-31' },
    { year: 2027, start: '2026-09-24', end: '2027-03-30' },
  ],
  490: [
    { year: 2025, start: '2025-09-27', end: '2025-10-19' },
    { year: 2027, start: '2027-09-17', end: '2027-10-09' },
  ],
  920: [
    { year: 2024, start: '2024-08-31', end: '2024-09-22' },
    { year: 2026, start: '2026-09-05', end: '2026-09-27' },
  ],
  587: [
    { year: 2023, start: '2023-11-10', end: '2023-12-02' },
    { year: 2026, start: '2026-11-19', end: '2026-12-13' },
  ],
  950: [
    { year: 2024, start: '2024-10-16', end: '2024-11-03' },
    { year: 2026, start: '2026-10-17', end: '2026-11-07' },
  ],
};

export function seasonRetention(competitionId: number): SeasonRetention {
  const format = getCompetitionFormat(competitionId);
  if (format && LATEST_ONLY_KINDS.has(format.kind)) return 'latest-only';
  return 'current-and-previous';
}

function toTime(value: string | Date | null | undefined): number | null {
  if (value == null || value === '') return null;
  const t = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(t) ? t : null;
}

export function editionHasStartedOrHeld(season: SeasonWindow, now: Date): boolean {
  const nowMs = now.getTime();
  const start = toTime(season.startDate);
  if (start != null && start <= nowMs) return true;
  const end = toTime(season.endDate);
  if (end != null && end <= nowMs) return true;
  if (start == null && end == null) {
    const year = season.year;
    const currentYear = now.getUTCFullYear();
    if (year < currentYear) return true;
    if (year > currentYear) return false;
    // Same calendar year, no dates: treat as held or underway (e.g. WC 2026 in Nov 2026).
    return true;
  }
  return false;
}

// Bind known windows when the caller passes a competition id.
function withKnownWindow(competitionId: number, season: SeasonWindow): SeasonWindow {
  if (season.startDate || season.endDate) return season;
  const hit = (KNOWN_EDITION_WINDOWS[competitionId] ?? []).find((w) => w.year === season.year);
  if (!hit) return season;
  return { ...season, startDate: hit.start, endDate: hit.end };
}

export function editionHasStartedOrHeldFor(
  competitionId: number,
  season: SeasonWindow,
  now: Date,
): boolean {
  return editionHasStartedOrHeld(withKnownWindow(competitionId, season), now);
}

export function allowedSeasons(
  competitionId: number,
  seasons: SeasonWindow[],
  now: Date = new Date(),
): number[] {
  if (seasons.length === 0) return [];
  const retention = seasonRetention(competitionId);

  if (retention === 'latest-only') {
    const started = seasons.filter((s) => editionHasStartedOrHeldFor(competitionId, s, now));
    if (started.length === 0) return [];
    return [Math.max(...started.map((s) => s.year))];
  }

  const years = [...new Set(seasons.map((s) => s.year))].sort((a, b) => b - a);
  const current =
    seasons.find((s) => s.isCurrent)?.year ??
    years.find((y) => y <= now.getUTCFullYear()) ??
    years[0];
  if (current == null) return [];
  const previous = years.find((y) => y < current);
  return previous != null ? [current, previous] : [current];
}

export function filterSeasonsByPolicy<T extends SeasonWindow>(
  competitionId: number,
  seasons: T[],
  now?: Date,
): T[] {
  const allowed = new Set(allowedSeasons(competitionId, seasons, now));
  return seasons.filter((s) => allowed.has(s.year));
}
