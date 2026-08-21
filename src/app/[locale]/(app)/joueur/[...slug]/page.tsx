import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { PersonJsonLd } from '@/components/seo/PersonJsonLd';
import { PlayerPageHeader } from '@/components/player/PlayerPageHeader';
import { PlayerInfoCard } from '@/components/player/PlayerInfoCard';
import { PlayerSeasonStats } from '@/components/player/PlayerSeasonStats';
import { PlayerCareerTable } from '@/components/player/PlayerCareerTable';
import { PlayerTransfers } from '@/components/player/PlayerTransfers';
import { PlayerTrophies } from '@/components/player/PlayerTrophies';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';

import { CenterTabs } from '@/components/tournament/CenterTabs';
import { PlayerMediaSection } from '@/components/player/PlayerMediaSection';
import { db } from '@/lib/db/client';
import { getMatchState } from '@/lib/match-status';
import {
  getPlayerBySlug,
  getPlayerSeasonStats,
  getPlayerTransfers,
  getPlayerTrophies,
  getPlayerLastRatings,
} from '@/lib/db/queries/player';
import { getTeamFixturesWithCompetition } from '@/lib/db/queries/team';
import { getLocalizedCountryName } from '@/lib/constants/country-names-i18n';
import { BASE_URL } from '@/lib/constants/site';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = BASE_URL;

// ── Tab hash fragments per locale ──

const TAB_HASHES: Record<Locale, { season: string; career: string; trophies: string }> = {
  fr: { season: 'saison', career: 'carriere', trophies: 'palmares' },
  en: { season: 'season', career: 'career', trophies: 'trophies' },
  ar: { season: 'الموسم', career: 'المسيرة', trophies: 'الألقاب' },
};

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const playerSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const player = await getPlayerBySlug(db, playerSlug);

  if (!player) {
    return { title: 'Player | DimaScore' };
  }

  const name = player.name[typedLocale] ?? player.name['en'] ?? playerSlug;
  const title = `${name} | DimaScore`;
  const description = `${name} — season stats, career, transfers and more.`;
  const pageUrl = `${baseUrl}/${locale}/joueur/${rawSlug.join('/')}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/joueur/${rawSlug.join('/')}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}/joueur/${rawSlug.join('/')}`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

// ── Page ──

export default async function PlayerPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const playerSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const player = await getPlayerBySlug(db, playerSlug);
  if (!player) notFound();

  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });
  const playerName =
    [player.firstname, player.lastname].filter(Boolean).join(' ') ||
    player.name[typedLocale] ||
    player.name['en'] ||
    playerSlug;

  // Parallel data fetching
  const [fixtures, seasonStats, transfers, trophies, lastRatings] = await Promise.all([
    player.currentTeam ? getTeamFixturesWithCompetition(db, player.currentTeam.id, 200) : [],
    getPlayerSeasonStats(db, player.id),
    getPlayerTransfers(db, player.id),
    getPlayerTrophies(db, player.id),
    getPlayerLastRatings(db, player.id),
  ]);

  // Filter out not-yet-started seasons (European season N starts Aug N)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed, July = 6
  const maxSeasonYear = currentMonth >= 7 ? currentYear : currentYear - 1;
  const filteredStats = seasonStats.filter((s) => s.seasonYear <= maxSeasonYear);

  // Featured match priority: live > next upcoming > most recent completed
  const liveMatch = fixtures.find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const nextUpcoming = fixtures.find(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'upcoming',
  );
  const mostRecentCompleted = [...fixtures]
    .reverse()
    .find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished');
  const upcomingFixture = liveMatch ?? nextUpcoming ?? mostRecentCompleted ?? null;

  // Breadcrumbs: Football > Nationality > Player (+ sections)
  const nationality = getLocalizedCountryName(player.nationalityCode, locale);
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    ...(nationality ? [{ label: nationality }] : []),
    { label: playerName },
  ];

  // Center tabs — Statistics (season dropdown), Career (all-seasons table), Trophies (placeholder)
  const hashes = TAB_HASHES[typedLocale];
  const tabs = [
    {
      key: 'season',
      hash: hashes.season,
      labelKey: 'season',
      content: <PlayerSeasonStats stats={filteredStats} locale={typedLocale} />,
    },
    {
      key: 'career',
      hash: hashes.career,
      labelKey: 'career',
      content: <PlayerCareerTable stats={filteredStats} locale={typedLocale} />,
    },
    {
      key: 'trophies',
      hash: hashes.trophies,
      labelKey: 'trophies',
      content: <PlayerTrophies trophies={trophies} locale={typedLocale} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">
        <SeoBreadcrumb segments={breadcrumbs} compact />
        <PersonJsonLd
          url={`${baseUrl}/${typedLocale}/joueur/${rawSlug.join('/')}`}
          name={playerName}
          nationality={nationality}
          image={player.photoUrl}
          affiliation={
            player.currentTeam
              ? (player.currentTeam.name[typedLocale] ?? player.currentTeam.name['en'])
              : null
          }
        />
      </div>

      <InnerPageShell
        pageHeader={
          <PlayerPageHeader player={player} locale={typedLocale} lastRatings={lastRatings} />
        }
        rightRailTop={
          upcomingFixture ? (
            <FeaturedMatchCard fixture={upcomingFixture} locale={typedLocale} />
          ) : undefined
        }
        leftRail={
          <div className="space-y-4">
            <PlayerInfoCard player={player} locale={typedLocale} />
          </div>
        }
        center={<CenterTabs tabs={tabs} />}
        rightRail={
          <div className="space-y-4">
            <PlayerTransfers transfers={transfers} locale={typedLocale} />
          </div>
        }
        belowCenter={
          <div className="mt-6 space-y-6">
            {/* Mobile-only: surface the right-rail (next match + transfers), hidden xl:block. */}
            <div className="space-y-4 lg:hidden">
              {upcomingFixture && (
                <FeaturedMatchCard fixture={upcomingFixture} locale={typedLocale} />
              )}
              <PlayerTransfers transfers={transfers} locale={typedLocale} />
            </div>
            <PlayerMediaSection playerId={player.id} locale={typedLocale} />
          </div>
        }
      />
    </>
  );
}
