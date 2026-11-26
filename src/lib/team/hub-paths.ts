/**
 * Localised team-page paths: /{locale}/{club|national-team}/{slug}[/{tab}].
 * Pure helpers (no DB) shared by the pages, the middleware existence check and the client.
 * The Overview tab has no tab segment; `#hash` links of the earlier page map onto these paths.
 */

export type HubTab = 'overview' | 'matches' | 'squad' | 'stats' | 'transfers';
export type PathTab = Exclude<HubTab, 'overview'>;
export type HubKind = 'club' | 'national';

/** Locales that have the new club / national-team routes. Arabic stays on /ar/equipe (URL design on hold). */
export type PathLocale = 'en' | 'fr';
export const PATH_LOCALES: readonly PathLocale[] = ['en', 'fr'];

export const HUB_SEGMENTS: Record<PathLocale, Record<HubKind, string>> = {
  en: { club: 'club', national: 'national-team' },
  fr: { club: 'club', national: 'selection' },
};

export const TAB_SEGMENTS: Record<PathLocale, Record<PathTab, string>> = {
  en: { matches: 'matches', squad: 'squad', stats: 'player-stats', transfers: 'transfers' },
  fr: {
    matches: 'matchs',
    squad: 'effectif',
    stats: 'statistiques-joueurs',
    transfers: 'transferts',
  },
};

/** Hash values of the earlier single-URL page (any locale), mapped to a tab. */
export const LEGACY_HASHES: Record<string, HubTab | 'table'> = {
  overview: 'overview',
  apercu: 'overview',
  'نظرة-عامة': 'overview',
  matches: 'matches',
  matchs: 'matches',
  المباريات: 'matches',
  squad: 'squad',
  effectif: 'squad',
  التشكيلة: 'squad',
  stats: 'stats',
  'player-stats': 'stats',
  statistiques: 'stats',
  الإحصاءات: 'stats',
  transfers: 'transfers',
  transferts: 'transfers',
  الانتقالات: 'transfers',
  table: 'table',
  classement: 'table',
  الترتيب: 'table',
};

export function legacyHashTab(hash: string): HubTab | 'table' | null {
  let h = hash.replace(/^#/, '');
  try {
    h = decodeURIComponent(h);
  } catch {
    /* raw */
  }
  return LEGACY_HASHES[h] ?? null;
}

export function hubPath(
  locale: PathLocale,
  kind: HubKind,
  slug: string,
  tab: HubTab = 'overview',
): string {
  const base = `/${locale}/${HUB_SEGMENTS[locale][kind]}/${encodeURIComponent(slug)}`;
  return tab === 'overview' ? base : `${base}/${encodeURIComponent(TAB_SEGMENTS[locale][tab])}`;
}

export function isPathLocale(locale: string): locale is PathLocale {
  return locale === 'en' || locale === 'fr';
}

export function kindOfSegment(locale: PathLocale, segment: string): HubKind | null {
  const s = HUB_SEGMENTS[locale];
  return segment === s.club ? 'club' : segment === s.national ? 'national' : null;
}

/** The tab for a path segment in this locale; null when it is not a tab of that locale. */
export function tabOfSegment(locale: PathLocale, segment: string | undefined): HubTab | null {
  if (segment == null) return 'overview';
  const hit = (Object.entries(TAB_SEGMENTS[locale]) as [PathTab, string][]).find(
    ([, v]) => v === segment,
  );
  return hit ? hit[0] : null;
}

/** `/en/club/arsenal/squad` → locale, kind, slug and tab. Null for Arabic or any other path. */
export function parseHubPath(
  pathname: string,
): { locale: PathLocale; kind: HubKind; slug: string; tab: HubTab | null } | null {
  const parts = pathname.split('/').filter((p, i) => i > 0 || p !== '');
  if (parts.length < 3 || parts.length > 4 || !isPathLocale(parts[0])) return null;
  let segs: string[];
  try {
    segs = parts.map(decodeURIComponent);
  } catch {
    return null;
  }
  const locale = segs[0] as PathLocale;
  const kind = kindOfSegment(locale, segs[1]);
  if (!kind || !segs[2]) return null;
  return { locale, kind, slug: segs[2], tab: tabOfSegment(locale, segs[3]) };
}
