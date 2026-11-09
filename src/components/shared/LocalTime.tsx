'use client';

import { useSyncExternalStore } from 'react';
import type { Locale } from '@/lib/i18n/config';
import {
  formatServerKickoff,
  formatViewerKickoff,
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
 * Kickoff clock.
 *
 * SSR + the client's first render: the real kickoff in the site zone (Africa/Casablanca), inside
 * `<time datetime={iso}>` — so crawlers and no-JS readers see a true date/time instead of a
 * "Sat 00 Jan · 00:00" placeholder. Both sides format with the same fixed zone, so hydration is
 * deterministic; after mount it switches to the viewer's own zone. `suppressHydrationWarning`
 * covers tiny ICU punctuation differences between Node and the browser.
 */
const emptySubscribe = () => () => {};

export function LocalTime({ date, locale, format, dateOptions, className }: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const iso = d.toISOString();
  const text = mounted
    ? formatViewerKickoff(d, locale, format, dateOptions)
    : formatServerKickoff(d, locale, format, dateOptions);

  return (
    <time dateTime={iso} className={className}>
      <span suppressHydrationWarning>{text}</span>
    </time>
  );
}
