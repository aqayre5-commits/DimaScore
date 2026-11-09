import type { Locale } from '@/lib/i18n/config';
import {
  SITE_TZ,
  formatFeaturedDate,
  formatKickoff,
  formatMatchDate,
  formatMatchTime,
} from '@/lib/utils/date';

export type KickoffTimeFormat = 'time' | 'date' | 'kickoff' | 'featured';

/**
 * Viewer-local (or explicit IANA zone) kickoff formatter.
 * After mount, callers omit `timeZone` so Intl uses the viewer's zone.
 */
export function formatViewerKickoff(
  date: Date,
  locale: Locale,
  format: KickoffTimeFormat,
  dateOptions?: Intl.DateTimeFormatOptions,
  timeZone?: string,
): string {
  switch (format) {
    case 'time':
      return formatMatchTime(date, locale, timeZone);
    case 'date':
      return formatMatchDate(date, locale, dateOptions, timeZone);
    case 'kickoff':
      return formatKickoff(date, locale, timeZone);
    case 'featured':
      return formatFeaturedDate(date, locale, timeZone);
  }
}

/**
 * Server-render / first-paint kickoff: the real time in the site zone (Africa/Casablanca).
 * Deterministic on server and client (fixed zone), so it hydrates cleanly; <LocalTime> then
 * swaps to the viewer's zone after mount. Replaces the old "Sat 00 Jan · 00:00" placeholders
 * that crawlers indexed as the page's date.
 */
export function formatServerKickoff(
  date: Date,
  locale: Locale,
  format: KickoffTimeFormat,
  dateOptions?: Intl.DateTimeFormatOptions,
): string {
  return formatViewerKickoff(date, locale, format, dateOptions, SITE_TZ);
}
