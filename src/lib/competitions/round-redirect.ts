import { permanentRedirect } from 'next/navigation';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { PLAYOFFS_ALIAS_SLUGS } from '@/lib/competitions/bracket';
import { KNOCKOUT_PLAYOFFS_SLUG } from '@/lib/competitions/domestic-ties';

/** Retired / alternate spellings of the play-off stage ('knockout', 'round-of-32', …) for the UEFA cups. */
export function isPlayoffsAlias(competitionId: number, roundSlug: string): boolean {
  return (
    getCompetitionFormat(competitionId)?.leaguePhase != null &&
    (PLAYOFFS_ALIAS_SLUGS as readonly string[]).includes(roundSlug)
  );
}

/** 308 an alias round URL to `/round/knockout-play-offs`, keeping the season segment. */
export function redirectPlayoffsAlias(
  competitionId: number,
  roundSlug: string,
  competitionPath: string,
  season?: string,
): void {
  if (!isPlayoffsAlias(competitionId, roundSlug)) return;
  permanentRedirect(
    `${competitionPath}${season ? `/${season}` : ''}/round/${KNOCKOUT_PLAYOFFS_SLUG}`,
  );
}
