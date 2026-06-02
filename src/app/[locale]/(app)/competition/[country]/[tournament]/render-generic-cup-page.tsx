import { cacheLife } from 'next/cache';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import {
  getRelatedCompetitionIds,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { RelatedCompetitions } from '@/components/tournament/RelatedCompetitions';
import { CompetitionMediaSection } from '@/components/tournament/CompetitionMediaSection';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { CupOverviewTab } from '@/components/tournament/CupOverviewTab';
import { CupFixturesTab } from '@/components/tournament/CupFixturesTab';
import { DynamicKnockoutBracket } from '@/components/tournament/DynamicKnockoutBracket';
import { buildDynamicBracket } from '@/lib/constants/dynamic-bracket-builder';
import { db } from '@/lib/db/client';
import { getKnockoutFixtures, getStandings } from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueCoverage,
  getCurrentSeasonYear,
  getLeagueFeaturedMatches,
  getLeagueFixtures,
  getTopScorersForLeague,
  getTopAssistsForLeague,
  getAvailableSeasons,
} from '@/lib/db/queries/league';
import { getInjuriesForCompetition } from '@/lib/db/queries/injuries';
import { InjuriesTab } from '@/components/league/InjuriesTab';
import { LeagueAboutCard } from '@/components/league/LeagueAboutCard';
import { LeaguePageHeader } from '@/components/league/LeaguePageHeader';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import { LeagueRightRail } from '@/components/league/LeagueRightRail';
import { LeagueRightRailCard } from '@/components/league/LeagueRightRailCard';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { getLeagueCountryName } from '@/lib/constants/league-content';

async function getCachedGenericCupData(competitionId: number, seasonYear: number) {
  'use cache';
  cacheLife('minutes');
  const [
    standings,
    knockoutFixtures,
    allFixtures,
    coverage,
    cupInjuries,
    topScorers,
    topAssists,
    genericFeaturedMatches,
  ] = await Promise.all([
    getStandings(db, competitionId, seasonYear),
    getKnockoutFixtures(db, competitionId, seasonYear),
    getLeagueFixtures(db, competitionId, seasonYear),
    getLeagueCoverage(db, competitionId, seasonYear),
    getInjuriesForCompetition(db, competitionId, seasonYear),
    getTopScorersForLeague(db, competitionId, seasonYear, 5),
    getTopAssistsForLeague(db, competitionId, seasonYear, 5),
    getLeagueFeaturedMatches(db, competitionId, seasonYear, 2),
  ]);
  return {
    standings,
    knockoutFixtures,
    allFixtures,
    coverage,
    cupInjuries,
    topScorers,
    topAssists,
    genericFeaturedMatches,
  };
}

async function getCachedGenericCupSeasonInfo(competitionId: number) {
  'use cache';
  cacheLife('minutes');
  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competitionId),
    getCurrentSeasonYear(db, competitionId),
  ]);
  return { availableSeasons, currentSeasonYear };
}

export async function renderGenericCupPage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  _entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  _rawCountry: string,
  seasonParam?: string,
  competitionLogos?: Record<number, string | null>,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });

  const { availableSeasons, currentSeasonYear } = await getCachedGenericCupSeasonInfo(
    competition.id,
  );

  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const seasonYear =
    requestedYear && availableSeasons.some((s) => s.year === requestedYear)
      ? requestedYear
      : currentSeasonYear;

  if (!seasonYear) {
    const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
        </div>
      </div>
    );
  }

  const {
    standings,
    knockoutFixtures,
    allFixtures,
    coverage,
    cupInjuries,
    topScorers,
    topAssists,
    genericFeaturedMatches,
  } = await getCachedGenericCupData(competition.id, seasonYear);

  const competitionName = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const countryName = getLeagueCountryName(competition.countryCode, locale);

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    ...(countryName ? [{ label: countryName }] : []),
    { label: competitionName },
  ];

  // Exclude qualifying rounds from hero match count (e.g. UCL 1st/2nd/3rd Qualifying + Play-offs)
  const mainFixturesCount = allFixtures.filter(
    (f) => !f.round?.includes('Qualifying') && f.round !== 'Play-offs',
  ).length;

  const hasStandings = standings.length > 0;
  const hasKnockout = knockoutFixtures.length > 0;

  // Build bracket data for knockout tab
  const bracketData = hasKnockout ? buildDynamicBracket(knockoutFixtures, locale) : null;

  const tabs = [
    {
      key: 'overview',
      hash: 'overview',
      labelKey: 'overview',
      icon: 'home',
      content: (
        <CupOverviewTab
          fixtures={allFixtures}
          standings={standings}
          topScorers={topScorers}
          topAssists={topAssists}
          coverage={coverage}
          locale={locale}
        />
      ),
    },
    ...(allFixtures.length > 0
      ? [
          {
            key: 'matches',
            hash: 'matches',
            labelKey: 'matches',
            icon: 'calendar',
            content: <CupFixturesTab fixtures={allFixtures} locale={locale} />,
          },
        ]
      : []),
    ...(hasStandings
      ? [
          {
            key: 'standings',
            hash: 'standings',
            labelKey: 'standings',
            icon: 'table',
            content: <LeagueStandingsTab standings={standings} locale={locale} />,
          },
        ]
      : []),
    ...(bracketData
      ? [
          {
            key: 'knockout',
            hash: 'knockout',
            labelKey: 'knockout',
            icon: 'swords',
            content: (
              <DynamicKnockoutBracket
                matches={bracketData.matches}
                thirdPlaceMatch={bracketData.thirdPlaceMatch}
                locale={locale}
                gridConfig={bracketData.gridConfig}
                competitionId={competition.id}
              />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={
          <LeaguePageHeader
            competition={competition}
            seasonYear={seasonYear}
            locale={locale}
            countryName={countryName}
            introText={null}
            availableSeasons={availableSeasons}
            teamsCount={new Set(standings.map((s) => s.teamId).filter(Boolean)).size}
            matchesCount={mainFixturesCount}
          />
        }
        leftRail={
          <LeagueLeftRail
            locale={locale}
            activeCompetitionId={competition.id}
            competitionLogos={competitionLogos}
          />
        }
        center={<CenterTabs tabs={tabs} />}
        rightRailTop={
          genericFeaturedMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={genericFeaturedMatches.slice(0, 1)}
              locale={locale}
              competitionName={competitionName}
              stretch
            />
          ) : undefined
        }
        rightRail={
          <LeagueRightRail
            competitionName={competitionName}
            coverage={coverage}
            topScorers={topScorers.slice(0, 3)}
            topAssists={topAssists.slice(0, 3)}
            locale={locale}
          />
        }
        belowCenter={
          <>
            <LeagueAboutCard competition={competition} seasonYear={seasonYear} locale={locale} />
            {coverage?.injuries && <InjuriesTab injuries={cupInjuries} />}
            <RelatedCompetitions
              competitionIds={getRelatedCompetitionIds(competition.id)}
              locale={locale}
            />
            <CompetitionMediaSection competitionId={competition.id} locale={locale} />
          </>
        }
      />
    </>
  );
}
