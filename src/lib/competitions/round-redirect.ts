import { permanentRedirect } from 'next/navigation';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { PLAYOFFS_ALIAS_SLUGS } from '@/lib/competitions/bracket';
import { KNOCKOUT_PLAYOFFS_SLUG } from '@/lib/competitions/domestic-ties';
import { canonicalRoundSlug } from '@/lib/competitions/round-labels';

/** Retired / alternate spellings of the play-off stage ('knockout', 'round-of-32', …) for the UEFA cups. */
export function isPlayoffsAlias(competitionId: number, roundSlug: string): boolean {
  return (
    getCompetitionFormat(competitionId)?.leaguePhase != null &&
    (PLAYOFFS_ALIAS_SLUGS as readonly string[]).includes(roundSlug)
  );
}

/**
 * Retired "Nth Finals" / "1/N-finals" slugs, then the UEFA play-offs alias.
 * One hop: `/round/16th-finals` on a UEFA cup goes straight to `/round/knockout-play-offs`.
 */
export function resolveRedirectRoundSlug(competitionId: number, roundSlug: string): string | null {
  const canonical = canonicalRoundSlug(roundSlug) || roundSlug;
  const target =
    isPlayoffsAlias(competitionId, canonical) || isPlayoffsAlias(competitionId, roundSlug)
      ? KNOCKOUT_PLAYOFFS_SLUG
      : canonical;
  return target !== roundSlug ? target : null;
}

/** 308 a retired or UEFA-alias round URL, keeping the season segment. */
export function redirectPlayoffsAlias(
  competitionId: number,
  roundSlug: string,
  competitionPath: string,
  season?: string,
): void {
  const target = resolveRedirectRoundSlug(competitionId, roundSlug);
  if (!target) return;
  permanentRedirect(`${competitionPath}${season ? `/${season}` : ''}/round/${target}`);
}
