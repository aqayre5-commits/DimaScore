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
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import {
  getCompetitionById,
  getLeagueCoverage,
  getCurrentSeasonYear,
  getLeagueRounds,
  getCurrentRound,
  getLeagueFeaturedMatches,
  getLeagueFixtures,
  getTopScorersForLeague,
  getTopAssistsForLeague,
  getTopCardsForLeague,
  getAvailableSeasons,
} from '@/lib/db/queries/league';
import { getInjuriesForCompetition } from '@/lib/db/queries/injuries';
import { InjuriesTab } from '@/components/league/InjuriesTab';
import { LeagueAboutCard } from '@/components/league/LeagueAboutCard';
import { LeaguePageHeader } from '@/components/league/LeaguePageHeader';
import { LeagueStandingsTab } from '@/components/league/LeagueStandingsTab';
import { LeagueRightRailCard } from '@/components/league/LeagueRightRailCard';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { LeagueOverviewTab } from '@/components/league/LeagueOverviewTab';
import { LeagueFixturesTab } from '@/components/league/LeagueFixturesTab';
import { LeaguePlayersTab } from '@/components/league/LeaguePlayersTab';
import { LeagueTeamsTab } from '@/components/league/LeagueTeamsTab';
import { getLeagueIntro, getLeagueCountryName } from '@/lib/constants/league-content';

async function getCachedLeagueData(competitionId: number, seasonYear: number) {
  'use cache';
  cacheLife('minutes');
  const [
    coverage,
    standings,
    rounds,
    currentRound,
    featuredMatches,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
  ] = await Promise.all([
    getLeagueCoverage(db, competitionId, seasonYear),
    getStandings(db, competitionId, seasonYear),
    getLeagueRounds(db, competitionId, seasonYear),
    getCurrentRound(db, competitionId, seasonYear),
    getLeagueFeaturedMatches(db, competitionId, seasonYear, 2),
    getLeagueFixtures(db, competitionId, seasonYear),
    getTopScorersForLeague(db, competitionId, seasonYear),
    getTopAssistsForLeague(db, competitionId, seasonYear),
    getTopCardsForLeague(db, competitionId, seasonYear),
    getInjuriesForCompetition(db, competitionId, seasonYear),
  ]);
  return {
    coverage,
    standings,
    rounds,
    currentRound,
    featuredMatches,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
  };
}

const LEAGUE_TAB_HASHES: Record<
  Locale,
  { overview: string; standings: string; fixtures: string; stats: string; teams: string }
> = {
  fr: {
    overview: 'apercu',
    standings: 'classement',
    fixtures: 'matchs',
    stats: 'statistiques',
    teams: 'equipes',
  },
  en: {
    overview: 'overview',
    standings: 'standings',
    fixtures: 'fixtures',
    stats: 'stats',
    teams: 'teams',
  },
  ar: {
    overview: 'نظرة-عامة',
    standings: 'الترتيب',
    fixtures: 'المباريات',
    stats: 'الإحصائيات',
    teams: 'الفرق',
  },
};

async function getCachedLeagueSeasonInfo(competitionId: number) {
  'use cache';
  cacheLife('minutes');
  const [availableSeasons, currentSeasonYear] = await Promise.all([
    getAvailableSeasons(db, competitionId),
    getCurrentSeasonYear(db, competitionId),
  ]);
  return { availableSeasons, currentSeasonYear };
}

export async function renderLeaguePage(
  competition: NonNullable<Awaited<ReturnType<typeof getCompetitionById>>>,
  entry: MegaMenuEntry,
  locale: Locale,
  rawLocale: string,
  rawCountry: string,
  rawTournament: string,
  seasonParam?: string,
  competitionLogos?: Record<number, string | null>,
) {
  const tBc = await getTranslations({ locale: rawLocale, namespace: 'breadcrumb' });
  const tL = await getTranslations({ locale: rawLocale, namespace: 'leaguePage' });

  const { availableSeasons, currentSeasonYear } = await getCachedLeagueSeasonInfo(competition.id);

  // Use season from URL param if valid, otherwise fall back to current
  const requestedYear = seasonParam ? Number(seasonParam) : null;
  const seasonYear =
    requestedYear && availableSeasons.some((s) => s.year === requestedYear)
      ? requestedYear
      : currentSeasonYear;

  if (!seasonYear) {
    // No season data — show coming soon
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

  // Cached parallel data fetch
  const {
    coverage,
    standings,
    rounds,
    currentRound,
    featuredMatches,
    fixtures,
    topScorers,
    topAssists,
    topCards,
    injuries,
  } = await getCachedLeagueData(competition.id, seasonYear);

  const competitionName = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const countryName = getLeagueCountryName(competition.countryCode, locale);
  const introText = getLeagueIntro(competition.id, locale);

  // Breadcrumbs
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${rawLocale}` },
    ...(countryName ? [{ label: countryName }] : []),
    { label: `${competitionName}, ${tBc('sectionsLeague')}` },
  ];

  // Center tabs — Overview / Matches / Standings / Stats / Teams
  const hashes = LEAGUE_TAB_HASHES[locale];
  const tabs = [
    {
      key: 'overview',
      hash: hashes.overview,
      labelKey: 'overview',
      icon: 'home',
      content: (
        <LeagueOverviewTab
          standings={standings}
          fixtures={fixtures}
          rounds={rounds}
          defaultRound={currentRound ?? 1}
          topScorers={topScorers}
          topAssists={topAssists}
          topCards={topCards}
          coverage={coverage}
          locale={locale}
        />
      ),
    },
    {
      key: 'fixtures',
      hash: hashes.fixtures,
      labelKey: 'fixtures',
      icon: 'calendar',
      content: (
        <LeagueFixturesTab
          fixtures={fixtures}
          rounds={rounds}
          defaultRound={currentRound ?? 1}
          locale={locale}
        />
      ),
    },
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      icon: 'table',
      content:
        coverage?.standings !== false && standings.length > 0 ? (
          <LeagueStandingsTab standings={standings} locale={locale} />
        ) : (
          <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
            <p className="text-sm text-text-tertiary">{tL('comingSoon')}</p>
          </div>
        ),
    },
    {
      key: 'stats',
      hash: hashes.stats,
      labelKey: 'stats',
      icon: 'chart',
      content: (
        <LeaguePlayersTab
          coverage={coverage}
          topScorers={topScorers}
          topAssists={topAssists}
          topCards={topCards}
          locale={locale}
        />
      ),
    },
    {
      key: 'teams',
      hash: hashes.teams,
      labelKey: 'teams',
      icon: 'shield',
      content: <LeagueTeamsTab standings={standings} locale={locale} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">
        <SeoBreadcrumb segments={breadcrumbs} compact />
      </div>

      <InnerPageShell
        pageHeader={
          <LeaguePageHeader
            competition={competition}
            seasonYear={seasonYear}
            locale={locale}
            countryName={countryName}
            introText={introText}
            availableSeasons={availableSeasons}
            teamsCount={new Set(standings.map((s) => s.teamId).filter(Boolean)).size}
            matchesCount={fixtures.length}
            totalRounds={rounds.length}
            currentRound={currentRound}
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
          featuredMatches.length > 0 ? (
            <LeagueRightRailCard
              featuredMatches={featuredMatches.slice(0, 1)}
              locale={locale}
              competitionName={competitionName}
              stretch
            />
          ) : undefined
        }
        rightRail={
          <LeagueRightRailCard
            featuredMatches={featuredMatches.slice(1)}
            topScorers={topScorers.slice(0, 3)}
            locale={locale}
            competitionName={competitionName}
          />
        }
        belowCenter={
          <>
            {/* Mobile-only: surface the right-rail featured matches (hidden xl:block rail). */}
            {featuredMatches.length > 0 && (
              <div className="xl:hidden">
                <LeagueRightRailCard
                  featuredMatches={featuredMatches}
                  locale={locale}
                  competitionName={competitionName}
                />
              </div>
            )}
            <LeagueAboutCard competition={competition} seasonYear={seasonYear} locale={locale} />
            {coverage?.injuries && <InjuriesTab injuries={injuries} />}
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
