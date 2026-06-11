import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { type Locale } from '@/lib/i18n/config';
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
  searchParams: Promise<{ season?: string }>;
}

const baseUrl = BASE_URL;

/** Competitions that have the card-bracket experience (WC, AFCON, WAFCON). */
const BRACKET_COMPETITION_IDS = new Set([1, 6, 922]);

/** Breadcrumb organisation label per mega-menu countryKey. */
const ORG_BY_COUNTRY: Record<string, string> = { fifa: 'FIFA', caf: 'CAF' };

function resolveEntry(tournament: string, locale: Locale): MegaMenuEntry | undefined {
  return ALL_ENTRIES.find((entry) => entry.slugs[locale] === tournament);
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const tournament = decodeURIComponent(rawTournament);
  const country = decodeURIComponent(rawCountry);
  const typedLocale = locale as Locale;
  const tT = await getTranslations({ locale, namespace: 'tournament' });
  const tNav = await getTranslations({ locale, namespace: 'megaMenu' });

  const entry = resolveEntry(tournament, typedLocale);
  const isWc = entry?.competitionId === 1;
  const name = entry ? tNav(entry.labelKey) : tournament;
  const bracketTitle = tT('bracketPageTitle');
  const title = `${name} — ${bracketTitle} | DimaScore`;
  const description = isWc ? tT('bracketPageIntro') : `${name} — ${bracketTitle}`;

  const alternates: Metadata['alternates'] = {
    canonical: `${baseUrl}/${locale}/competition/${country}/${tournament}/bracket`,
  };
  // Preserve the World Cup's hand-built hreflang block; other cups use canonical only.
  if (isWc) {
    alternates.languages = {
      fr: `${baseUrl}/fr/competition/fifa/coupe-du-monde-2026/bracket`,
      en: `${baseUrl}/en/competition/fifa/world-cup-2026/bracket`,
      ar: `${baseUrl}/ar/competition/فيفا/كأس-العالم-2026/bracket`,
      'x-default': `${baseUrl}/en/competition/fifa/world-cup-2026/bracket`,
    };
  }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${baseUrl}/${locale}/competition/${country}/${tournament}/bracket`,
    },
  };
}

// ── Page ──

export default async function BracketPage({ params, searchParams }: PageProps) {
  const { locale, country: rawCountry, tournament: rawTournament } = await params;
  const { season } = await searchParams;
  const tournament = decodeURIComponent(rawTournament);
  const typedLocale = locale as Locale;
  const tB = await getTranslations({ locale, namespace: 'breadcrumb' });
  const tT = await getTranslations({ locale, namespace: 'tournament' });
  const tNav = await getTranslations({ locale, namespace: 'megaMenu' });

  const entry = resolveEntry(tournament, typedLocale);
  if (!entry || !BRACKET_COMPETITION_IDS.has(entry.competitionId)) {
    return <div className="p-8 text-center text-text-tertiary">Bracket not available.</div>;
  }
  const competitionId = entry.competitionId;
  const metadata = getMetadataForCompetition(competitionId);
  if (!metadata || metadata.type !== 'cup') {
    return <div className="p-8 text-center text-text-tertiary">Bracket not available.</div>;
  }

  const isWc = competitionId === 1;
  const competitionName = tNav(entry.labelKey);
  const bracketTitle = tT('bracketPageTitle');
  const introText = isWc ? tT('bracketIntroShort') : '';
  const org = ORG_BY_COUNTRY[entry.countryKey] ?? entry.countryKey.toUpperCase();

  // Edition: ?season= wins, else the current season.
  const requestedSeason = season ? Number(season) : null;
  const seasonYear = requestedSeason ?? (await getCurrentSeasonYear(db, competitionId));

  // Fetch dynamic bracket data from DB (falls back to static schedule in BracketPageClient).
  let bracketData: ReturnType<typeof buildDynamicBracket> = null;
  if (seasonYear) {
    const knockoutFixtures = await getKnockoutFixtures(db, competitionId, seasonYear);
    if (knockoutFixtures.length > 0) {
      bracketData = buildDynamicBracket(knockoutFixtures, typedLocale);
    }
  }

  const competitionHref = `/${locale}/competition/${rawCountry}/${rawTournament}`;
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tB('football'), href: `/${locale}` },
    { label: tB('international') },
    { label: org },
    { label: competitionName, href: competitionHref },
    { label: bracketTitle },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6">
        <SeoBreadcrumb segments={breadcrumbs} compact />
        <h1 className="mt-4 text-2xl font-semibold text-text-primary">
          {competitionName} — {bracketTitle}
        </h1>
        {introText && <p className="mt-2 max-w-3xl text-sm text-text-secondary">{introText}</p>}
      </div>

      <div className="w-full px-4 pb-8">
        <BracketPageClient
          locale={typedLocale}
          competitionId={competitionId}
          matches={bracketData?.matches}
          thirdPlaceMatch={bracketData?.thirdPlaceMatch}
          gridConfig={bracketData?.gridConfig}
        />
      </div>

      {isWc && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsEvent',
              name: `${competitionName} — ${bracketTitle}`,
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
      )}
    </>
  );
}
