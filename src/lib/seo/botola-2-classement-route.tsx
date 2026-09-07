import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { resolveCompetitionSeason } from '@/lib/competitions/league-season-query';
import { Botola2ClassementPage } from '@/components/seo/Botola2ClassementPage';
import {
  BOTOLA_2_CLASSEMENT_SLUGS,
  BOTOLA_2_COMPETITION_ID,
  botola2ClassementPath,
  botola2ClassementHreflang,
  botola2SeasonLabel,
} from '@/lib/seo/botola-2-classement';

const OG_LOCALE: Record<Locale, string> = { fr: 'fr_FR', en: 'en_US', ar: 'ar_MA' };

export async function generateBotola2ClassementMetadata(locale: string): Promise<Metadata> {
  const typed = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'botola2Classement' });
  const { seasonYear } = await resolveCompetitionSeason(BOTOLA_2_COMPETITION_ID, null);
  const season = botola2SeasonLabel(seasonYear);
  const description = t('metaDescription', { season });
  const pageUrl = `${BASE_URL}${botola2ClassementPath(typed)}`;
  const languages = botola2ClassementHreflang(BASE_URL);

  return {
    title: t('metaTitle'),
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: t('metaTitle'),
      description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: OG_LOCALE[typed],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: t('metaTitle'),
      description,
    },
  };
}

export async function renderBotola2ClassementRoute(locale: string, routeSlug: string) {
  const typed = locale as Locale;
  const canonicalSlug = BOTOLA_2_CLASSEMENT_SLUGS[typed];
  if (canonicalSlug && canonicalSlug !== routeSlug) {
    permanentRedirect(botola2ClassementPath(typed));
  }
  setRequestLocale(locale);
  return <Botola2ClassementPage locale={typed} />;
}
