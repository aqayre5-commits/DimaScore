/**
 * Calendar-day formatting shared by the tournament header and the hub intros (R5 and R9).
 *
 * Inputs are calendar days (`YYYY-MM-DD`, no time), so nothing here depends on a time zone.
 * Arabic uses Moroccan month names (دجنبر, يوليوز, غشت, شتنبر, نونبر, ماي), from a fixed table
 * instead of ICU, so the server and the browser print the same text whatever their ICU data says
 * (ICU's plain `ar` gives ديسمبر / يوليو / أغسطس …). Latin digits, as on the rest of the site.
 * English and French use Intl in UTC, with whitespace normalised.
 *
 * This file is identical in PR #34 (R5) and PR #39 (R9) on purpose: git merges two identical
 * additions without a conflict, so either can land first.
 */

export const AR_MOROCCAN_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'ماي',
  'يونيو',
  'يوليوز',
  'غشت',
  'شتنبر',
  'أكتوبر',
  'نونبر',
  'دجنبر',
] as const;

const INTL_LOCALE: Record<string, string> = { en: 'en-GB', fr: 'fr-FR' };

function parseDay(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d || m > 12 || d > 31) throw new Error(`Not a YYYY-MM-DD day: ${iso}`);
  return { y, m, d };
}

function norm(s: string): string {
  return s.replace(/\s+/g, ' ');
}

/** "21 December 2025", "21 décembre 2025", "21 دجنبر 2025". */
export function formatCalendarDay(iso: string, locale: string): string {
  const { y, m, d } = parseDay(iso);
  if (locale === 'ar') return `${d} ${AR_MOROCCAN_MONTHS[m - 1]} ${y}`;
  return norm(
    new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(y, m - 1, d))),
  );
}

/**
 * "21 December 2025 – 18 January 2026"; the year is written once when both days share it
 * ("11 June – 19 July 2026"), the month too when they share that ("21 – 25 June 2026").
 */
export function formatDateRange(startIso: string, endIso: string, locale: string): string {
  if (locale !== 'ar') {
    const a = parseDay(startIso);
    const b = parseDay(endIso);
    return norm(
      new Intl.DateTimeFormat(INTL_LOCALE[locale] ?? 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).formatRange(new Date(Date.UTC(a.y, a.m - 1, a.d)), new Date(Date.UTC(b.y, b.m - 1, b.d))),
    );
  }
  const a = parseDay(startIso);
  const b = parseDay(endIso);
  const ma = AR_MOROCCAN_MONTHS[a.m - 1];
  const mb = AR_MOROCCAN_MONTHS[b.m - 1];
  if (a.y !== b.y) return `${a.d} ${ma} ${a.y} – ${b.d} ${mb} ${b.y}`;
  if (a.m !== b.m) return `${a.d} ${ma} – ${b.d} ${mb} ${b.y}`;
  return `${a.d} – ${b.d} ${mb} ${b.y}`;
}
