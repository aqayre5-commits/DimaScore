/**
 * Parse a round string from API-Football into a sortable numeric value.
 *
 * Group/regular season stages use the natural number after the last dash:
 *   "Group C - 3"         → 3
 *   "Regular Season - 12" → 12
 *
 * Knockout rounds use synthetic offsets so they sort after all group rounds:
 *   "Round of 32"                    → 32
 *   "Round of 16"                    → 33
 *   "Quarter-finals"                 → 34
 *   "Semi-finals"                    → 35
 *   "3rd Place" / "3rd place playoff"→ 36
 *   "Final"                          → 37
 *
 * Unknown/unparseable → null
 */

const KNOCKOUT_MAP: Record<string, number> = {
  'round of 32': 32,
  'round of 16': 33,
  'quarter-finals': 34,
  'semi-finals': 35,
  '3rd place': 36,
  '3rd place playoff': 36,
  final: 37,
};

export function parseRoundNumber(roundString: string): number | null {
  const trimmed = roundString.trim();
  if (!trimmed) return null;

  // Check knockout map first (case-insensitive)
  const knockoutValue = KNOCKOUT_MAP[trimmed.toLowerCase()];
  if (knockoutValue !== undefined) return knockoutValue;

  // Try to extract number after the last " - "
  const dashIdx = trimmed.lastIndexOf(' - ');
  if (dashIdx !== -1) {
    const numPart = trimmed.slice(dashIdx + 3).trim();
    const parsed = parseInt(numPart, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}
