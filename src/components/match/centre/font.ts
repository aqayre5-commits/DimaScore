import { Inter } from 'next/font/google';

/**
 * Template typeface (Inter, variable). Scoped to the match centre through --mc-font; the navbar,
 * ticker and footer keep the site font. Arabic falls back to the site's Arabic face for script
 * glyphs (see match-centre.css). next/font adds a size-adjusted fallback so the swap does not shift.
 */
export const mcFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--mc-font',
});
