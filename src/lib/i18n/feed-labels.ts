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
  const exact = lookup(AR_GROUP_LABELS, round) ?? lookup(AR_ROUND_TEMPLATES, round);
  if (exact) return exact;
  roundTemplates ??= compile(AR_ROUND_TEMPLATES);
  return applyTemplates(round.trim(), roundTemplates) ?? round;
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

/** Big "VS" between two crests on hero/next-match cards (hook-free for those components). */
export function versusUpper(locale: string): string {
  return locale === 'ar' ? 'ضد' : 'VS';
}
