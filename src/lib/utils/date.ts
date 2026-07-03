import type { Locale } from '@/lib/i18n/config';

export const INTL_LOCALE: Record<Locale, string> = {
  ar: 'ar-MA',
  fr: 'fr-FR',
  en: 'en-GB',
};

/**
 * The site's editorial timezone. Server output formats kickoff times in this zone
 * (deterministic SSR, correct for the Moroccan audience); client surfaces re-format
 * in the viewer's local zone after mount via <LocalTime>.
 */
export const SITE_TZ = 'Africa/Casablanca';

/**
 * Format a match kickoff time for display.
 *
 * DB stores UTC; Intl converts to `timeZone`, or the runtime's local zone when omitted.
 * Always 24-hour format for consistency across all locales.
 */
export function formatMatchTime(date: Date, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(date));
}

/**
 * Format a match kickoff date for display (e.g., "Sat 14 June", "sam. 14 juin").
 */
export function formatMatchDate(
  date: Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' },
  timeZone?: string,
): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    ...options,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(date));
}

/**
 * Format a short date (e.g., "14 Jun", "14 juin").
 */
export function formatShortDate(dateStr: string, locale: Locale, timeZone?: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: 'numeric',
    month: 'short',
    timeZone,
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
 *
 * "Today" is decided in the site timezone (matching the server-side day bucketing),
 * not the viewer's — deterministic across SSR and hydration, no mismatch.
 */
export function formatDateLabel(
  dateKey: string,
  locale: Locale,
  todayLabel: string,
  timeZone: string = SITE_TZ,
): string {
  // en-CA yields YYYY-MM-DD, matching the date-key shape.
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/**
 * Format a featured-match date+time string (e.g., "SAT 14 JUNE · 21:00").
 */
export function formatFeaturedDate(date: Date, locale: Locale, timeZone?: string): string {
  const intlLocale = INTL_LOCALE[locale];
  const d = new Date(date);
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: 'short', timeZone }).format(d);
  const day = new Intl.DateTimeFormat(intlLocale, { day: 'numeric', timeZone }).format(d);
  const month = new Intl.DateTimeFormat(intlLocale, { month: 'long', timeZone }).format(d);
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(d);

  return `${weekday} ${day} ${month} · ${time}`.toUpperCase();
}

/**
 * Format a kickoff date+time (e.g., "Sat 14 Jun · 21:00").
 */
export function formatKickoff(date: Date, locale: Locale, timeZone?: string): string {
  const intlLocale = INTL_LOCALE[locale];
  return (
    new Intl.DateTimeFormat(intlLocale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone,
    }).format(date) +
    ' · ' +
    new Intl.DateTimeFormat(intlLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone,
    }).format(date)
  );
}
