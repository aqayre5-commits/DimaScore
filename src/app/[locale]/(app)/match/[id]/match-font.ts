import { Source_Sans_3 } from 'next/font/google';

/**
 * Typeface of the match page body (header card, tabs, cards), matched to the redesign mockups.
 * Scoped to the match route only — navbar, ticker and footer keep the site font. One variable
 * Latin file is preloaded (latin-ext loads on demand via unicode-range); next/font adds a
 * size-adjusted local fallback so the swap does not shift layout.
 */
export const matchFont = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
});

/** Arabic: Latin glyphs (digits, scores) from the match face, Arabic script from the site's Arabic face. */
export function matchFontFamily(rtl: boolean): string {
  if (!rtl) return matchFont.style.fontFamily;
  const primary = matchFont.style.fontFamily.split(',')[0];
  return `${primary}, var(--font-ibm-plex-arabic), sans-serif`;
}
