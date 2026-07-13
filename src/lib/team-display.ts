/**
 * Strip the trailing women's-team marker (" W" or " (W)") that API-Football appends to
 * women's national-team names. We adopt Sofascore's convention: on women's-competition
 * surfaces, "Morocco W" is redundant — the page context (a women's tournament) implies it.
 *
 * Source-of-truth names in the DB are left alone so the API-Football sync still works;
 * stripping happens at display time only.
 */
export function stripWomenSuffix(name: string | null | undefined): string {
  if (!name) return '';
  return name.replace(/\s+\(?W\)?$/, '');
}

/**
 * Resolve a renderable flag/logo URL for a team. Prefers the team's own logo (API-Football
 * teams have one), falls back to the country flag on the same media host for national teams
 * that lack a logo (our placeholder women's teams, or anything not yet ingested). Returns
 * null when neither is available — caller decides on a placeholder.
 *
 * Uses media.api-sports.io which is already in the Next.js image allowlist.
 */
export function getTeamFlagUrl(
  team: {
    logoUrl?: string | null;
    isNational?: boolean | null;
    countryCode?: string | null;
  } | null,
): string | null {
  if (!team) return null;
  if (team.logoUrl) return team.logoUrl;
  if (team.isNational && team.countryCode)
    return `https://media.api-sports.io/flags/${team.countryCode.toLowerCase()}.svg`;
  return null;
}

/**
 * Country-flag-FIRST resolver (mirrors the <Flag> component's precedence): national teams always
 * render the 4:3 country flag, ignoring any square crest, so flags stay uniform in a 4:3 box.
 * Clubs fall back to their crest. Use where a national-team flag renders in a 4:3 box (e.g. the
 * homepage hero); prefer getTeamFlagUrl only when a square crest is wanted.
 */
export function getNationalFlagUrl(
  team: {
    logoUrl?: string | null;
    isNational?: boolean | null;
    countryCode?: string | null;
  } | null,
): string | null {
  if (!team) return null;
  if (team.isNational && team.countryCode)
    return `https://media.api-sports.io/flags/${team.countryCode.toLowerCase()}.svg`;
  return team.logoUrl ?? null;
}
