/**
 * WC 2026 bracket builder — transforms WC_2026_SCHEDULE into BracketMatch[]
 * for the knockout bracket visualization.
 *
 * Pre-computes bracket data for all 3 locales at module load time (FIX 5).
 * Call site: KnockoutTab reads WC_2026_BRACKETS_BY_LOCALE[locale].
 */

import type { Locale } from '@/lib/i18n/config';
import type {
  BracketMatch,
  BracketSide,
  KnockoutPhase,
} from '@/components/tournament/BracketMatchCell';
import { WC_2026_SCHEDULE, type WC2026Match } from './wc2026-schedule';

// ── Bracket position map ──────────────────────────────────────────────────
// Visual order: top-to-bottom per column, left-to-right across columns.
// feedsInto = FIFA match number of the next-round match this winner enters.
// Derived from W-codes in WC_2026_SCHEDULE (e.g. M89 = W74 vs W77).

interface BracketPosition {
  fifaMatchNumber: number;
  phase: KnockoutPhase;
  side: BracketSide;
  feedsInto: number | null;
  loserFeedsInto?: number;
}

const BRACKET_POSITIONS: BracketPosition[] = [
  // Left R32 (col 1, 8 cells, rowSpan=2)
  { fifaMatchNumber: 74, phase: 'r32', side: 'left', feedsInto: 89 },
  { fifaMatchNumber: 77, phase: 'r32', side: 'left', feedsInto: 89 },
  { fifaMatchNumber: 73, phase: 'r32', side: 'left', feedsInto: 90 },
  { fifaMatchNumber: 75, phase: 'r32', side: 'left', feedsInto: 90 },
  { fifaMatchNumber: 83, phase: 'r32', side: 'left', feedsInto: 93 },
  { fifaMatchNumber: 84, phase: 'r32', side: 'left', feedsInto: 93 },
  { fifaMatchNumber: 81, phase: 'r32', side: 'left', feedsInto: 94 },
  { fifaMatchNumber: 82, phase: 'r32', side: 'left', feedsInto: 94 },
  // Left R16 (col 2, 4 cells, rowSpan=4)
  { fifaMatchNumber: 89, phase: 'r16', side: 'left', feedsInto: 97 },
  { fifaMatchNumber: 90, phase: 'r16', side: 'left', feedsInto: 97 },
  { fifaMatchNumber: 93, phase: 'r16', side: 'left', feedsInto: 98 },
  { fifaMatchNumber: 94, phase: 'r16', side: 'left', feedsInto: 98 },
  // Left QF (col 3, 2 cells, rowSpan=8)
  { fifaMatchNumber: 97, phase: 'qf', side: 'left', feedsInto: 101 },
  { fifaMatchNumber: 98, phase: 'qf', side: 'left', feedsInto: 101 },
  // Left SF (col 4, 1 cell, rowSpan=16)
  { fifaMatchNumber: 101, phase: 'sf', side: 'left', feedsInto: 104, loserFeedsInto: 103 },
  // Final (col 5, center)
  { fifaMatchNumber: 104, phase: 'final', side: 'center', feedsInto: null },
  // Right SF (col 6, 1 cell, rowSpan=16)
  { fifaMatchNumber: 102, phase: 'sf', side: 'right', feedsInto: 104, loserFeedsInto: 103 },
  // Right QF (col 7, 2 cells, rowSpan=8)
  { fifaMatchNumber: 99, phase: 'qf', side: 'right', feedsInto: 102 },
  { fifaMatchNumber: 100, phase: 'qf', side: 'right', feedsInto: 102 },
  // Right R16 (col 8, 4 cells, rowSpan=4)
  { fifaMatchNumber: 91, phase: 'r16', side: 'right', feedsInto: 99 },
  { fifaMatchNumber: 92, phase: 'r16', side: 'right', feedsInto: 99 },
  { fifaMatchNumber: 95, phase: 'r16', side: 'right', feedsInto: 100 },
  { fifaMatchNumber: 96, phase: 'r16', side: 'right', feedsInto: 100 },
  // Right R32 (col 9, 8 cells, rowSpan=2)
  { fifaMatchNumber: 76, phase: 'r32', side: 'right', feedsInto: 91 },
  { fifaMatchNumber: 78, phase: 'r32', side: 'right', feedsInto: 91 },
  { fifaMatchNumber: 79, phase: 'r32', side: 'right', feedsInto: 92 },
  { fifaMatchNumber: 80, phase: 'r32', side: 'right', feedsInto: 92 },
  { fifaMatchNumber: 86, phase: 'r32', side: 'right', feedsInto: 95 },
  { fifaMatchNumber: 88, phase: 'r32', side: 'right', feedsInto: 95 },
  { fifaMatchNumber: 85, phase: 'r32', side: 'right', feedsInto: 96 },
  { fifaMatchNumber: 87, phase: 'r32', side: 'right', feedsInto: 96 },
];

const THIRD_PLACE_NUMBER = 103;

// ── Slot label expansion (FIX 2: cell text = verbatim FIFA notation) ─────

const ORDINALS: Record<string, Record<'1st' | '2nd' | '3rd', string>> = {
  en: { '1st': '1st', '2nd': '2nd', '3rd': '3rd' },
  fr: { '1st': '1er', '2nd': '2ème', '3rd': '3ème' },
  ar: { '1st': 'الأول', '2nd': 'الثاني', '3rd': 'الثالث' },
};

const GROUP_WORD: Record<string, string> = {
  en: 'Group',
  fr: 'Groupe',
  ar: 'المجموعة',
};

const WINNER_OF: Record<string, string> = {
  en: 'Winner of M',
  fr: 'Vainqueur de M',
  ar: 'فائز المباراة ',
};

const RUNNER_UP_OF: Record<string, string> = {
  en: 'Runner-up of M',
  fr: 'Finaliste de M',
  ar: 'وصيف المباراة ',
};

const VS_WORD: Record<string, string> = {
  en: 'vs',
  fr: 'vs',
  ar: 'ضد',
};

/**
 * Expands a FIFA slot code into a verbose, screen-reader-friendly label.
 * Used for ariaLabel (FIX 1) and title attributes on BracketMatchCell.
 *
 * Examples:
 *   "1E"      → "1st Group E" (en)
 *   "3ABCDF"  → "3rd (ABCDF)" (en)
 *   "W74"     → "Winner of M74" (en)
 *   "RU101"   → "Runner-up of M101" (en)
 *   "MAR"     → "MAR" (team code, returned as-is)
 */
export function expandSlotLabelVerbose(slot: string, locale: Locale): string {
  const ord = ORDINALS[locale] ?? ORDINALS.en;
  const grp = GROUP_WORD[locale] ?? GROUP_WORD.en;
  const win = WINNER_OF[locale] ?? WINNER_OF.en;
  const ru = RUNNER_UP_OF[locale] ?? RUNNER_UP_OF.en;

  // "1A"–"2L" — group position (1st/2nd of Group X)
  const groupPos = slot.match(/^([12])([A-L])$/);
  if (groupPos) {
    const ordKey = groupPos[1] === '1' ? '1st' : '2nd';
    return `${ord[ordKey]} ${grp} ${groupPos[2]}`;
  }

  // "3ABCDF" — best 3rd-placed team from pool
  const thirdPool = slot.match(/^3([A-L]{2,})$/);
  if (thirdPool) {
    return `${ord['3rd']} (${thirdPool[1]})`;
  }

  // "W74" — winner of match N
  const winner = slot.match(/^W(\d+)$/);
  if (winner) {
    return `${win}${winner[1]}`;
  }

  // "RU101" — runner-up of match N (FIX 2)
  const runnerUp = slot.match(/^RU(\d+)$/);
  if (runnerUp) {
    return `${ru}${runnerUp[1]}`;
  }

  // 3-letter team code or unknown — return as-is
  return slot;
}

// ── Round labels (pure lookup, no i18n hooks) ─────────────────────────────

const ROUND_LABELS: Record<string, Record<KnockoutPhase, string>> = {
  en: {
    r32: 'Round of 32',
    r16: 'Round of 16',
    qf: 'Quarter-finals',
    sf: 'Semi-finals',
    final: 'Final',
    '3rd': '3rd place',
  },
  fr: {
    r32: '32es de finale',
    r16: '16es de finale',
    qf: 'Quarts de finale',
    sf: 'Demi-finales',
    final: 'Finale',
    '3rd': '3ème place',
  },
  ar: {
    r32: 'دور الـ32',
    r16: 'دور الـ16',
    qf: 'ربع النهائي',
    sf: 'نصف النهائي',
    final: 'النهائي',
    '3rd': 'المركز الثالث',
  },
};

// ── Date formatting (SSR-safe, no Intl.DateTimeFormat) ─────────────────────

const MONTHS: Record<string, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ],
  ar: [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ],
};

function formatShortDate(dateStr: string, locale: Locale): string {
  const [, mm, dd] = dateStr.split('-');
  const monthIdx = parseInt(mm, 10) - 1;
  const day = parseInt(dd, 10);
  const monthNames = MONTHS[locale] ?? MONTHS.en;
  return locale === 'en' ? `${monthNames[monthIdx]} ${day}` : `${day} ${monthNames[monthIdx]}`;
}

// ── Builder ───────────────────────────────────────────────────────────────

export interface BracketData {
  matches: BracketMatch[];
  thirdPlaceMatch: BracketMatch;
}

function toBracketMatch(
  entry: WC2026Match,
  pos: {
    phase: KnockoutPhase;
    side: BracketSide;
    feedsInto: number | null;
    loserFeedsInto?: number;
  },
  locale: Locale,
): BracketMatch {
  const labels = ROUND_LABELS[locale] ?? ROUND_LABELS.en;
  const vs = VS_WORD[locale] ?? VS_WORD.en;
  const homeVerbose = expandSlotLabelVerbose(entry.homeSlot, locale);
  const awayVerbose = expandSlotLabelVerbose(entry.awaySlot, locale);

  return {
    matchId: `m${entry.fifaMatchNumber}`,
    phase: pos.phase,
    matchNumber: entry.fifaMatchNumber,
    fifaMatchNumber: entry.fifaMatchNumber,
    homeLabel: entry.homeSlot,
    awayLabel: entry.awaySlot,
    status: 'placeholder',
    statusLabel: formatShortDate(entry.date, locale),
    feedsInto: pos.feedsInto != null ? `m${pos.feedsInto}` : undefined,
    loserFeedsInto: pos.loserFeedsInto != null ? `m${pos.loserFeedsInto}` : undefined,
    side: pos.side,
    venue: entry.venue,
    date: entry.date,
    roundLabel: labels[pos.phase],
    ariaLabel: `${homeVerbose} ${vs} ${awayVerbose}`,
  };
}

function buildWc2026Bracket(locale: Locale): BracketData {
  const byNumber = new Map<number, WC2026Match>();
  for (const entry of WC_2026_SCHEDULE) {
    byNumber.set(entry.fifaMatchNumber, entry);
  }

  const matches: BracketMatch[] = [];
  for (const pos of BRACKET_POSITIONS) {
    const entry = byNumber.get(pos.fifaMatchNumber);
    if (!entry) continue;
    matches.push(toBracketMatch(entry, pos, locale));
  }

  const thirdEntry = byNumber.get(THIRD_PLACE_NUMBER)!;
  const thirdPlaceMatch = toBracketMatch(
    thirdEntry,
    { phase: '3rd', side: 'center', feedsInto: null },
    locale,
  );

  return { matches, thirdPlaceMatch };
}

/** Pre-computed bracket data for all locales. Module-scope singleton. */
export const WC_2026_BRACKETS_BY_LOCALE: Record<Locale, BracketData> = {
  en: buildWc2026Bracket('en'),
  fr: buildWc2026Bracket('fr'),
  ar: buildWc2026Bracket('ar'),
};
