import type { Locale } from '@/lib/i18n/config';

export const INTL_LOCALE: Record<Locale, string> = {
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

/**
 * Format a date-key string (YYYY-MM-DD) as a readable label.
 * Returns `todayLabel` if the key matches today's date.
 */
export function formatDateLabel(dateKey: string, locale: Locale, todayLabel: string): string {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (dateKey === todayKey) return todayLabel;

  const d = new Date(dateKey + 'T12:00:00Z');
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d);
}

/**
 * Format a date string as "Mon YYYY" (e.g., "Jan 2024").
 * Returns "—" for null/invalid input.
 */
export function formatMonthYear(dateStr: string | null): string {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '\u2014';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/**
 * Format a featured-match date+time string (e.g., "SAT 14 JUNE · 21:00").
 */
export function formatFeaturedDate(date: Date, locale: Locale): string {
  const intlLocale = INTL_LOCALE[locale];
  const d = new Date(date);
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: 'short' }).format(d);
  const day = new Intl.DateTimeFormat(intlLocale, { day: 'numeric' }).format(d);
  const month = new Intl.DateTimeFormat(intlLocale, { month: 'long' }).format(d);
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);

  return `${weekday} ${day} ${month} · ${time}`.toUpperCase();
}

/**
 * Format a kickoff date+time (e.g., "Sat 14 Jun · 21:00").
 */
export function formatKickoff(date: Date, locale: Locale): string {
  const intlLocale = INTL_LOCALE[locale];
  return (
    new Intl.DateTimeFormat(intlLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date) +
    ' · ' +
    new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date)
  );
}
