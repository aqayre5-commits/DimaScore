import { permanentRedirect } from 'next/navigation';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { getMetadataForCompetition } from '@/lib/constants/tournament-metadata';

/**
 * A season URL outside the allowed window (current + last, see allowed-seasons) is not a page:
 * 308 it to the competition's current-season URL so old links keep their value and nothing
 * out-of-window is indexed. No data is deleted. Constants-driven tournaments (World Cup, AFCON,
 * WAFCON) resolve editions their own way and are left alone.
 */
export async function redirectOutOfWindowSeason(
  competitionId: number,
  seasonYear: number,
  currentSeasonPath: string,
): Promise<void> {
  if (getMetadataForCompetition(competitionId)?.type === 'cup') return;
  const resolved = await resolveCompetitionSeason(competitionId, seasonYear);
  if (resolved.requestedOutOfWindow) permanentRedirect(currentSeasonPath);
}
