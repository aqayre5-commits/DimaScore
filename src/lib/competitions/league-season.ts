export interface SeasonOption {
  year: number;
  isCurrent: boolean;
  fixtureCount: number;
}

export interface ResolvedLeagueSeason {
  /** Season the page should render (URL param if valid, else current). */
  seasonYear: number | null;
  /** Picker list — always includes the current season, flags aligned to it. */
  seasons: SeasonOption[];
  currentSeasonYear: number | null;
}

/**
 * Single source of truth for "which season is this league page on?"
 * `is_current` flags on stale rows are overwritten by `currentSeasonYear`.
 */
export function resolveLeagueSeason(
  available: SeasonOption[],
  currentSeasonYear: number | null,
  requestedYear: number | null = null,
): ResolvedLeagueSeason {
  const byYear = new Map<number, SeasonOption>();
  for (const row of available) {
    byYear.set(row.year, {
      year: row.year,
      isCurrent: currentSeasonYear != null && row.year === currentSeasonYear,
      fixtureCount: row.fixtureCount,
    });
  }
  if (currentSeasonYear != null && !byYear.has(currentSeasonYear)) {
    byYear.set(currentSeasonYear, {
      year: currentSeasonYear,
      isCurrent: true,
      fixtureCount: 0,
    });
  }

  const seasons = [...byYear.values()].sort((a, b) => b.year - a.year);
  const requestedOk =
    requestedYear != null && Number.isFinite(requestedYear) && byYear.has(requestedYear);

  return {
    seasonYear: requestedOk ? requestedYear : currentSeasonYear,
    seasons,
    currentSeasonYear,
  };
}

export function formatSeasonLabel(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, '0')}`;
}
