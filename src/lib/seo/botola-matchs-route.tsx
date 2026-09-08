import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { BotolaMatchsPage } from '@/components/seo/BotolaMatchsPage';
import {
  BOTOLA_MATCHS_SLUGS,
  botolaMatchsPath,
  botolaMatchsHreflang,
} from '@/lib/seo/botola-matchs';

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };

export async function generateBotolaMatchsMetadata(locale: string): Promise<Metadata> {
  const typed = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'botolaMatchs' });
  const pageUrl = `${BASE_URL}${botolaMatchsPath(typed)}`;
  const languages = botolaMatchsHreflang(BASE_URL);

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: pageUrl,
      siteName: 'DimaScore',
      locale: OG_LOCALE[typed],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export async function renderBotolaMatchsRoute(locale: string, routeSlug: string) {
  const typed = locale as Locale;
  const canonicalSlug = BOTOLA_MATCHS_SLUGS[typed];
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(botolaMatchsPath(typed));
  }
  setRequestLocale(locale);
  return <BotolaMatchsPage locale={typed} />;
}
