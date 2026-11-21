/**
 * Render-time localisation of English strings that come straight from the football data feed
 * (status codes, statistics types, round/stage names, standings group labels and zone notes,
 * player positions). Only Arabic is mapped here; other locales and unknown strings pass through
 * unchanged, so a new feed value never renders empty.
 */
import {
  AR_GROUP_LABELS,
  AR_MATCH_STATUS,
  AR_POSITIONS,
  AR_RAIL_LABELS,
  AR_ROUND_TEMPLATES,
  AR_STANDING_ZONES,
  AR_STAT_TYPES,
} from './feed-labels-ar';

const PLACEHOLDER: Record<string, string> = {
  n: '(\\d+)',
  group: '([A-L])',
  league: '([A-D])',
  letter: '([A-L])',
};

type Compiled = { re: RegExp; names: string[]; ar: string };

function compile(table: Record<string, string>): Compiled[] {
  return Object.entries(table).map(([en, ar]) => {
    const names: string[] = [];
    const pattern = en
      .split(/(\{[a-z]+\})/)
      .map((part) => {
        const m = /^\{([a-z]+)\}$/.exec(part);
        if (m && PLACEHOLDER[m[1]]) {
          names.push(m[1]);
          return PLACEHOLDER[m[1]];
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('');
    return { re: new RegExp(`^${pattern}$`, 'i'), names, ar };
  });
}

let roundTemplates: Compiled[] | null = null;
let railTemplates: Compiled[] | null = null;

function applyTemplates(value: string, templates: Compiled[]): string | null {
  for (const t of templates) {
    const m = t.re.exec(value);
    if (!m) continue;
    let out = t.ar;
    t.names.forEach((name, i) => {
      out = out.split(`{${name}}`).join(m[i + 1]);
    });
    return out;
  }
  return null;
}

function lookup(table: Record<string, string>, value: string): string | null {
  return table[value] ?? table[value.trim()] ?? null;
}

const isAr = (locale: string) => locale === 'ar';

/** Provider status code (FT, HT, PST…) → short badge label. */
export function localizeMatchStatus(code: string, locale: string): string {
  if (!isAr(locale)) return code;
  return AR_MATCH_STATUS[code] ?? code;
}

/** Team statistics type ("Ball Possession", "Corner Kicks"…) → label. */
export function localizeStatType(type: string, locale: string): string {
  if (!isAr(locale)) return type;
  if (AR_STAT_TYPES[type]) return AR_STAT_TYPES[type];
  const lower = type.toLowerCase();
  const hit = Object.keys(AR_STAT_TYPES).find((k) => k.toLowerCase() === lower);
  return hit ? AR_STAT_TYPES[hit] : type;
}

/** Feed round or group label ("Regular Season - 7", "Group H", "League A - Group B"). */
export function localizeRound(round: string | null | undefined, locale: string): string {
  if (!round) return '';
  if (!isAr(locale)) return round;
  return arabicRound(round.trim()) ?? round;
}

/**
 * Generic round names the feed uses beyond the translator's pack (new seasons, other cups).
 * Hand-written to the pack's terminology (الدور / الجولة / الملحق / دور الـN); the pack wins on
 * any overlap. Ordinals cover "1st…10th <Qualifying|Preliminary> Round".
 */
const AR_ROUND_EXTRA: Record<string, string> = {
  'Knockout Round Play-offs': 'ملحق الأدوار الإقصائية',
  'Knockout Play-offs': 'ملحق الأدوار الإقصائية',
  'Promotion Play-offs': 'ملحق الصعود',
  'Relegation Play-offs': 'ملحق الهبوط',
  'Play-off': 'الملحق',
  Playoffs: 'الملحق',
  'Relegation Round': 'مجموعة الهبوط',
  'Championship Round': 'مجموعة اللقب',
  'Group Stage': 'دور المجموعات',
  'League Stage': 'مرحلة الدوري',
  'Qualifying Round': 'الدور التأهيلي',
  Qualifying: 'التصفيات',
  'Final Round': 'الدور النهائي',
  Finals: 'النهائي',
  'Quarter-Finals': 'ربع النهائي',
  '8th Finals': 'دور الـ16',
  '3rd Place': 'مباراة المركز الثالث',
  'Round of {n}': 'دور الـ{n}',
  'Round {n}': 'الجولة {n}',
  'Matchday {n}': 'الجولة {n}',
  '{n}': 'الجولة {n}',
};

const AR_ORDINALS = [
  '',
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
];
const ORDINAL_ROUND_RE = /^(\d{1,2})(?:st|nd|rd|th) (Qualifying |Preliminary )?Round$/i;

let extraTemplates: Compiled[] | null = null;

function arabicRoundSegment(seg: string): string | null {
  const exact =
    lookup(AR_GROUP_LABELS, seg) ?? lookup(AR_ROUND_TEMPLATES, seg) ?? lookup(AR_ROUND_EXTRA, seg);
  if (exact) return exact;
  roundTemplates ??= compile(AR_ROUND_TEMPLATES);
  extraTemplates ??= compile(AR_ROUND_EXTRA);
  const templated = applyTemplates(seg, roundTemplates) ?? applyTemplates(seg, extraTemplates);
  if (templated) return templated;
  const ord = ORDINAL_ROUND_RE.exec(seg);
  if (ord && AR_ORDINALS[Number(ord[1])]) {
    const kind = ord[2]?.trim().toLowerCase();
    const base =
      kind === 'qualifying'
        ? 'الدور التأهيلي'
        : kind === 'preliminary'
          ? 'الدور التمهيدي'
          : 'الدور';
    return `${base} ${AR_ORDINALS[Number(ord[1])]}`;
  }
  return null;
}

/** Whole label first, then " - "-separated parts ("Play-offs - Semi-finals"); null if any part is unknown. */
function arabicRound(round: string): string | null {
  const whole = arabicRoundSegment(round);
  if (whole) return whole;
  const parts = round.split(' - ');
  if (parts.length < 2) return null;
  const out = parts.map((p) => arabicRoundSegment(p.trim()));
  return out.every((p) => p != null) ? out.join(' - ') : null;
}

/** Standings group heading from the feed. */
export function localizeGroupLabel(label: string | null | undefined, locale: string): string {
  return localizeRound(label, locale);
}

/** Standings zone note ("Relegation - Botola 2"). Returns null when there is no Arabic. */
export function localizeStandingZone(description: string, locale: string): string | null {
  if (!isAr(locale)) return null;
  return lookup(AR_STANDING_ZONES, description);
}

/** Player position: letter (G/D/M/F), abbreviation (GK/DEF/MID/FWD) or full word. */
export function localizePosition(position: string | null | undefined, locale: string): string {
  if (!position) return '';
  if (!isAr(locale)) return position;
  return AR_POSITIONS[position] ?? position;
}

/** Compact round code from resolveContextLabel (R16, QF, SF, F, 3rd, MD 7, Group A). */
export function localizeContextLabel(label: string | null | undefined, locale: string): string {
  if (!label) return '';
  if (!isAr(locale)) return label;
  if (AR_RAIL_LABELS[label]) return AR_RAIL_LABELS[label];
  railTemplates ??= compile(AR_RAIL_LABELS);
  return applyTemplates(label, railTemplates) ?? localizeRound(label, locale);
}

/** Lower-case connector in a fixture name: "Morocco vs Spain" / "المغرب ضد إسبانيا". */
export function versusWord(locale: string): string {
  return locale === 'ar' ? 'ضد' : 'vs';
}

/** Fixture name for breadcrumbs, aria labels and compact schema names, in the page language. */
export function matchupLabel(home: string, away: string, locale: string): string {
  return `${home} ${versusWord(locale)} ${away}`;
}

/** Goal-scorer marker after the minute: "(OG)" / "(CSC)" / "(هـ.ذ)", "(pen.)" / "(ج.ت)". */
export function goalMarker(kind: 'ownGoal' | 'penalty', locale: string): string {
  const own: Record<string, string> = { en: 'OG', fr: 'CSC', ar: 'هـ.ذ' };
  const pen: Record<string, string> = { en: 'pen.', fr: 'pen.', ar: 'ج.ت' };
  const table = kind === 'ownGoal' ? own : pen;
  return `(${table[locale] ?? table.en})`;
}

/** Alt text for a team crest (club) or flag (national team), in the page language. */
export function crestAlt(name: string, locale: string, isFlag: boolean): string {
  if (locale === 'ar') return `${isFlag ? 'علم' : 'شعار'} ${name}`;
  if (locale === 'fr') return `${isFlag ? 'Drapeau' : 'Logo'} : ${name}`;
  return `${name} ${isFlag ? 'flag' : 'crest'}`;
}

/** Big "VS" between two crests on hero/next-match cards (hook-free for those components). */
export function versusUpper(locale: string): string {
  return locale === 'ar' ? 'ضد' : 'VS';
}

/** Shoot-out score shown after a drawn knockout score: "(4-2 pen)" / "(4-2 t.a.b.)" / "(ركلات الترجيح 4-2)". */
export function penaltySuffix(home: number, away: number, locale: string): string {
  if (locale === 'ar') return `(ركلات الترجيح ${home}-${away})`;
  if (locale === 'fr') return `(${home}-${away} t.a.b.)`;
  return `(${home}-${away} pen)`;
}

const RESULT_LETTERS: Record<string, Record<'W' | 'D' | 'L', string>> = {
  ar: { W: 'ف', D: 'ت', L: 'خ' },
  fr: { W: 'V', D: 'N', L: 'D' },
};

/** Win/draw/loss badge letter (same letters as the form column: ف/ت/خ on /ar). */
export function resultLetter(result: 'W' | 'D' | 'L', locale: string): string {
  return RESULT_LETTERS[locale]?.[result] ?? result;
}

const INJURY_TYPES: Record<string, Record<string, string>> = {
  ar: { 'Missing Fixture': 'غائب', Questionable: 'مشكوك في مشاركته' },
  fr: { 'Missing Fixture': 'Absent', Questionable: 'Incertain' },
};

/** Injury list status from the feed ("Missing Fixture" / "Questionable"). */
export function localizeInjuryType(type: string, locale: string): string {
  return INJURY_TYPES[locale]?.[type] ?? type;
}
