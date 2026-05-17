/**
 * Localized country display names for competition group headers.
 *
 * Maps ISO country codes (as used by API-Football) to fr + ar display names.
 * Only includes countries that appear in our 36 verified competitions.
 */

const COUNTRY_NAMES: Record<string, { en: string; fr: string; ar: string }> = {
  'GB-ENG': { en: 'England', fr: 'Angleterre', ar: 'إنجلترا' },
  ES: { en: 'Spain', fr: 'Espagne', ar: 'إسبانيا' },
  IT: { en: 'Italy', fr: 'Italie', ar: 'إيطاليا' },
  DE: { en: 'Germany', fr: 'Allemagne', ar: 'ألمانيا' },
  FR: { en: 'France', fr: 'France', ar: 'فرنسا' },
  MA: { en: 'Morocco', fr: 'Maroc', ar: 'المغرب' },
  DZ: { en: 'Algeria', fr: 'Algérie', ar: 'الجزائر' },
  TN: { en: 'Tunisia', fr: 'Tunisie', ar: 'تونس' },
  EG: { en: 'Egypt', fr: 'Égypte', ar: 'مصر' },
  TR: { en: 'Turkey', fr: 'Turquie', ar: 'تركيا' },
  SA: { en: 'Saudi Arabia', fr: 'Arabie saoudite', ar: 'السعودية' },
  AE: { en: 'UAE', fr: 'Émirats arabes unis', ar: 'الإمارات' },
  World: { en: 'World', fr: 'Monde', ar: 'العالم' },
  Africa: { en: 'Africa', fr: 'Afrique', ar: 'أفريقيا' },
  Europe: { en: 'Europe', fr: 'Europe', ar: 'أوروبا' },
};

/**
 * Returns a localized country name for display.
 * Falls back to the raw code if no translation exists.
 */
export function getLocalizedCountryName(code: string | null, locale: string): string | null {
  if (!code) return null;
  const entry = COUNTRY_NAMES[code];
  if (!entry) return code;
  return (entry as Record<string, string>)[locale] ?? entry.en ?? code;
}
