'use client';

import { useSyncExternalStore } from 'react';
import type { Locale } from '@/lib/i18n/config';
import {
  formatViewerKickoff,
  KICKOFF_PLACEHOLDER,
  type KickoffTimeFormat,
} from '@/lib/utils/local-time';

interface Props {
  date: Date | string;
  locale: Locale;
  format: KickoffTimeFormat;
  /** Only used with format="date" — forwarded to formatMatchDate. */
  dateOptions?: Intl.DateTimeFormatOptions;
  className?: string;
}

/**
 * Kickoff clock: viewer-local only.
 *
 * SSR / first paint: `<time datetime={iso}>` + a transparent placeholder (never
 * Africa/Casablanca, venue TZ, server TZ, or UTC). After mount, format in the
 * viewer's zone. Placeholder → local is OK; wrong-zone → local is not.
 */
const emptySubscribe = () => () => {};

export function LocalTime({ date, locale, format, dateOptions, className }: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const d = new Date(date);
  const iso = d.toISOString();
  const text = mounted
    ? formatViewerKickoff(d, locale, format, dateOptions)
    : KICKOFF_PLACEHOLDER[format];

  return (
    <time dateTime={iso} className={className}>
      <span className={mounted ? undefined : 'invisible tabular-nums'} aria-hidden={!mounted}>
        {text}
      </span>
    </time>
  );
}
