/**
 * Localised team-page paths: /{locale}/{club|national-team}/{slug}[/{tab}].
 * Pure helpers (no DB) shared by the pages, the middleware existence check and the client.
 * The Overview tab has no tab segment; `#hash` links of the earlier page map onto these paths.
 */
import type { Locale } from '@/lib/i18n/config';

export type HubTab = 'overview' | 'matches' | 'squad' | 'stats' | 'transfers';
export type PathTab = Exclude<HubTab, 'overview'>;
export type HubKind = 'club' | 'national';

export const HUB_SEGMENTS: Record<Locale, Record<HubKind, string>> = {
  en: { club: 'club', national: 'national-team' },
  fr: { club: 'club', national: 'selection' },
  // Arabic keeps Latin entity segments (like /ar/equipe, /ar/joueur); a literal Arabic folder name
  // is not routed by Next, while the tab segment is a dynamic value and can be Arabic.
  ar: { club: 'club', national: 'national-team' },
};

export const TAB_SEGMENTS: Record<Locale, Record<PathTab, string>> = {
  en: { matches: 'matches', squad: 'squad', stats: 'player-stats', transfers: 'transfers' },
  fr: {
    matches: 'matchs',
    squad: 'effectif',
    stats: 'statistiques-joueurs',
    transfers: 'transferts',
  },
  ar: {
    matches: 'المباريات',
    squad: 'التشكيلة',
    stats: 'إحصاءات-اللاعبين',
    transfers: 'الانتقالات',
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
  locale: Locale,
  kind: HubKind,
  slug: string,
  tab: HubTab = 'overview',
): string {
  const base = `/${locale}/${HUB_SEGMENTS[locale][kind]}/${encodeURIComponent(slug)}`;
  return tab === 'overview' ? base : `${base}/${encodeURIComponent(TAB_SEGMENTS[locale][tab])}`;
}

export function kindOfSegment(locale: Locale, segment: string): HubKind | null {
  const s = HUB_SEGMENTS[locale];
  return segment === s.club ? 'club' : segment === s.national ? 'national' : null;
}

/** The tab for a path segment in this locale; null when it is not a tab of that locale. */
export function tabOfSegment(locale: Locale, segment: string | undefined): HubTab | null {
  if (segment == null) return 'overview';
  const hit = (Object.entries(TAB_SEGMENTS[locale]) as [PathTab, string][]).find(
    ([, v]) => v === segment,
  );
  return hit ? hit[0] : null;
}

const LOCALES: readonly string[] = ['fr', 'en', 'ar'];

/** `/en/club/arsenal-42/squad` → locale, kind, slug and tab segment. Null for any other path. */
export function parseHubPath(
  pathname: string,
): { locale: Locale; kind: HubKind; slug: string; tab: HubTab | null } | null {
  const parts = pathname.split('/').filter((p, i) => i > 0 || p !== '');
  if (parts.length < 3 || parts.length > 4 || !LOCALES.includes(parts[0])) return null;
  let segs: string[];
  try {
    segs = parts.map(decodeURIComponent);
  } catch {
    return null;
  }
  const locale = segs[0] as Locale;
  const kind = kindOfSegment(locale, segs[1]);
  if (!kind || !segs[2]) return null;
  return { locale, kind, slug: segs[2], tab: tabOfSegment(locale, segs[3]) };
}
