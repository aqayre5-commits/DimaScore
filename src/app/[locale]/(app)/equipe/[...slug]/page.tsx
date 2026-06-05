import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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
import { TeamGroupStandingsCard } from '@/components/team/TeamGroupStandingsCard';
import { KeyPlayersCard } from '@/components/team/KeyPlayersCard';
import { TournamentScorersCard } from '@/components/team/TournamentScorersCard';
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
  getTeamTournamentSquad,
  getTeamKeyPlayers,
  getTeamTournamentScorers,
} from '@/lib/db/queries/team';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import { BASE_URL } from '@/lib/constants/site';
import { cacheLife } from 'next/cache';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

const baseUrl = BASE_URL;

// ── Tab hash fragments per locale ──

const TAB_HASHES: Record<
  Locale,
  { matches: string; standings: string; statistics: string; squad: string }
> = {
  fr: { matches: 'matchs', standings: 'classement', statistics: 'statistiques', squad: 'effectif' },
  en: { matches: 'matches', standings: 'standings', statistics: 'statistics', squad: 'squad' },
  ar: { matches: 'المباريات', standings: 'الترتيب', statistics: 'الإحصائيات', squad: 'التشكيلة' },
};

// ── Cached data ──

async function getCachedTeamData(teamSlug: string) {
  'use cache';
  cacheLife('minutes');
  const team = await getTeamBySlug(db, teamSlug);
  if (!team) return null;

  const [
    fixtures,
    squad,
    tournamentSquad,
    allStandings,
    teamSeasonStats,
    competitionTeams,
    formResults,
    primaryComp,
    keyPlayers,
    tournamentScorers,
  ] = await Promise.all([
    getTeamFixturesWithCompetition(db, team.id, 200),
    getTeamSquad(db, team.id),
    getTeamTournamentSquad(db, team.id),
    getTeamAllStandings(db, team.id),
    getTeamSeasonStats(db, team.id),
    getTeamsInSameCompetition(db, team.id),
    getTeamFormResults(db, team.id),
    getTeamPrimaryCompetition(db, team.id),
    getTeamKeyPlayers(db, team.id),
    getTeamTournamentScorers(db, team.id),
  ]);

  return {
    team,
    fixtures,
    squad,
    tournamentSquad,
    allStandings,
    teamSeasonStats,
    competitionTeams,
    formResults,
    primaryComp,
    keyPlayers,
    tournamentScorers,
  };
}

// ── Metadata ──

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';
  const data = await getCachedTeamData(teamSlug);
  const team = data?.team;

  if (!team) {
    return { title: 'Team | DimaScore' };
  }

  const name = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;
  const tTeam = await getTranslations({ locale, namespace: 'teamPage' });
  const sections = tTeam('seoSections');
  const title = `${name} — ${sections} | DimaScore`;
  const description = `${name} — ${sections}.`;
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
  setRequestLocale(locale);
  const typedLocale = locale as Locale;
  const teamSlug = rawSlug.map(decodeURIComponent).pop() ?? '';

  const [data, tBc] = await Promise.all([
    getCachedTeamData(teamSlug),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ]);
  if (!data) notFound();
  const {
    team,
    fixtures,
    squad,
    tournamentSquad,
    allStandings,
    teamSeasonStats,
    competitionTeams,
    formResults,
    primaryComp,
    keyPlayers,
    tournamentScorers,
  } = data;
  const teamName = team.name[typedLocale] ?? team.name['en'] ?? teamSlug;

  // Featured match priority: live > next upcoming > most recent completed
  const liveMatch = fixtures.find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const nextUpcoming = fixtures.find(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'upcoming',
  );
  const mostRecentCompleted = [...fixtures]
    .reverse()
    .find((f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished');
  const upcomingFixture = liveMatch ?? nextUpcoming ?? mostRecentCompleted ?? null;

  // Second featured card: the fixture following the first upcoming/live one.
  const upcomingSeq = fixtures.filter((f) => {
    const s = getMatchState(f.statusCode, f.kickoffAt);
    return s === 'live' || s === 'upcoming';
  });
  const secondFixture = upcomingSeq[1] ?? null;

  // Competition name for left rail team tiles
  const compTeamsName = competitionTeams.competitionName
    ? (competitionTeams.competitionName[typedLocale] ??
      competitionTeams.competitionName['en'] ??
      '')
    : '';

  // Breadcrumbs: Football > [Country >] Competition > Team
  // primaryComp is League-only (null for national teams). When absent, fall back
  // to the team's default standings competition (e.g. World Cup 2026) as a
  // text-only crumb — the snapshot carries no slug/country to build a link.
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
  } else if (allStandings.competitions[0]) {
    const fallbackComp = allStandings.competitions[0];
    const fallbackName = fallbackComp.name[typedLocale] ?? fallbackComp.name['en'];
    if (fallbackName) {
      breadcrumbs.push({ label: fallbackName });
    }
  }
  breadcrumbs.push({ label: teamName });

  // Center tabs — Standings, Statistics, Players (per schematic)
  const hashes = TAB_HASHES[typedLocale];
  const tabs = [
    {
      key: 'matches',
      hash: hashes.matches,
      labelKey: 'matches',
      content: (
        <div className="space-y-4">
          <TeamMatchesList fixtures={fixtures} locale={typedLocale} teamId={team.id} />
          <TeamGroupStandingsCard
            team={team}
            fixtures={fixtures}
            allStandings={allStandings}
            locale={typedLocale}
            standingsHref={`#${hashes.standings}`}
          />
        </div>
      ),
    },
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
      key: 'squad',
      hash: hashes.squad,
      labelKey: 'squad',
      content: tournamentSquad ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-2.5">
            <h3 className="label-caps">
              {tournamentSquad.competitionName[typedLocale] ??
                tournamentSquad.competitionName['en'] ??
                ''}{' '}
              {tournamentSquad.seasonYear}
            </h3>
          </div>
          <TeamSquadTable players={tournamentSquad.players} locale={typedLocale} />
        </div>
      ) : (
        <TeamSquadTable players={squad} locale={typedLocale} />
      ),
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-2">
        <SeoBreadcrumb segments={breadcrumbs} compact />
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
        center={
          <>
            {/* Mobile-only Next/Last band above the tabs (desktop shows it in rightRailTop) */}
            {upcomingFixture && (
              <div className="mb-4 xl:hidden">
                <FeaturedMatchCard fixture={upcomingFixture} locale={typedLocale} />
              </div>
            )}
            <CenterTabs tabs={tabs} />
          </>
        }
        rightRail={
          <div className="space-y-4">
            {secondFixture && <FeaturedMatchCard fixture={secondFixture} locale={typedLocale} />}
            <KeyPlayersCard players={keyPlayers} locale={typedLocale} />
            <TournamentScorersCard data={tournamentScorers} locale={typedLocale} />
          </div>
        }
        belowCenter={<TeamMediaSection teamId={team.id} locale={typedLocale} />}
      />
    </>
  );
}
