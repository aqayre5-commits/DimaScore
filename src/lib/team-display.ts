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
