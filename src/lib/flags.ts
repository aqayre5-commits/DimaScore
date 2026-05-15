/**
 * GB subdivision codes → Unicode tag-sequence flag emoji.
 * These use black flag + tag characters, not regional indicators.
 */
const GB_SUBDIVISION_FLAGS: Record<string, string> = {
  'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  'GB-WLS': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}', // 🏴󠁧󠁢󠁷󠁬󠁳󠁿
};

/**
 * Country code to flag emoji via regional indicator symbols.
 * Accepts 2-letter ISO codes (e.g. "MA" → 🇲🇦) and GB subdivision
 * codes (e.g. "GB-SCT" → 🏴󠁧󠁢󠁳󠁣󠁴󠁿). Returns empty string for unrecognised inputs.
 */
export function codeToFlag(code: string): string {
  const c = code.toUpperCase();
  if (c.length === 2) {
    return String.fromCodePoint(...Array.from(c).map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
  }
  return GB_SUBDIVISION_FLAGS[c] ?? '';
}
