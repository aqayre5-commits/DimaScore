import type { Locale } from '@/lib/i18n/config';

/**
 * Locale display name for a competition.
 *
 * Provider names are stored mostly in English only (`{ en: 'Premier League' }`), which left Arabic
 * and French hubs with an English H1 and title. Order: a stored name for this exact locale, then the
 * site's own translated mega-menu label for the competition, then the stored English name.
 */
export function competitionDisplayName(
  storedName: Partial<Record<string, string>> | null | undefined,
  locale: Locale,
  menuLabel?: string | null,
  fallback = '',
): string {
  const own = storedName?.[locale]?.trim();
  if (own) return own;
  const label = menuLabel?.trim();
  if (label) return label;
  return storedName?.en?.trim() || fallback;
}
