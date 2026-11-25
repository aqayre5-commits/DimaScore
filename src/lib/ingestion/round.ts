/**
 * Parse a round string from API-Football into a sortable numeric value.
 *
 * Group/regular season stages use the natural number after the last dash:
 *   "Group C - 3"         → 3
 *   "Regular Season - 12" → 12
 *   "League Stage - 8"    → 8
 *
 * Qualifying rounds use negative offsets so they sort before the main stage:
 *   "1st Qualifying Round" → -39
 *   "Preliminary Round"    → -30
 *
 * Knockout rounds use synthetic offsets so they sort after all group rounds:
 *   "Knockout Round Play-offs"       → 31
 *   "Round of 32" / "16th Finals"    → 32
 *   "Round of 16" / "8th Finals"     → 33
 *   "Quarter-finals"                 → 34
 *   "Semi-finals"                    → 35
 *   "3rd Place" / "3rd place playoff"→ 36
 *   "Final"                          → 37
 *
 * Unknown/unparseable → null
 */

const KNOCKOUT_MAP: Record<string, number> = {
  'knockout round play-offs': 31,
  'knockout play-offs': 31,
  'round of 32': 32,
  '16th finals': 32,
  'round of 16': 33,
  '8th finals': 33,
  'quarter-finals': 34,
  'semi-finals': 35,
  '3rd place': 36,
  '3rd place playoff': 36,
  '3rd place play-off': 36,
  '3rd place final': 36,
  final: 37,
  'preliminary round': -30,
  'qualifying round': -25,
};

/**
 * Round labels that belong on a knockout bracket (not qualifying).
 * Qualifying is not a knockout round: it gets its own crawlable pages (D2, 17:40 rule).
 */
export const KNOCKOUT_ROUND_NAMES = [
  'Round of 128',
  'Round of 64',
  'Round of 32',
  '16th Finals',
  'Round of 16',
  '8th Finals',
  'Quarter-finals',
  'Quarter-Finals',
  'Semi-finals',
  'Semi-Finals',
  'Knockout Round Play-offs',
  'Knockout Play-offs',
  '3rd Place Final',
  '3rd place',
  '3rd place playoff',
  '3rd Place Play-Off',
  'Final',
] as const;

const ORDINAL_ROUND_RE = /^(\d{1,2})(?:st|nd|rd|th) (qualifying |preliminary )?round$/i;

export function parseRoundNumber(roundString: string): number | null {
  const trimmed = roundString.trim();
  if (!trimmed) return null;

  // Check knockout (and named prelim) map first (case-insensitive)
  const knockoutValue = KNOCKOUT_MAP[trimmed.toLowerCase()];
  if (knockoutValue !== undefined) return knockoutValue;

  const ordinal = trimmed.match(ORDINAL_ROUND_RE);
  if (ordinal) {
    const n = parseInt(ordinal[1], 10);
    if (!Number.isNaN(n) && n > 0) {
      // 1st Qualifying Round → -39, 2nd → -38, … leaving room before Preliminary (-30)
      return -40 + n;
    }
  }

  // Try to extract number after the last " - "
  const dashIdx = trimmed.lastIndexOf(' - ');
  if (dashIdx !== -1) {
    const numPart = trimmed.slice(dashIdx + 3).trim();
    const parsed = parseInt(numPart, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}
