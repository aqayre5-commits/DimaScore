import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { TeamPageHeader } from '@/components/team/TeamPageHeader';
import { TeamSquadTable } from '@/components/team/TeamSquadTable';
import { TeamStandingsWithFilter } from '@/components/team/TeamStandingsWithFilter';
import { TeamCompetitionTeams } from '@/components/team/TeamCompetitionTeams';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { TeamStatistics } from '@/components/team/TeamStatistics';
import { TeamMatchesList } from '@/components/team/TeamMatchesList';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';

import { CenterTabs } from '@/components/tournament/CenterTabs';
import { TeamMediaSection } from '@/components/team/TeamMediaSection';
import { db } from '@/lib/db/client';
import { getMatchState } from '@/lib/match-status';
import {
  getTeamBySlug,
  getTeamFixturesWithCompetition,
  getTeamSquad,
  getTeamAllStandings,
  getTeamSeasonStats,
  getTeamsInSameCompetition,
  getTeamFormResults,
  getTeamPrimaryCompetition,
} from '@/lib/db/queries/team';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import { BASE_URL } from '@/lib/constants/site';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = BASE_URL;

// ── Tab hash fragments per locale ──

const TAB_HASHES: Record<Locale, { standings: string; statistics: string; players: string }> = {
  fr: { standings: 'classement', statistics: 'statistiques', players: 'effectif' },
  en: { standings: 'standings', statistics: 'statistics', players: 'squad' },
  ar: { standings: 'الترتيب', statistics: 'الإحصائيات', players: 'التشكيلة' },
};

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const team = await getTeamBySlug(db, teamSlug);

  if (!team) {
    return { title: 'Team | DimaScore' };
  }

  const name = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;
  const title = `${name} | DimaScore`;
  const description = `${name} — fixtures, squad, standings and statistics.`;
  const pageUrl = `${baseUrl}/${locale}/equipe/${rawSlug.join('/')}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}/equipe/${rawSlug.join('/')}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}/equipe/${rawSlug.join('/')}`;

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

export default async function TeamPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const team = await getTeamBySlug(db, teamSlug);
  if (!team) notFound();

  const tBc = await getTranslations({ locale, namespace: 'breadcrumb' });
  const teamName = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;

  // Parallel data fetching
  const [
    fixtures,
    squad,
    allStandings,
    teamSeasonStats,
    competitionTeams,
    formResults,
    primaryComp,
  ] = await Promise.all([
    getTeamFixturesWithCompetition(db, team.id, 200),
    getTeamSquad(db, team.id),
    getTeamAllStandings(db, team.id),
    getTeamSeasonStats(db, team.id),
    getTeamsInSameCompetition(db, team.id),
    getTeamFormResults(db, team.id),
    getTeamPrimaryCompetition(db, team.id),
  ]);

  // Featured match priority: live > next upcoming > most recent completed
  const liveMatch = fixtures.find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const nextUpcoming = fixtures.find(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'upcoming',
  );
  const mostRecentCompleted = [...fixtures]
    .reverse()
    .find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished');
  const upcomingFixture = liveMatch ?? nextUpcoming ?? mostRecentCompleted ?? null;

  // Competition name for left rail team tiles
  const compTeamsName = competitionTeams.competitionName
    ? (competitionTeams.competitionName[typedLocale] ??
      competitionTeams.competitionName['en'] ??
      '')
    : '';

  // Breadcrumbs: Football > Country > League > Team
  const breadcrumbs: BreadcrumbSegment[] = [{ label: tBc('football'), href: `/${locale}` }];
  if (primaryComp) {
    const countryName = getLeagueCountryName(primaryComp.countryCode, typedLocale);
    if (countryName) {
      breadcrumbs.push({ label: countryName });
    }
    const compName = primaryComp.name[typedLocale] ?? primaryComp.name['en'] ?? primaryComp.slug;
    const countrySlug = (primaryComp.countryCode ?? '').toLowerCase();
    breadcrumbs.push({
      label: compName,
      href: `/${locale}/competition/${countrySlug}/${primaryComp.slug}`,
    });
  }
  breadcrumbs.push({ label: teamName });

  // Center tabs — Standings, Statistics, Players (per schematic)
  const hashes = TAB_HASHES[typedLocale];
  const tabs = [
    {
      key: 'standings',
      hash: hashes.standings,
      labelKey: 'standings',
      content: (
        <TeamStandingsWithFilter
          competitions={allStandings.competitions}
          seasons={allStandings.seasons}
          standingsByCompSeason={allStandings.standingsByCompSeason}
          highlightTeamId={team.id}
          locale={typedLocale}
          defaultCompetitionId={primaryComp?.id}
        />
      ),
    },
    {
      key: 'statistics',
      hash: hashes.statistics,
      labelKey: 'statistics',
      content: <TeamStatistics data={teamSeasonStats} locale={typedLocale} />,
    },
    {
      key: 'players',
      hash: hashes.players,
      labelKey: 'players',
      content: <TeamSquadTable players={squad} locale={typedLocale} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={<TeamPageHeader team={team} locale={typedLocale} formResults={formResults} />}
        rightRailTop={
          upcomingFixture ? (
            <FeaturedMatchCard fixture={upcomingFixture} locale={typedLocale} />
          ) : undefined
        }
        leftRail={
          <div className="space-y-4">
            <LeagueLeftRail locale={typedLocale} activeCompetitionId={primaryComp?.id} />
            {competitionTeams.teams.length > 0 && (
              <TeamCompetitionTeams
                teams={competitionTeams.teams}
                competitionName={compTeamsName}
                highlightTeamId={team.id}
                locale={typedLocale}
              />
            )}
          </div>
        }
        center={<CenterTabs tabs={tabs} />}
        rightRail={<TeamMatchesList fixtures={fixtures} locale={typedLocale} teamId={team.id} />}
        belowCenter={<TeamMediaSection teamId={team.id} locale={typedLocale} />}
      />
    </>
  );
}
