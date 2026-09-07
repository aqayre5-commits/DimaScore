import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import { getAvailableSeasons, getCurrentSeasonYear } from '@/lib/db/queries/league';
import { resolveLeagueSeason, type ResolvedLeagueSeason } from '@/lib/competitions/league-season';

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

export async function resolveCompetitionSeason(
  competitionId: number,
  requestedYear: number | null = null,
): Promise<ResolvedLeagueSeason> {
  const { availableSeasons, currentSeasonYear } = await getLeagueSeasonSnapshot(competitionId);
  return resolveLeagueSeason(availableSeasons, currentSeasonYear, requestedYear);
}
