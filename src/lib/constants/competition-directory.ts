/**
 * Competition directory for the match-centre left rail (template: Popular competitions, then
 * Browse competitions as zones → countries → competitions). Built from the site's competition
 * registry (ALL_ENTRIES), so every row links to an existing competition page.
 */
import type { Locale } from '@/lib/i18n/config';
import { ALL_ENTRIES, buildCompetitionHref, type MegaMenuEntry } from './competitions-mega-menu';
import { getCountryLabel } from './country-slugs';

/**
 * Editorial order for a Moroccan audience; the rail shows the active ones in this order (template:
 * "Popular competitions", eight rows, then "Show N more").
 */
export const POPULAR_ORDER = [
  1, 6, 200, 39, 140, 2, 12, 61, 135, 78, 922, 822, 20, 3, 525, 201, 44, 307, 5, 848, 29, 36,
] as const;

export const POPULAR_VISIBLE = 8;

/** Tournament competitions listed in the "Tournament editions" dialog. */
export const TOURNAMENT_IDS = [1, 6, 922, 5] as const;

export type ZoneId =
  | 'africa'
  | 'europe'
  | 'asia'
  | 'northAmerica'
  | 'southAmerica'
  | 'oceania'
  | 'world';

export const ZONE_ORDER: ZoneId[] = [
  'africa',
  'europe',
  'asia',
  'northAmerica',
  'southAmerica',
  'oceania',
  'world',
];

/** Registry country key → zone. Confederation keys (caf, uefa, fifa) are the zone's "continental" branch. */
const ZONE_OF: Record<string, ZoneId> = {
  maroc: 'africa',
  caf: 'africa',
  egypte: 'africa',
  algerie: 'africa',
  tunisie: 'africa',
  uefa: 'europe',
  angleterre: 'europe',
  espagne: 'europe',
  allemagne: 'europe',
  italie: 'europe',
  france: 'europe',
  turquie: 'europe',
  'arabie-saoudite': 'asia',
  emirats: 'asia',
  bresil: 'southAmerica',
  argentine: 'southAmerica',
  fifa: 'world',
};

const CONTINENTAL = new Set(['caf', 'uefa', 'fifa']);
/** FIFA competitions keep the registry label ("International"); CAF / UEFA read "Continental competitions". */
const CONTINENTAL_LABEL = new Set(['caf', 'uefa']);

export interface DirectoryEntry {
  competitionId: number;
  labelKey: string;
  countryKey: string;
  href: string;
}

/** One entry per competition id (the registry lists WAFCON twice), visible ones only. */
export function directoryEntries(locale: Locale): DirectoryEntry[] {
  const seen = new Set<number>();
  const out: DirectoryEntry[] = [];
  for (const e of ALL_ENTRIES as MegaMenuEntry[]) {
    if (!e.isCurrentlyVisible || seen.has(e.competitionId)) continue;
    seen.add(e.competitionId);
    out.push({
      competitionId: e.competitionId,
      labelKey: e.labelKey,
      countryKey: e.countryKey,
      href: buildCompetitionHref(e, locale),
    });
  }
  return out;
}

export interface DirectoryCountry {
  key: string;
  label: string;
  continental: boolean;
  entries: DirectoryEntry[];
}

export interface DirectoryZone {
  id: ZoneId;
  count: number;
  countries: DirectoryCountry[];
}

/**
 * Zones → countries → competitions, as in the template tree: Morocco first, then the zone's
 * continental competitions, then countries alphabetically. Empty zones are left out.
 */
export function directoryTree(
  entries: DirectoryEntry[],
  locale: Locale,
  continentalLabel: string,
): DirectoryZone[] {
  const zones = new Map<ZoneId, Map<string, DirectoryEntry[]>>();
  for (const e of entries) {
    const zone = ZONE_OF[e.countryKey] ?? 'world';
    if (!zones.has(zone)) zones.set(zone, new Map());
    const byCountry = zones.get(zone)!;
    if (!byCountry.has(e.countryKey)) byCountry.set(e.countryKey, []);
    byCountry.get(e.countryKey)!.push(e);
  }
  const collator = new Intl.Collator(locale);
  return ZONE_ORDER.filter((z) => zones.has(z)).map((id) => {
    const countries = [...zones.get(id)!.entries()].map(([key, list]) => ({
      key,
      label: CONTINENTAL_LABEL.has(key) ? continentalLabel : getCountryLabel(key, locale),
      continental: CONTINENTAL.has(key),
      entries: list,
    }));
    const rank = (c: DirectoryCountry) => (c.key === 'maroc' ? 0 : c.continental ? 1 : 2);
    countries.sort((a, b) => rank(a) - rank(b) || collator.compare(a.label, b.label));
    return { id, count: countries.reduce((n, c) => n + c.entries.length, 0), countries };
  });
}
