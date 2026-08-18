import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';
import { getFullFifaRanking, FIFA_RANKING_META } from '@/lib/constants/fifa-ranking';
import { FifaRankingTable } from '@/components/fifa/FifaRankingTable';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const SEGMENT = 'classement-fifa';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const pageUrl = `${BASE_URL}/${locale}/${SEGMENT}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) languages[loc] = `${BASE_URL}/${loc}/${SEGMENT}`;
  languages['x-default'] = `${BASE_URL}/${defaultLocale}/${SEGMENT}`;

  return {
    title: t('fifaRankingPageTitle'),
    description: t('fifaRankingPageDescription'),
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title: t('fifaRankingPageTitle'),
      description: t('fifaRankingPageDescription'),
      url: pageUrl,
      siteName: 'DimaScore',
      type: 'website',
    },
  };
}

export default async function FifaRankingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });

  const rows = getFullFifaRanking(typedLocale);
  const asOf = new Intl.DateTimeFormat(typedLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(FIFA_RANKING_META.updatedAt));

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 py-6">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-text-primary">{t('fifaRanking')}</h1>
        <p className="mt-1 text-sm text-text-tertiary">{t('asOf', { date: asOf })}</p>
      </header>

      <FifaRankingTable
        rows={rows}
        labels={{
          findCountry: t('findCountry'),
          rank: t('rank'),
          country: t('country'),
          points: t('points'),
          noResults: t('noResults'),
        }}
      />
    </div>
  );
}
