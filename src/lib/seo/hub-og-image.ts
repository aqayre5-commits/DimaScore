import type { Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';

/**
 * Static branded 1200x630 share images for hub pages (home + Botola/Lions/Edition hubs).
 * Files live in /public/og/{key}-{locale}.png (pre-rendered with real Arabic RTL shaping).
 * Page-level `openGraph` replaces the layout's, so hubs must pass images explicitly.
 */
export type HubOgKey =
  | 'home'
  | 'botola-classement'
  | 'botola-matchs'
  | 'botola-calendrier'
  | 'lions-abroad'
  | 'edition-maroc';

export function hubOgImage(key: HubOgKey, locale: string, alt: string) {
  const loc: Locale = locale === 'en' || locale === 'ar' ? locale : 'fr';
  const url = `${BASE_URL}/og/${key}-${loc}.png`;
  return {
    og: [{ url, width: 1200, height: 630, alt, type: 'image/png' }],
    twitter: [{ url, width: 1200, height: 630, alt }],
  };
}
