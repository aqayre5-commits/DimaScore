/**
 * Three-letter team code for the knockout bracket, where a full club name does not fit.
 *
 * Uses the API-Football code stored in `teams.code` when it is a clean 3-letter Latin code;
 * otherwise a deterministic fallback is built from the English name. The full name stays
 * available to the caller (title + visually-hidden text) for accessibility.
 */

type CodeTeam = {
  code?: string | null;
  name?: Record<string, string> | null;
  shortName?: Record<string, string> | null;
};

/** Leading/trailing club-form tokens that carry no identity ("FC Barcelona", "Real Madrid"). */
const FORM_TOKENS = new Set([
  'fc',
  'cf',
  'ac',
  'sc',
  'as',
  'ss',
  'ssc',
  'us',
  'rc',
  'rcd',
  'cd',
  'ud',
  'sv',
  'fk',
  'sk',
  'bk',
  'if',
  'ik',
  'afc',
  'cfc',
  'sd',
  'real',
  'club',
  'clube',
  'the',
]);
/** Connectors skipped when taking initials ("Paris Saint Germain", "Borussia de Dortmund"). */
const CONNECTORS = new Set([
  'de',
  'del',
  'di',
  'da',
  'do',
  'of',
  'la',
  'le',
  'el',
  'van',
  'von',
  'and',
  'y',
  'e',
]);

function latinTokens(name: string): string[] {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ø/gi, 'o')
    .replace(/æ/gi, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/đ/gi, 'd')
    .replace(/ł/gi, 'l')
    .replace(/[^A-Za-z]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Deterministic 3-letter code from a club name. Pure, stable and Latin-only. */
export function fallbackTeamCode(name: string | null | undefined): string {
  const all = latinTokens(name ?? '');
  if (all.length === 0) return 'TBD';
  let tokens = all.filter((t) => !FORM_TOKENS.has(t.toLowerCase()));
  if (tokens.length === 0) tokens = all; // the name is only form tokens, e.g. "FC"
  const significant = tokens.filter((t) => !CONNECTORS.has(t.toLowerCase()));
  if (significant.length > 0) tokens = significant;
  let code: string;
  if (tokens.length === 1) code = tokens[0].slice(0, 3);
  else if (tokens.length === 2) code = tokens[0][0] + tokens[1].slice(0, 2);
  else code = tokens[0][0] + tokens[1][0] + tokens[2][0];
  return code.toUpperCase();
}

/** The code to show: the stored API-Football code when clean, else the generated fallback. */
export function teamCode(team: CodeTeam | null | undefined): string {
  if (!team) return 'TBD';
  const stored = team.code?.trim();
  if (stored && /^[A-Za-z]{3}$/.test(stored)) return stored.toUpperCase();
  return fallbackTeamCode(team.name?.en ?? team.shortName?.en ?? Object.values(team.name ?? {})[0]);
}
