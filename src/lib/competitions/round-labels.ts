/**
 * Canonical names and slugs for feed round labels such as "16th Finals" or "1/8-finals".
 * English uses Round of N / Quarter-finals; French uses the traditional cup names
 * (Seizièmes / Huitièmes de finale); Arabic follows the existing دور الـN style.
 */

const STANDARD: Record<string, string> = {
  final: 'Final',
  finals: 'Final',
  'semi-finals': 'Semi-finals',
  'semi-final': 'Semi-finals',
  semifinals: 'Semi-finals',
  semifinal: 'Semi-finals',
  'semi finals': 'Semi-finals',
  'semi final': 'Semi-finals',
  'quarter-finals': 'Quarter-finals',
  'quarter-final': 'Quarter-finals',
  quarterfinals: 'Quarter-finals',
  quarterfinal: 'Quarter-finals',
  'quarter finals': 'Quarter-finals',
  'quarter final': 'Quarter-finals',
};

const FR_NAMES: Record<string, string> = {
  Final: 'Finale',
  'Semi-finals': 'Demi-finales',
  'Quarter-finals': 'Quarts de finale',
  'Round of 16': 'Huitièmes de finale',
  'Round of 32': 'Seizièmes de finale',
  'Round of 64': '32es de finale',
  'Round of 128': '64es de finale',
  'Round of 256': '128es de finale',
  'Play-offs': 'Barrages',
  'Play-off': 'Barrage',
  'Playoff round': 'Tour des barrages',
  'Knockout play-offs': 'Barrages à élimination directe',
  'Knockout Play-offs': 'Barrages à élimination directe',
  'Knockout Round Play-offs': 'Barrages à élimination directe',
  'Preliminary Round': 'Tour préliminaire',
  'Qualifying Round': 'Tour de qualification',
  Qualifying: 'Qualifications',
  'Group Stage': 'Phase de groupes',
};

/** 2 teams → Final, 4 → Semi-finals, 8 → Quarter-finals, 16+ powers of two → Round of N. */
function nameForTeamCount(teams: number): string | null {
  if (teams === 2) return 'Final';
  if (teams === 4) return 'Semi-finals';
  if (teams === 8) return 'Quarter-finals';
  if (teams >= 16 && (teams & (teams - 1)) === 0) return `Round of ${teams}`;
  return null;
}

function forms(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  const out = new Set<string>([t]);
  const spaced = t.replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  out.add(spaced);
  const slash = t.replace(/^1[- /]+(\d+)[- ]*finals?$/i, '1/$1-finals');
  out.add(slash);
  out.add(slash.replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim());
  return [...out];
}

function parseOne(value: string): string | null {
  const lower = value.replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
  if (!lower) return null;
  const standard = STANDARD[lower.toLowerCase()];
  if (standard) return standard;
  const of = /^round of (\d+)$/i.exec(lower);
  if (of) return nameForTeamCount(Number(of[1])) ?? `Round of ${of[1]}`;
  const nth = /^(?:(\d+)(?:st|nd|rd|th)\s*-?\s*finals?|1\s*\/\s*(\d+)(?:\s*-?\s*finals?)?)$/i.exec(
    lower,
  );
  if (nth) {
    const ties = Number(nth[1] || nth[2]);
    if (Number.isFinite(ties) && ties > 0) return nameForTeamCount(ties * 2);
  }
  return null;
}

/** Stable English name for a feed label or a retired slug ("16th Finals", "8th-finals"). */
export function canonicalRoundLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  for (const form of forms(trimmed)) {
    const parsed = parseOne(form);
    if (parsed) return parsed;
  }
  return trimmed;
}

/**
 * URL slug for a feed label or an incoming slug. "16th Finals" / "16th-finals" → "round-of-32".
 * Does not apply the UEFA-only play-offs alias (`round-of-32` → `knockout-play-offs`).
 */
export function canonicalRoundSlug(slugOrLabel: string): string {
  const canonical = canonicalRoundLabel(slugOrLabel);
  return canonical
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const FR_ORDINAL = (n: number) => (n === 1 ? '1er' : `${n}e`);

const FR_ORDINAL_ROUND =
  /^(\d{1,2})(?:st|nd|rd|th) (qualifying |preliminary )?round(?: qualifying)?( replays)?$/i;
const FR_LEAGUE_STAGE = /^league(?: stage| phase)\s*-\s*(\d+)$/i;
const FR_MATCHDAY = /^(?:matchday|round)\s+(\d+)$/i;

function frenchOrdinalRound(value: string): string | null {
  const ord = FR_ORDINAL_ROUND.exec(value);
  if (ord && Number(ord[1]) > 0) {
    const n = Number(ord[1]);
    const kind = (ord[2] ?? '').trim().toLowerCase();
    const qualifyingTail = /round qualifying/i.test(value) || kind === 'qualifying';
    const preliminary = kind === 'preliminary';
    const replays = Boolean(ord[3]);
    let name: string;
    if (preliminary) name = `${FR_ORDINAL(n)} tour préliminaire`;
    else if (qualifyingTail) name = `${FR_ORDINAL(n)} tour de qualification`;
    else name = `${FR_ORDINAL(n)} tour`;
    return replays ? `${name} (rejoués)` : name;
  }
  const stage = FR_LEAGUE_STAGE.exec(value);
  if (stage) return `Phase de ligue - journée ${stage[1]}`;
  const md = FR_MATCHDAY.exec(value);
  if (md) return md[0].toLowerCase().startsWith('matchday') ? `Journée ${md[1]}` : `Tour ${md[1]}`;
  return null;
}

function frenchSegment(seg: string): string | null {
  const canonical = canonicalRoundLabel(seg);
  if (FR_NAMES[canonical]) return FR_NAMES[canonical];
  if (FR_NAMES[seg.trim()]) return FR_NAMES[seg.trim()];
  return frenchOrdinalRound(canonical) ?? frenchOrdinalRound(seg.trim());
}

function frenchRound(round: string): string | null {
  const whole = frenchSegment(round);
  if (whole) return whole;
  const parts = round.split(' - ');
  if (parts.length < 2) return null;
  const out = parts.map((p) => frenchSegment(p.trim()));
  return out.every((p) => p != null) ? out.join(' - ') : null;
}

/**
 * Display name in the page language. English is the canonical name; French and
 * the Nth-Finals aliases are mapped here. Arabic still uses `localizeRound`.
 */
export function frenchRoundLabel(raw: string): string {
  return frenchRound(raw.trim()) ?? canonicalRoundLabel(raw);
}
