import type { Locale } from '@/lib/i18n/config';

/**
 * API-Football stores standings zone `description` in English. Map known
 * footnotes to FR/AR at render time (LANG-020). Unknown strings pass through.
 */
const ZONE_LABELS: Record<string, Record<Locale, string>> = {
  'Promotion - CAF Champions League (Qualification)': {
    en: 'Promotion - CAF Champions League (Qualification)',
    fr: 'Promotion - Ligue des champions CAF (qualification)',
    ar: 'تأهل - دوري أبطال أفريقيا (تصفيات)',
  },
  'Promotion - CAF Confederation Cup (Qualification)': {
    en: 'Promotion - CAF Confederation Cup (Qualification)',
    fr: 'Promotion - Coupe de la confédération CAF (qualification)',
    ar: 'تأهل - كأس الكونفدرالية الأفريقية (تصفيات)',
  },
};

export function translateStandingZoneLabel(
  description: string | null | undefined,
  locale: Locale,
): string | null {
  if (!description) return null;
  return ZONE_LABELS[description]?.[locale] ?? description;
}
