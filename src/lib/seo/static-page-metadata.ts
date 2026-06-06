import type { Metadata } from 'next';
import { BASE_URL } from '@/lib/constants/site';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };

/**
 * Shared metadata builder for the static footer pages. Mirrors the homepage's
 * canonical + hreflang + OpenGraph shape so the 5 routes stay thin.
 */
export function buildStaticPageMetadata(
  locale: Locale,
  slug: string,
  content: { title: string; description: string },
): Metadata {
  const pageUrl = `${BASE_URL}/${locale}/${slug}`;
  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${BASE_URL}/${loc}/${slug}`;
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/${slug}`;

  return {
    title: `${content.title} | DimaScore`,
    description: content.description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: content.title,
      description: content.description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: OG_LOCALE[locale],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: content.title,
      description: content.description,
    },
  };
}
