'use client';

import { useSyncExternalStore } from 'react';
import type { Locale } from '@/lib/i18n/config';
import {
  SITE_TZ,
  formatFeaturedDate,
  formatKickoff,
  formatMatchDate,
  formatMatchTime,
} from '@/lib/utils/date';

type TimeFormat = 'time' | 'date' | 'kickoff' | 'featured';

interface Props {
  date: Date | string;
  locale: Locale;
  format: TimeFormat;
  /** Only used with format="date" — forwarded to formatMatchDate. */
  dateOptions?: Intl.DateTimeFormatOptions;
  className?: string;
}

/**
 * Kickoff date/time that is hydration-safe AND viewer-local.
 *
 * Server and first client render format in SITE_TZ (deterministic — no React #418,
 * and already correct for the Moroccan audience); after mount it re-renders in the
 * viewer's local timezone. suppressHydrationWarning covers clients whose clock/zone
 * config still diverges.
 */
const emptySubscribe = () => () => {};

export function LocalTime({ date, locale, format, dateOptions, className }: Props) {
  // false on the server and during hydration, true after mount — no state, no effect.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  // undefined timeZone → the runtime's local zone (the viewer's, once mounted).
  const tz = mounted ? undefined : SITE_TZ;
  const d = new Date(date);

  let text: string;
  switch (format) {
    case 'time':
      text = formatMatchTime(d, locale, tz);
      break;
    case 'date':
      text = formatMatchDate(d, locale, dateOptions, tz);
      break;
    case 'kickoff':
      text = formatKickoff(d, locale, tz);
      break;
    case 'featured':
      text = formatFeaturedDate(d, locale, tz);
      break;
  }

  return (
    <time dateTime={d.toISOString()} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
