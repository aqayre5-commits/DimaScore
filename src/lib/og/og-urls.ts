import { matchupLabel } from '@/lib/i18n/feed-labels';

/**
 * Path segment Next gives the match opengraph-image route. Next appends a hash of the parent route
 * path when it contains a route group (here "(app)"); it does not depend on the build. Pinned by
 * tests/unit/og/og-urls.test.ts against Next's own normalizeMetadataRoute.
 */
export const MATCH_OG_SEGMENT = 'opengraph-image-2z6s0d';

/** Absolute URL of a match's 1200×630 share image (the file route in match/[id]). */
export function matchOgImageUrl(base: string, locale: string, matchSlug: string): string {
  return `${base}/${locale}/match/${matchSlug}/${MATCH_OG_SEGMENT}`;
}

const OG_ALT_SUFFIX: Record<string, string> = {
  en: 'match card, DimaScore',
  fr: 'fiche du match, DimaScore',
  ar: 'بطاقة المباراة، DimaScore',
};

/** og:image:alt / twitter:image:alt in the page language. */
export function matchOgImageAlt(home: string, away: string, locale: string): string {
  const sep = locale === 'fr' ? ' : ' : locale === 'ar' ? ' — ' : ': ';
  return `${matchupLabel(home, away, locale)}${sep}${OG_ALT_SUFFIX[locale] ?? OG_ALT_SUFFIX.en}`;
}
