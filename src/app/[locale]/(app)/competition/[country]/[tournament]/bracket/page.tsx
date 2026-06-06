import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { defaultLocale, type Locale } from '@/lib/i18n/config';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { getMetadataForCompetition } from '@/lib/constants/tournament-metadata';
import { ALL_ENTRIES, type MegaMenuEntry } from '@/lib/constants/competitions-mega-menu';
import { BracketPageClient } from '@/components/tournament/BracketPageClient';
import { db } from '@/lib/db/client';
import { getKnockoutFixtures } from '@/lib/db/queries';
import { getCurrentSeasonYear } from '@/lib/db/queries/league';
import { buildDynamicBracket } from '@/lib/constants/dynamic-bracket-builder';
import { BASE_URL } from '@/lib/constants/site';

interface PageProps {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}

const baseUrl = BASE_URL;

const WC_2026_SLUGS = ['coupe-du-monde-2026', 'world-cup-2026', 'كأس-العالم-2026'];

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  return ALL_ENTRIES.find((entry) => entry.slugs[locale] === tournament);
}

function isWc2026(tournament: string): boolean {
  return WC_2026_SLUGS.includes(tournament);
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const tournament = decodeURIComponent(rawTournament);
  const country = decodeURIComponent(rawCountry);
  const typedLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'tournament' });

  const tournamentName = t('wc2026FullName');
  const bracketTitle = t('bracketPageTitle');
  const description = t('bracketPageIntro');
  const title = `${bracketTitle} — ${tournamentName} | DimaScore`;

  const languages: Record<string, string> = {};
  languages['fr'] = `${baseUrl}/fr/competition/fifa/coupe-du-monde-2026/bracket`;
  languages['en'] = `${baseUrl}/en/competition/fifa/world-cup-2026/bracket`;
  languages['ar'] = `${baseUrl}/ar/competition/فيفا/كأس-العالم-2026/bracket`;
  languages['x-default'] = languages[defaultLocale];

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}/competition/${country}/${tournament}/bracket`,
      languages,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/${locale}/competition/${country}/${tournament}/bracket`,
    },
  };
}

// ── Page ──

export default async function BracketPage({ params }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const tournament = decodeURIComponent(rawTournament);
  const country = decodeURIComponent(rawCountry);
  const typedLocale = locale as Locale;
  const tB = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tT = await getTranslations({ locale, namespace: 'tournament' });

  if (!isWc2026(tournament)) {
    return <div className="p-8 text-center text-text-tertiary">Bracket not available.</div>;
  }

  const entry = resolveEntry(tournament, typedLocale);
  const metadata = entry ? getMetadataForCompetition(entry.competitionId) : undefined;

  if (!metadata || metadata.type !== 'cup') {
    return <div className="p-8 text-center text-text-tertiary">Bracket not available.</div>;
  }

  const tournamentName = tT('wc2026FullName');
  const bracketTitle = tT('bracketPageTitle');
  const introText = tT('bracketIntroShort');

  // Fetch dynamic bracket data from DB (falls back to static in BracketPageClient)
  let bracketData: {
    matches: import('@/components/tournament/BracketMatchCell').BracketMatch[];
    thirdPlaceMatch?: import('@/components/tournament/BracketMatchCell').BracketMatch;
  } | null = null;
  if (entry) {
    const seasonYear = await getCurrentSeasonYear(db, entry.competitionId);
    if (seasonYear) {
      const knockoutFixtures = await getKnockoutFixtures(db, entry.competitionId, seasonYear);
      if (knockoutFixtures.length > 0) {
        bracketData = buildDynamicBracket(knockoutFixtures, typedLocale);
      }
    }
  }

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tB('football'), href: `/${locale}` },
    { label: tB('international') },
    { label: 'FIFA' },
    { label: tournamentName, href: `/${locale}/competition/${country}/${tournament}` },
    { label: bracketTitle },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <SeoBreadcrumb segments={breadcrumbs} compact />
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">
          {tournamentName} — {bracketTitle}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-text-secondary">{introText}</p>
      </div>

      <div className="w-full px-4 pb-8">
        <BracketPageClient
          locale={typedLocale}
          matches={bracketData?.matches}
          thirdPlaceMatch={bracketData?.thirdPlaceMatch}
        />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: `${tournamentName} — ${bracketTitle}`,
            startDate: '2026-06-28',
            endDate: '2026-07-19',
            location: {
              '@type': 'Place',
              name: 'United States, Canada, Mexico',
            },
            organizer: {
              '@type': 'SportsOrganization',
              name: 'FIFA',
            },
            description: introText,
          }),
        }}
      />
    </>
  );
}
