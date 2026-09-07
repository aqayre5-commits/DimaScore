import type { Locale } from '@/lib/i18n/config';
import {
  formatFeaturedDate,
  formatKickoff,
  formatMatchDate,
  formatMatchTime,
} from '@/lib/utils/date';

export type KickoffTimeFormat = 'time' | 'date' | 'kickoff' | 'featured';

/** Neutral placeholders — never a fixed-zone clock. Width-matched for layout. */
export const KICKOFF_PLACEHOLDER: Record<KickoffTimeFormat, string> = {
  time: '00:00',
  date: 'Sat 00 Jan',
  kickoff: 'Sat 00 Jan · 00:00',
  featured: 'SAT 00 JANUARY · 00:00',
};

/**
 * Viewer-local (or explicit IANA zone) kickoff formatter.
 * Callers that render clocks MUST omit `timeZone` on the client so Intl uses
 * the viewer's zone. Do not pass Africa/Casablanca, venue TZ, or UTC.
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
