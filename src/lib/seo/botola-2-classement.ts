import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { LEAGUE_IDS } from '@/lib/constants/canonical-ids';
import { formatSeasonLabel } from '@/lib/competitions/league-season';
import { getLeagueAbout } from '@/lib/constants/league-about-content';
import { BOTOLA_COMPETITION_TAB_HASH } from '@/lib/seo/botola-season-opener';
import {
  botolaClassementTableHash,
  botolaClassementTableHashAliases,
} from '@/lib/seo/botola-classement';

/** Botola 2 (API-Football / site SoT). */
export const BOTOLA_2_COMPETITION_ID = LEAGUE_IDS.BOTOLA_2;

/**
 * Locale-canonical slugs for the Botola 2 classement-primary landing.
 * AR uses the Latin FR slug (IMP-001). EN is a distinct English slug.
 * Distinct from Pro (`classement-botola-pro`) so the two landings never collide.
 */
export const BOTOLA_2_CLASSEMENT_SLUGS = {
  fr: 'classement-botola-2',
  en: 'botola-2-standings',
  ar: 'classement-botola-2',
} as const satisfies Record<Locale, string>;

const SLUG_SET = new Set<string>(Object.values(BOTOLA_2_CLASSEMENT_SLUGS));

/**
 * Competition SoT paths from the brief (AR Latin slugs, same pattern as IMP-008).
 * `buildCompetitionHref` would emit the mega-menu AR Unicode slug — landings keep Latin.
 */
export const BOTOLA_2_COMPETITION_HUB: Record<Locale, string> = {
  fr: '/fr/competition/maroc/botola-2',
  en: '/en/competition/morocco/botola-2',
  ar: '/ar/competition/maroc/botola-2',
};

export function botola2ClassementSlug(locale: Locale): string {
  return BOTOLA_2_CLASSEMENT_SLUGS[locale];
}

export function botola2ClassementPath(locale: Locale): string {
  return `/${locale}/${BOTOLA_2_CLASSEMENT_SLUGS[locale]}`;
}

export function isBotola2ClassementSlug(slug: string | undefined): boolean {
  return slug != null && SLUG_SET.has(slug);
}

/**
 * Language-switcher rewrite: any Botola 2 classement slug maps to the target
 * locale's canonical path.
 */
export function rewriteBotola2ClassementPath(pathname: string, newLocale: Locale): string | null {
  const segments = pathname.split('/');
  const slug = segments[2];
  if (!isBotola2ClassementSlug(slug)) return null;
  return botola2ClassementPath(newLocale);
}

export function botola2ClassementHreflang(baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}${botola2ClassementPath(loc)}`;
  }
  languages['x-default'] = `${baseUrl}${botola2ClassementPath(defaultLocale)}`;
  return languages;
}

/** Same in-page hashes as Pro classement / competition Classement (LANG-006). */
export const botola2ClassementTableHash = botolaClassementTableHash;
export const botola2ClassementTableHashAliases = botolaClassementTableHashAliases;

export function botola2CompetitionFixturesHref(locale: Locale): string {
  return `${BOTOLA_2_COMPETITION_HUB[locale]}#${BOTOLA_COMPETITION_TAB_HASH[locale].fixtures}`;
}

export function botola2CompetitionStandingsHref(locale: Locale): string {
  return `${BOTOLA_2_COMPETITION_HUB[locale]}#${BOTOLA_COMPETITION_TAB_HASH[locale].standings}`;
}

const HUB_TITLE_FR = 'Botola 2 — classement, matchs et stats | DimaScore';
const HUB_TITLE_AR = 'القسم الثاني — الترتيب والمباريات والإحصائيات | ديماسكور';

/**
 * FR/AR Botola 2 competition hub title (LANG-023). Season label is appended
 * from product SoT — never hard-coded.
 */
export function botola2CompetitionPageTitle(
  locale: Locale,
  seasonLabel: string | null | undefined,
): string | null {
  const season = seasonLabel?.trim() || '';
  if (locale === 'fr') {
    return season ? `Botola 2 ${season} — classement, matchs et stats | DimaScore` : HUB_TITLE_FR;
  }
  if (locale === 'ar') {
    return season
      ? `القسم الثاني ${season} — الترتيب والمباريات والإحصائيات | ديماسكور`
      : HUB_TITLE_AR;
  }
  return null;
}

/** FR/AR competition meta description: classement / matchs, not EN “standings” (LANG-019). */
export function botola2CompetitionMetaDescription(locale: Locale, displayName: string): string {
  if (locale === 'fr') {
    return `${displayName} — classement, matchs et statistiques | DimaScore`;
  }
  if (locale === 'ar') {
    return `${displayName} — الترتيب والمباريات والإحصائيات | ديماسكور`;
  }
  return `${displayName} — standings, matches, and statistics | DimaScore`;
}

/** Product SoT season label — never invent 2026/27. */
export function botola2SeasonLabel(seasonYear: number | null | undefined): string {
  return seasonYear != null ? formatSeasonLabel(seasonYear) : '';
}

/**
 * DATA-007: Overview header must not invent club counts.
 * Prefer standings rows, then About/LNFP fact — never the inflated fixture union.
 */
export function botola2HeaderTeamsCount(
  standingTeamIds: Array<number | null | undefined>,
  aboutTeamsValue?: string | null,
): number | undefined {
  const fromStandings = new Set(
    standingTeamIds.filter((id): id is number => typeof id === 'number' && Number.isFinite(id)),
  ).size;
  if (fromStandings > 0) return fromStandings;
  const parsed = aboutTeamsValue != null ? Number.parseInt(aboutTeamsValue, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return undefined;
}

export function botola2AboutTeamsValue(): string | null {
  return (
    getLeagueAbout(BOTOLA_2_COMPETITION_ID)?.facts.find((f) => f.labelKey === 'teams')?.value.en ??
    null
  );
}
