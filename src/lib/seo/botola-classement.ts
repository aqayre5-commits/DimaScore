import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BOTOLA_COMPETITION_TAB_HASH } from '@/lib/seo/botola-season-opener';

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
