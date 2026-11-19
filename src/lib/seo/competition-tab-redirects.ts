/**
 * Accidental competition "tab" URLs → the competition hub, one 301 hop, locale and slugs preserved.
 *
 * `/{locale}/competition/{country}/{tournament}/fixtures|standings|stats` were never real pages:
 * the `[season]` route treated the tab word as a season slug and served a 200, indexable,
 * self-canonical duplicate of the hub. Fixtures, standings and stats are in-page tabs on the hub,
 * so these paths 301 to it (signed off by SEO Manager, 19 Nov 2026; GSC showed no impressions).
 *
 * Kept dependency-free so `next.config.ts` can import it.
 */

/** Tab words that were reachable as fake season segments. Real season years stay untouched. */
export const COMPETITION_TAB_WORDS = ['fixtures', 'standings', 'stats'] as const;

export const COMPETITION_TAB_REDIRECT = {
  source: `/:locale(fr|en|ar)/competition/:country/:tournament/:tab(${COMPETITION_TAB_WORDS.join('|')})`,
  destination: '/:locale/competition/:country/:tournament',
  statusCode: 301 as const,
};

/** A real season segment is a four-digit year; anything else under `[season]` is not a page. */
export function isSeasonSegment(segment: string): boolean {
  return /^\d{4}$/.test(segment);
}
