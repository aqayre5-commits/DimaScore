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

/** Path segment of the competition opengraph-image route (competition/[country]/[tournament]). */
export const COMPETITION_OG_SEGMENT = 'opengraph-image-i9zysm';

/**
 * Absolute URL of a competition's 1200×630 share image. `country` and `tournament` are the decoded
 * route segments; they are percent-encoded here as Next does for the file route's own og:image.
 */
export function competitionOgImageUrl(
  base: string,
  locale: string,
  country: string,
  tournament: string,
): string {
  const seg = (s: string) => encodeURIComponent(s);
  return `${base}/${locale}/competition/${seg(country)}/${seg(tournament)}/${COMPETITION_OG_SEGMENT}`;
}

const COMPETITION_ALT_SUFFIX: Record<string, string> = {
  en: 'competition card, DimaScore',
  fr: 'fiche de la compétition, DimaScore',
  ar: 'بطاقة البطولة، DimaScore',
};

/** og:image:alt / twitter:image:alt for a competition share image, in the page language. */
export function competitionOgImageAlt(name: string, locale: string): string {
  const sep = locale === 'fr' ? ' : ' : locale === 'ar' ? ' — ' : ': ';
  return `${name}${sep}${COMPETITION_ALT_SUFFIX[locale] ?? COMPETITION_ALT_SUFFIX.en}`;
}

/**
 * openGraph.images + twitter for a competition page (hub, season, bracket): the competition share
 * image with a page-language alt. Without this the pages inherited the layout's site-default
 * twitter:image and the route's English alt.
 */
export function competitionShareMeta(args: {
  base: string;
  locale: string;
  country: string;
  tournament: string;
  name: string;
  title: string;
  description: string;
}) {
  const image = {
    url: competitionOgImageUrl(args.base, args.locale, args.country, args.tournament),
    width: 1200,
    height: 630,
    type: 'image/png',
    alt: competitionOgImageAlt(args.name, args.locale),
  };
  return {
    images: [image],
    twitter: {
      card: 'summary_large_image' as const,
      title: args.title,
      description: args.description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
