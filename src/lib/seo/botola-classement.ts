import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { LEAGUE_IDS } from '@/lib/constants/canonical-ids';
import {
  BOTOLA_COMPETITION_HUB,
  BOTOLA_COMPETITION_TAB_HASH,
} from '@/lib/seo/botola-season-opener';

/** Botola Pro (API-Football / site SoT). */
export const BOTOLA_PRO_COMPETITION_ID = LEAGUE_IDS.BOTOLA_PRO_1;

/**
 * Locale-canonical slugs for the Botola Pro classement-primary landing (IMP-008).
 * AR uses the Latin FR slug (IMP-001). EN is a distinct English slug.
 */
export const BOTOLA_CLASSEMENT_SLUGS = {
  fr: 'classement-botola-pro',
  en: 'botola-pro-standings',
  ar: 'classement-botola-pro',
} as const satisfies Record<Locale, string>;

const SLUG_SET = new Set<string>(Object.values(BOTOLA_CLASSEMENT_SLUGS));

export function botolaClassementSlug(locale: Locale): string {
  return BOTOLA_CLASSEMENT_SLUGS[locale];
}

export function botolaClassementPath(locale: Locale): string {
  return `/${locale}/${BOTOLA_CLASSEMENT_SLUGS[locale]}`;
}

export function isBotolaClassementSlug(slug: string | undefined): boolean {
  return slug != null && SLUG_SET.has(slug);
}

/**
 * Language-switcher rewrite: any classement slug maps to the target locale's
 * canonical path.
 */
export function rewriteBotolaClassementPath(pathname: string, newLocale: Locale): string | null {
  const segments = pathname.split('/');
  const slug = segments[2];
  if (!isBotolaClassementSlug(slug)) return null;
  return botolaClassementPath(newLocale);
}

export function botolaClassementHreflang(baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}${botolaClassementPath(loc)}`;
  }
  languages['x-default'] = `${baseUrl}${botolaClassementPath(defaultLocale)}`;
  return languages;
}

/** Primary in-page hash for the live table (LANG-006). */
export function botolaClassementTableHash(locale: Locale): string {
  return BOTOLA_COMPETITION_TAB_HASH[locale].standings;
}

/** `#standings` alias on FR/AR so English fragments still land on the table. */
export function botolaClassementTableHashAliases(locale: Locale): string[] {
  const primary = botolaClassementTableHash(locale);
  return primary === 'standings' ? [] : ['standings'];
}

const HUB_TITLE_FR = 'Botola Pro — matchs, classement et stats | DimaScore';
const HUB_TITLE_EN = 'Botola Pro — matches, standings and stats | DimaScore';
const HUB_TITLE_AR = 'البطولة الاحترافية — المباريات والترتيب والإحصائيات | ديماسكور';

/**
 * Locale-correct Botola Pro competition hub title. Season label is appended
 * from product SoT — never hard-coded. Hub remains the SoT, not a new landing.
 */
export function botolaProCompetitionPageTitle(
  locale: Locale,
  seasonLabel: string | null | undefined,
): string {
  const season = seasonLabel?.trim() || '';
  if (locale === 'fr') {
    return season ? `Botola Pro ${season} — matchs, classement et stats | DimaScore` : HUB_TITLE_FR;
  }
  if (locale === 'ar') {
    return season
      ? `البطولة الاحترافية ${season} — المباريات والترتيب والإحصائيات | ديماسكور`
      : HUB_TITLE_AR;
  }
  return season ? `Botola Pro ${season} — matches, standings and stats | DimaScore` : HUB_TITLE_EN;
}

/** Locale-correct hub meta: matchs/classement/stats, not a bare season name. */
export function botolaProCompetitionMetaDescription(locale: Locale, displayName: string): string {
  if (locale === 'fr') {
    return `${displayName} — matchs, classement et statistiques | DimaScore`;
  }
  if (locale === 'ar') {
    return `${displayName} — المباريات والترتيب والإحصائيات | ديماسكور`;
  }
  return `${displayName} — matches, standings and statistics | DimaScore`;
}

/** Self-canonical + hreflang for the Botola Pro competition hub (Latin AR slug). */
export function botolaProCompetitionHreflang(baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}${BOTOLA_COMPETITION_HUB[loc]}`;
  }
  languages['x-default'] = `${baseUrl}${BOTOLA_COMPETITION_HUB[defaultLocale]}`;
  return languages;
}
