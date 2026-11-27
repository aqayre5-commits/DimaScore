/** Curated high-res logos override the low-res API-Football PNGs. */
export const CURATED_LOGOS: Record<number, string> = {
  1: '/competitions/wc-2026.svg',
  39: '/competitions/premier-league.png',
  2: '/competitions/champions-league.svg',
  6: '/competitions/afcon-trophy.svg',
  61: '/competitions/ligue-1.svg',
  140: '/competitions/la-liga.svg',
  922: '/competitions/wafcon.png',
  202: '/competitions/tunisia-ligue-1.svg',
  203: '/competitions/turkey-super-lig.svg',
};

/** Competition IDs whose API-Football logos are dark artwork that needs
 *  inversion (white) on our dark theme. Curated logos are included. */
export const DARK_LOGOS: Set<number> = new Set([
  2, 3, 29, 36, 39, 61, 82, 140, 203, 233, 525, 848, 922, 1191,
]);

/** Sub-nation flag emojis (Unicode tag sequences). */
const SUB_FLAGS: Record<string, string> = {
  'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  'GB-WLS': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}', // 🏴󠁧󠁢󠁷󠁬󠁳󠁿
};

/** Convert country code to flag emoji. Handles ISO 3166-2 sub-codes. */
export function countryFlag(code: string | null): string | null {
  if (!code) return null;
  if (SUB_FLAGS[code]) return SUB_FLAGS[code];
  if (code.length !== 2) return null;
  const cp1 = 0x1f1e6 + code.toUpperCase().charCodeAt(0) - 65;
  const cp2 = 0x1f1e6 + code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(cp1, cp2);
}
