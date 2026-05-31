import type { Locale } from '@/lib/i18n/config';

const INTL_LOCALE: Record<Locale, string> = {
  ar: 'ar-MA',
  fr: 'fr-FR',
  en: 'en-GB',
};

/**
 * Format a match kickoff time for display.
 *
 * Uses the browser's local timezone (DB stores UTC, Intl converts automatically).
 * Always 24-hour format for consistency across all locales.
 */
export function formatMatchTime(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
}

/**
 * Format a match kickoff date for display (e.g., "Sat 14 June", "sam. 14 juin").
 */
export function formatMatchDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' },
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], options).format(new Date(date));
}

/**
 * Format a short date (e.g., "14 Jun", "14 juin").
 */
export function formatShortDate(dateStr: string, locale: Locale): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/**
 * Format a season year for display (e.g., 2025 → "2025/26").
 */
export function formatSeason(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, '0')}`;
}
