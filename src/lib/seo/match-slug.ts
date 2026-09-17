/**
 * Slug+ID URLs for match pages: `/{locale}/match/{home}-{away}-{id}` (Phase 15, Task D).
 *
 * The trailing numeric ID is the stable, canonical key (resolution is by ID, so a stale/renamed
 * name-part self-heals via a 301 to the canonical slug — mirrors the team/player scheme in 15.8).
 * The name-part is transliterated-Latin and identical across locales, so the ID stays byte-identical
 * in all three hreflang trees. Team slugs are stored as `name-id` (e.g. `real-betis-543`); the base
 * (`real-betis`) is the keyword part.
 */

/** Drop the trailing `-<id>` from a stored team slug → the keyword base (`real-betis-543` → `real-betis`). */
export function teamSlugBase(teamSlug: string | null | undefined): string {
  return (teamSlug ?? '').replace(/-\d+$/, '');
}

/**
 * Canonical match slug: `{homeBase}-{awayBase}-{id}`. Falls back to the bare id when a team slug is
 * missing, so the URL is always resolvable.
 */
export function buildMatchSlug(
  homeSlug: string | null | undefined,
  awaySlug: string | null | undefined,
  fixtureId: number,
): string {
  const home = teamSlugBase(homeSlug);
  const away = teamSlugBase(awaySlug);
  return home && away ? `${home}-${away}-${fixtureId}` : `${fixtureId}`;
}

/**
 * Canonical internal href for a match: `/{locale}/match/{home}-{away}-{id}`. Use this at every
 * link site so clicks land directly on the canonical slug URL (no bare-id → 301 hop). Degrades to
 * `/{locale}/match/{id}` when team slugs aren't in scope — still resolvable, self-heals to canonical.
 */
export function matchHref(
  locale: string,
  fixture: { id: number; homeSlug?: string | null; awaySlug?: string | null },
): string {
  return `/${locale}/match/${buildMatchSlug(fixture.homeSlug, fixture.awaySlug, fixture.id)}`;
}
