/**
 * Localized team names the provider doesn't supply (API-Football names are English only).
 *
 * - National teams: the localized country name from country-names-i18n, plus a translated
 *   age/women suffix ("Morocco U23" → "Maroc U23" / "المغرب تحت 23 سنة").
 * - Moroccan clubs (Botola Pro 2026/27 and the best-known Botola 2 sides), by API-Football team
 *   ID: the names Moroccan media use. Only IDs checked against live data are listed; anything
 *   else falls back to the stored English name (never an empty label).
 *
 * Arabic and French names are standard press usage — review before shipping.
 */
import { getCountryNames } from './country-names-i18n';

type L10n = { fr?: string; ar?: string };

export const CLUB_NAMES: Record<number, L10n> = {
  // Botola Pro 2026/27
  962: { fr: 'RS Berkane', ar: 'نهضة بركان' },
  964: { fr: 'Difaâ El Jadida', ar: 'الدفاع الحسني الجديدي' },
  965: { fr: 'Moghreb Tétouan', ar: 'المغرب التطواني' },
  968: { ar: 'الوداد الرياضي' },
  969: { fr: 'AS FAR', ar: 'الجيش الملكي' },
  971: { ar: 'الكوكب المراكشي' },
  973: { ar: 'حسنية أكادير' },
  974: { ar: 'اتحاد طنجة' },
  976: { ar: 'الرجاء الرياضي' },
  977: { ar: 'الفتح الرباطي' },
  3449: { ar: 'نهضة الزمامرة' },
  3453: { fr: 'Maghreb de Fès', ar: 'المغرب الفاسي' },
  3458: { ar: 'وداد تمارة' },
  14806: { ar: 'اتحاد تواركة' },
  18753: { ar: 'أمل تيزنيت' },
  22218: { ar: 'النادي المكناسي' },
  // Botola 2 (linked from the Botola 2 hub)
  975: { fr: 'Olympique de Safi', ar: 'أولمبيك آسفي' },
  3452: { fr: 'Ittihad Khémisset', ar: 'اتحاد الخميسات' },
  3454: { ar: 'أولمبيك الدشيرة' },
  3459: { fr: 'Wydad de Fès', ar: 'وداد فاس' },
  15549: { ar: 'الملعب المغربي' },
  17716: { ar: 'الاتحاد الإسلامي الوجدي' },
  25058: { ar: 'يعقوب المنصور' },
};

const SUFFIX = /\s+(W|U\d{2})(?:\s+(W))?$/;

function suffixL10n(part: string, locale: 'fr' | 'ar'): string {
  if (part === 'W') return locale === 'ar' ? 'للسيدات' : 'F';
  const age = part.slice(1);
  return locale === 'ar' ? `تحت ${age} سنة` : `U${age}`;
}

export interface TeamNameKey {
  id?: number | null;
  name: Record<string, string>;
  countryCode?: string | null;
  isNational?: boolean | null;
}

/** Localized name for fr/ar when we have one; null means "use the stored name". */
export function localizedTeamName(team: TeamNameKey, locale: string): string | null {
  if (locale !== 'fr' && locale !== 'ar') return null;
  if (team.id != null && CLUB_NAMES[team.id]?.[locale]) return CLUB_NAMES[team.id][locale]!;
  if (!team.isNational) return null;
  const country = getCountryNames(team.countryCode ?? null);
  const en = team.name['en'];
  if (!country || !en) return null;
  const m = SUFFIX.exec(en);
  const base = m ? en.slice(0, m.index) : en;
  // Only translate when the stored name is exactly that country (+ suffix); provider variants
  // like "Congo DR" or "Morocco Olympic" keep their stored name rather than a wrong translation.
  if (base.toLowerCase() !== country.en.toLowerCase()) return null;
  const parts = m ? [m[1], m[2]].filter(Boolean).map((p) => suffixL10n(p as string, locale)) : [];
  return [country[locale], ...parts].join(' ');
}
