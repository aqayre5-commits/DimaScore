import type { Locale } from '@/lib/i18n/config';

/**
 * Locale-translated slugs for countries and confederations used in URL patterns.
 * Root segment /competition/ is NOT translated. Country/confederation and
 * tournament slugs ARE translated per locale.
 *
 * Keys are internal identifiers matching the FR slug by convention.
 */
export const COUNTRY_SLUGS: Record<string, Record<Locale, string>> = {
  // Confederations
  fifa: { fr: 'fifa', en: 'fifa', ar: 'فيفا' },
  uefa: { fr: 'uefa', en: 'uefa', ar: 'أوروبا' },
  caf: { fr: 'caf', en: 'caf', ar: 'كاف' },
  afc: { fr: 'afc', en: 'afc', ar: 'آسيا' },
  ioc: { fr: 'ioc', en: 'ioc', ar: 'الأولمبية' },

  // Countries — keyed by FR slug
  maroc: { fr: 'maroc', en: 'morocco', ar: 'المغرب' },
  angleterre: { fr: 'angleterre', en: 'england', ar: 'إنجلترا' },
  espagne: { fr: 'espagne', en: 'spain', ar: 'إسبانيا' },
  italie: { fr: 'italie', en: 'italy', ar: 'إيطاليا' },
  allemagne: { fr: 'allemagne', en: 'germany', ar: 'ألمانيا' },
  france: { fr: 'france', en: 'france', ar: 'فرنسا' },
  algerie: { fr: 'algerie', en: 'algeria', ar: 'الجزائر' },
  tunisie: { fr: 'tunisie', en: 'tunisia', ar: 'تونس' },
  egypte: { fr: 'egypte', en: 'egypt', ar: 'مصر' },
  emirats: { fr: 'emirats', en: 'uae', ar: 'الإمارات' },
  'arabie-saoudite': {
    fr: 'arabie-saoudite',
    en: 'saudi-arabia',
    ar: 'السعودية',
  },
  turquie: { fr: 'turquie', en: 'turkey', ar: 'تركيا' },
};

/** Resolve a country/confederation slug for a given locale. */
export function getCountrySlug(key: string, locale: Locale): string {
  return COUNTRY_SLUGS[key]?.[locale] ?? key;
}

/** Reverse lookup: find the internal key from a locale-specific slug. */
export function resolveCountryKey(slug: string, locale: Locale): string | undefined {
  for (const [key, slugs] of Object.entries(COUNTRY_SLUGS)) {
    if (slugs[locale] === slug) return key;
  }
  return undefined;
}

/**
 * Human display names for countries/confederations — used as section headers in the
 * competitions rail. (The slugs above are lowercase URL forms, not display names.)
 */
export const COUNTRY_LABELS: Record<string, Record<Locale, string>> = {
  fifa: { fr: 'International', en: 'International', ar: 'دولي' },
  uefa: { fr: 'Europe', en: 'Europe', ar: 'أوروبا' },
  caf: { fr: 'Afrique', en: 'Africa', ar: 'إفريقيا' },
  maroc: { fr: 'Maroc', en: 'Morocco', ar: 'المغرب' },
  angleterre: { fr: 'Angleterre', en: 'England', ar: 'إنجلترا' },
  espagne: { fr: 'Espagne', en: 'Spain', ar: 'إسبانيا' },
  italie: { fr: 'Italie', en: 'Italy', ar: 'إيطاليا' },
  allemagne: { fr: 'Allemagne', en: 'Germany', ar: 'ألمانيا' },
  france: { fr: 'France', en: 'France', ar: 'فرنسا' },
  algerie: { fr: 'Algérie', en: 'Algeria', ar: 'الجزائر' },
  tunisie: { fr: 'Tunisie', en: 'Tunisia', ar: 'تونس' },
  egypte: { fr: 'Égypte', en: 'Egypt', ar: 'مصر' },
  emirats: { fr: 'Émirats arabes unis', en: 'United Arab Emirates', ar: 'الإمارات' },
  'arabie-saoudite': { fr: 'Arabie saoudite', en: 'Saudi Arabia', ar: 'السعودية' },
  turquie: { fr: 'Turquie', en: 'Turkey', ar: 'تركيا' },
  bresil: { fr: 'Brésil', en: 'Brazil', ar: 'البرازيل' },
  argentine: { fr: 'Argentine', en: 'Argentina', ar: 'الأرجنتين' },
};

/** Resolve a country/confederation display name for a given locale. */
export function getCountryLabel(key: string, locale: Locale): string {
  return COUNTRY_LABELS[key]?.[locale] ?? key;
}
