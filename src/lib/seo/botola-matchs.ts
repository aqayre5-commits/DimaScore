import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BOTOLA_COMPETITION_TAB_HASH } from '@/lib/seo/botola-season-opener';

/**
 * Locale-canonical slugs for the Botola Pro matchs / live-scores landing (IMP-010).
 * AR uses the Latin FR slug (IMP-001). EN is a distinct English slug.
 */
export const BOTOLA_MATCHS_SLUGS = {
  fr: 'matchs-botola-pro',
  en: 'botola-pro-matches',
  ar: 'matchs-botola-pro',
} as const satisfies Record<Locale, string>;

/** Optional FR/AR 301 alias → canonical. Query-shaped; do not keep as a second indexable. */
export const BOTOLA_MATCHS_FR_ALIAS = 'matchs-de-botola';

/** Optional EN 301 alias → EN canonical (the unused brief alternative). */
export const BOTOLA_MATCHS_EN_ALIAS = 'botola-pro-fixtures';

const SLUG_SET = new Set<string>([
  ...Object.values(BOTOLA_MATCHS_SLUGS),
  BOTOLA_MATCHS_FR_ALIAS,
  BOTOLA_MATCHS_EN_ALIAS,
]);

export function botolaMatchsSlug(locale: Locale): string {
  return BOTOLA_MATCHS_SLUGS[locale];
}

export function botolaMatchsPath(locale: Locale): string {
  return `/${locale}/${BOTOLA_MATCHS_SLUGS[locale]}`;
}

export function isBotolaMatchsSlug(slug: string | undefined): boolean {
  return slug != null && SLUG_SET.has(slug);
}

/**
 * Language-switcher rewrite: any matchs slug (canonical or alias) maps to the
 * target locale's canonical path.
 */
export function rewriteBotolaMatchsPath(pathname: string, newLocale: Locale): string | null {
  const segments = pathname.split('/');
  const slug = segments[2];
  if (!isBotolaMatchsSlug(slug)) return null;
  return botolaMatchsPath(newLocale);
}

export function botolaMatchsHreflang(baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}${botolaMatchsPath(loc)}`;
  }
  languages['x-default'] = `${baseUrl}${botolaMatchsPath(defaultLocale)}`;
  return languages;
}

/** Primary in-page hash for the fixtures embed (same as competition Matchs). */
export function botolaMatchsEmbedHash(locale: Locale): string {
  return BOTOLA_COMPETITION_TAB_HASH[locale].fixtures;
}

/** `#fixtures` alias on FR/AR so English fragments still land on the embed. */
export function botolaMatchsEmbedHashAliases(locale: Locale): string[] {
  const primary = botolaMatchsEmbedHash(locale);
  return primary === 'fixtures' ? [] : ['fixtures'];
}
