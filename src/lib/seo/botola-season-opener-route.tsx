import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { BotolaSeasonOpenerPage } from '@/components/seo/BotolaSeasonOpenerPage';
import {
  BOTOLA_SEASON_OPENER_SLUGS,
  botolaSeasonOpenerPath,
  botolaSeasonOpenerHreflang,
} from '@/lib/seo/botola-season-opener';

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };

export async function generateBotolaSeasonOpenerMetadata(locale: string): Promise<Metadata> {
  const typed = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'botolaSeasonOpener' });
  const pageUrl = `${BASE_URL}${botolaSeasonOpenerPath(typed)}`;
  const languages = botolaSeasonOpenerHreflang(BASE_URL);

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

export async function renderBotolaSeasonOpenerRoute(locale: string, routeSlug: string) {
  const typed = locale as Locale;
  const canonicalSlug = BOTOLA_SEASON_OPENER_SLUGS[typed];
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(botolaSeasonOpenerPath(typed));
  }
  setRequestLocale(locale);
  return <BotolaSeasonOpenerPage locale={typed} />;
}
