import { INTL_LOCALE } from '@/lib/utils/date';
import type { Locale } from '@/lib/i18n/config';

/**
 * Date span of a round for the Fixtures round menu, from site date keys (YYYY-MM-DD):
 * "30 May", "25–26 Nov", "28 Apr–6 May". Empty when the round has no dated fixtures.
 */
export function formatRoundRange(dayKeys: string[], locale: Locale): string {
  const keys = [...new Set(dayKeys.filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)))].sort();
  if (keys.length === 0) return '';
  const tag = INTL_LOCALE[locale];
  const at = (key: string) => new Date(`${key}T12:00:00Z`);
  const day = (key: string) =>
    new Intl.DateTimeFormat(tag, { day: 'numeric', timeZone: 'UTC' }).format(at(key));
  const dayMonth = (key: string) =>
    new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      at(key),
    );
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (first === last) return dayMonth(first);
  if (first.slice(0, 7) === last.slice(0, 7)) {
    // Same month: "25–26 Nov" (the month once, taken from the last date).
    const month = dayMonth(last).replace(day(last), '').trim();
    return `${day(first)}–${day(last)} ${month}`.trim();
  }
  return `${dayMonth(first)}–${dayMonth(last)}`;
}
