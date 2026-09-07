import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { BotolaClassementPage } from '@/components/seo/BotolaClassementPage';
import {
  BOTOLA_CLASSEMENT_SLUGS,
  botolaClassementPath,
  botolaClassementHreflang,
} from '@/lib/seo/botola-classement';

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };

export async function generateBotolaClassementMetadata(locale: string): Promise<Metadata> {
  const typed = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'botolaClassement' });
  const pageUrl = `${BASE_URL}${botolaClassementPath(typed)}`;
  const languages = botolaClassementHreflang(BASE_URL);

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

export async function renderBotolaClassementRoute(locale: string, routeSlug: string) {
  const typed = locale as Locale;
  const canonicalSlug = BOTOLA_CLASSEMENT_SLUGS[typed];
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(botolaClassementPath(typed));
  }
  setRequestLocale(locale);
  return <BotolaClassementPage locale={typed} />;
}
