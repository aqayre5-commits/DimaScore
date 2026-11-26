import { cache } from 'react';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import { getAvailableSeasons, getCurrentSeasonYear } from '@/lib/db/queries/league';
import { resolveLeagueSeason, type ResolvedLeagueSeason } from '@/lib/competitions/league-season';
import { allowedSeasons } from '@/lib/competitions/allowed-seasons';

/**
 * Cached by competition ID only — every Botola slug alias (AR Unicode, EN, mixed)
 * shares one seasons snapshot. Short `season` cacheLife so a rollover cannot pin
 * a finished year on a statically prerendered locale route.
 */
export async function getLeagueSeasonSnapshot(competitionId: number) {
  'use cache';
  cacheLife('season');
  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competitionId),
    getCurrentSeasonYear(db, competitionId),
  ]);
  return { availableSeasons, currentSeasonYear };
}

/** Every edition with data, for tournaments that have an edition page per year. */
export async function getEditionSeasonSnapshot(competitionId: number) {
  'use cache';
  cacheLife('season');
  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competitionId, false),
    getCurrentSeasonYear(db, competitionId),
  ]);
  return { availableSeasons, currentSeasonYear };
}

async function resolveSeason(
  competitionId: number,
  requestedYear: number | null,
  allEditions: boolean,
): Promise<ResolvedLeagueSeason> {
  const { availableSeasons, currentSeasonYear } = await (allEditions
    ? getEditionSeasonSnapshot(competitionId)
    : getLeagueSeasonSnapshot(competitionId));
  // Tournaments with an edition slug per year (wafcon-2024, afcon-2023) serve every edition that has data.
  const allowed = allEditions ? undefined : allowedSeasons(competitionId, availableSeasons);
  return resolveLeagueSeason(availableSeasons, currentSeasonYear, requestedYear, allowed);
}

/**
 * React `cache` per request: `generateMetadata` and the page body resolve the same competition
 * season; they share one snapshot read instead of two sequential ones.
 */
const resolveSeasonCached = cache(resolveSeason);
export const resolveCompetitionSeason = (
  competitionId: number,
  requestedYear: number | null = null,
  allEditions = false,
): Promise<ResolvedLeagueSeason> => resolveSeasonCached(competitionId, requestedYear, allEditions);
