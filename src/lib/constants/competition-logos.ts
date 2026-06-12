/**
 * Competition logo overrides. api-sports serves a generic placeholder shield for some competitions
 * (e.g. World Cup id 1), so we ship custom trophy assets under /public/competitions and prefer them
 * everywhere a competition logo is shown.
 */
export const COMPETITION_LOGO_OVERRIDES: Record<number, string> = {
  1: '/competitions/wc-2026-trophy.png', // World Cup — api-sports has only a placeholder
  6: '/competitions/afcon-trophy.svg', // AFCON
  922: '/competitions/wafcon-trophy.png', // WAFCON
};

/** The custom logo for a competition if one exists, otherwise the provided DB logo url. */
export function resolveCompetitionLogo(
  competitionId: number | null | undefined,
  dbLogoUrl: string | null,
): string | null {
  if (competitionId != null && COMPETITION_LOGO_OVERRIDES[competitionId]) {
    return COMPETITION_LOGO_OVERRIDES[competitionId];
  }
  return dbLogoUrl;
}
