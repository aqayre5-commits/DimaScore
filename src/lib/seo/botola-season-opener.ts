import { LEAGUE_IDS } from '@/lib/constants/canonical-ids';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

/** Botola Pro Inwi 2026/27 — API-Football / site season year. */
export const BOTOLA_SEASON_OPENER_YEAR = 2026;

/** Official LNFP start date (Thursday). Do not invent kickoff times. */
export const BOTOLA_SEASON_OPENER_START_ISO = '2026-09-24';

export const BOTOLA_SEASON_OPENER_COMPETITION_ID = LEAGUE_IDS.BOTOLA_PRO_1;

/**
 * Locale-canonical slugs. AR uses the Latin FR slug (IMP-001: Arabic path
 * encoding is fragile). EN is a distinct English slug.
 */
export const BOTOLA_SEASON_OPENER_SLUGS = {
  fr: 'calendrier-botola-pro-2026-2027',
  en: 'botola-pro-2026-27-calendar',
  ar: 'calendrier-botola-pro-2026-2027',
} as const satisfies Record<Locale, string>;

/** Optional FR 301 alias → FR canonical. */
export const BOTOLA_SEASON_OPENER_FR_ALIAS = 'reprise-botola-pro-2026-2027';

const SLUG_SET = new Set<string>([
  ...Object.values(BOTOLA_SEASON_OPENER_SLUGS),
  BOTOLA_SEASON_OPENER_FR_ALIAS,
]);

/** Competition hub paths from the IMP-006 brief (AR Latin slugs, IMP-001). */
export const BOTOLA_COMPETITION_HUB: Record<Locale, string> = {
  fr: '/fr/competition/maroc/botola-pro',
  en: '/en/competition/morocco/botola-pro',
  ar: '/ar/competition/maroc/botola-pro',
};

/** Hash fragments for Matchs / Classement on the competition page. */
export const BOTOLA_COMPETITION_TAB_HASH: Record<Locale, { fixtures: string; standings: string }> =
  {
    fr: { fixtures: 'matchs', standings: 'classement' },
    en: { fixtures: 'fixtures', standings: 'standings' },
    ar: { fixtures: 'المباريات', standings: 'الترتيب' },
  };

/**
 * Round-level early-season highlights only — no kickoff clock, no weekday
 * assignment. Pairings are LNFP/press posters; times stay "to confirm".
 */
export const BOTOLA_SEASON_OPENER_HIGHLIGHTS = [
  { id: 'j1-far-raja', roundKey: 'hl1round', pairingKey: 'hl1pairing' },
  { id: 'j5-mas-berkane', roundKey: 'hl2round', pairingKey: 'hl2pairing' },
  { id: 'j8-wydad-far', roundKey: 'hl3round', pairingKey: 'hl3pairing' },
  { id: 'derby-casa', roundKey: 'hl4round', pairingKey: 'hl4pairing' },
] as const;

export function botolaSeasonOpenerSlug(locale: Locale): string {
  return BOTOLA_SEASON_OPENER_SLUGS[locale];
}

export function botolaSeasonOpenerPath(locale: Locale): string {
  return `/${locale}/${BOTOLA_SEASON_OPENER_SLUGS[locale]}`;
}

export function isBotolaSeasonOpenerSlug(slug: string | undefined): boolean {
  return slug != null && SLUG_SET.has(slug);
}

/**
 * Language-switcher rewrite: any opener slug (canonical or FR alias) maps to
 * the target locale's canonical path.
 */
export function rewriteBotolaSeasonOpenerPath(pathname: string, newLocale: Locale): string | null {
  const segments = pathname.split('/');
  const slug = segments[2];
  if (!isBotolaSeasonOpenerSlug(slug)) return null;
  return botolaSeasonOpenerPath(newLocale);
}

export function botolaSeasonOpenerHreflang(baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}${botolaSeasonOpenerPath(loc)}`;
  }
  languages['x-default'] = `${baseUrl}${botolaSeasonOpenerPath(defaultLocale)}`;
  return languages;
}

export function botolaCompetitionFixturesHref(locale: Locale): string {
  return `${BOTOLA_COMPETITION_HUB[locale]}#${BOTOLA_COMPETITION_TAB_HASH[locale].fixtures}`;
}

export function botolaCompetitionStandingsHref(locale: Locale): string {
  return `${BOTOLA_COMPETITION_HUB[locale]}#${BOTOLA_COMPETITION_TAB_HASH[locale].standings}`;
}
