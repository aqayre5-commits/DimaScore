import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { db } from '@/lib/db/client';
import {
  getMatchDetail,
  getMatchCoverage,
  getMatchEvents,
  getMatchLineups,
  getMatchStatistics,
  getMatchPlayerStats,
  getHeadToHead,
  getNextFixtures,
} from '@/lib/db/queries/match-detail';
import { getMatchState } from '@/lib/match-status';
import { qk } from '@/lib/query-keys';
import { previewFromMatchDetail } from '@/lib/match-header-preview';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import { MatchLiveUpdater } from '@/components/match/MatchLiveUpdater';
import { MatchClientCenter } from '@/components/match/MatchClientCenter';
import { PreMatchForm } from '@/components/match/PreMatchForm';
import { PredictedLineup } from '@/components/match/PredictedLineup';
import { getTeamForm, type FormResult } from '@/lib/db/queries/homepage';
import { getCachedPredictedXI } from '@/lib/db/queries/predicted-lineup';
import { MatchClientLeftRail, MatchClientRightRail } from '@/components/match/MatchClientSidebar';

import { cacheLife } from 'next/cache';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);

/** Tidy API-Football round strings: "Regular Season - 38" → "Matchday 38", "8th Finals" → "Round of 16". */
function prettyRound(round: string, tBc: Awaited<ReturnType<typeof getTranslations>>): string {
  const md = round.match(/^(?:Regular Season|Group Stage)\s*-\s*(\d+)$/i);
  if (md) return tBc('matchday', { number: md[1] });
  if (/^8th\s+finals?$/i.test(round)) return tBc('roundOf16');
  return round;
}

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseFixtureId(raw: string): number | null {
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

async function getCachedMatchData(fixtureId: number) {
  'use cache';
  cacheLife('match');
  const match = await getMatchDetail(db, fixtureId);
  if (!match) return null;
  const coverage = await getMatchCoverage(db, match.competition.id, match.seasonYear);

  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;
  const hasTeams = homeTeamId > 0 && awayTeamId > 0;
  // new Date() is allowed here — TTL-bounded by 'use cache'.
  const isUpcoming = getMatchState(match.statusCode, match.kickoffAt) === 'upcoming';
  const hasStats =
    !isUpcoming &&
    ((coverage?.statisticsFixtures ?? false) || (coverage?.statisticsPlayers ?? false));

  // Server-prefetch the tab data so the client useQuery hydrates with it (no
  // client-fetch "content dump"). Gated identically to the client `enabled`.
  const [events, lineups, teamStats, playerStats, h2h, nextFixtures, formMap] = await Promise.all([
    !isUpcoming && coverage?.events ? getMatchEvents(db, fixtureId) : null,
    !isUpcoming && coverage?.lineups ? getMatchLineups(db, fixtureId) : null,
    hasStats ? getMatchStatistics(db, fixtureId) : null,
    hasStats ? getMatchPlayerStats(db, fixtureId) : null,
    hasTeams ? getHeadToHead(db, homeTeamId, awayTeamId, fixtureId) : [],
    hasTeams ? getNextFixtures(db, homeTeamId, awayTeamId, fixtureId) : [],
    hasTeams ? getTeamForm(db, [homeTeamId, awayTeamId]) : new Map<number, FormResult[]>(),
  ]);
  const homeForm = formMap.get(homeTeamId) ?? [];
  const awayForm = formMap.get(awayTeamId) ?? [];

  return {
    match,
    coverage,
    prefetch: {
      events,
      lineups,
      teamStats,
      playerStats,
      hasStats,
      h2h,
      nextFixtures,
      homeForm,
      awayForm,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  if (!fixtureId) return { title: 'Match | DimaScore' };

  const data = await getCachedMatchData(fixtureId);
  if (!data) return { title: 'Match | DimaScore' };
  const { match } = data;

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const title = `${home} vs ${away} | ${compName} | DimaScore`;
  const roundLabel = match.groupLabel ?? match.round;
  const description = `${home} vs ${away} — ${compName}${roundLabel ? `, ${roundLabel}` : ''}`;
  const canonical = `${BASE_URL}/${locale}/match/${fixtureId}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/match/${fixtureId}`])),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'DimaScore',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_MA' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { locale, id: rawId } = await params;
  setRequestLocale(locale);
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  if (!fixtureId) notFound();

  const [data, tBc] = await Promise.all([
    getCachedMatchData(fixtureId),
    getTranslations({ locale, namespace: 'breadcrumb' }),
  ]);
  if (!data) notFound();
  const { match, coverage, prefetch } = data;

  const typedLocale = locale as Locale;

  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;
  const matchState = getMatchState(match.statusCode, match.kickoffAt);
  const isUpcoming = matchState === 'upcoming';
  const isLive = LIVE_CODES.has(match.statusCode);

  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    typedLocale,
  );
  const home = getTeamDisplayName(match.homeTeam, typedLocale);
  const away = getTeamDisplayName(match.awayTeam, typedLocale);

  const predicted =
    isUpcoming && homeTeamId > 0 && awayTeamId > 0
      ? await getCachedPredictedXI(homeTeamId, awayTeamId, typedLocale)
      : null;

  const competitionEntry = findEntryByCompetitionId(match.competition.id);
  const competitionHref = competitionEntry
    ? buildCompetitionHref(competitionEntry, typedLocale)
    : null;

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: compName, href: competitionHref ?? undefined },
    ...((match.groupLabel ?? match.round)
      ? [{ label: match.groupLabel ?? prettyRound(match.round!, tBc) }]
      : []),
    { label: `${home} vs ${away}, ${tBc('sectionsMatch')}` },
  ];

  const matchId = String(fixtureId);

  // Seed a server QueryClient with the prefetched tab data under the same keys
  // the client components useQuery, then dehydrate into the page — so they
  // hydrate with data already present (no client-fetch "content dump").
  const queryClient = new QueryClient();
  // Seed the preview header so back/forward soft-nav to this match stays warm.
  queryClient.setQueryData(qk.matchHeader(matchId), previewFromMatchDetail(match));
  if (prefetch.events) queryClient.setQueryData(qk.matchEvents(matchId), prefetch.events);
  if (prefetch.lineups) queryClient.setQueryData(qk.matchLineups(matchId), prefetch.lineups);
  if (prefetch.hasStats) {
    queryClient.setQueryData(qk.matchStats(matchId), {
      teamStats: prefetch.teamStats ?? [],
      playerStats: prefetch.playerStats ?? [],
    });
  }
  queryClient.setQueryData([...qk.match(matchId), 'sidebar'], {
    h2h: prefetch.h2h.map((f) => ({ ...f, kickoffAt: f.kickoffAt.toISOString() })),
    nextFixtures: prefetch.nextFixtures.map((f) => ({
      ...f,
      kickoffAt: f.kickoffAt.toISOString(),
    })),
  });

  // Serialize match for client components (Date → ISO string)
  const serializedMatch = {
    ...match,
    kickoffAt: match.kickoffAt.toISOString(),
  };

  // Rendered twice: in the right rail (desktop) and, via belowCenter, as an
  // xl:hidden block so mobile (where the rail is hidden) still gets match info + H2H.
  const matchSidebar = (
    <MatchClientRightRail
      matchId={matchId}
      locale={typedLocale}
      match={serializedMatch}
      competitionHref={competitionHref}
      homeTeamId={homeTeamId}
      awayTeamId={awayTeamId}
      homeName={home}
      awayName={away}
    />
  );

  const pageContent = (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">
        <SeoBreadcrumb segments={breadcrumbs} compact />
      </div>

      <InnerPageShell
        leftRail={
          <MatchClientLeftRail
            matchId={matchId}
            locale={typedLocale}
            match={serializedMatch}
            coverage={coverage}
            homeTeamId={homeTeamId}
            awayTeamId={awayTeamId}
            isUpcoming={isUpcoming}
          />
        }
        center={
          <div className="space-y-4">
            <ScoreHeader match={match} locale={typedLocale} competitionHref={competitionHref} />
            {isUpcoming && (
              <PreMatchForm
                locale={typedLocale}
                homeName={home}
                awayName={away}
                homeForm={prefetch.homeForm}
                awayForm={prefetch.awayForm}
              />
            )}
            {isUpcoming && predicted && (
              <PredictedLineup
                locale={typedLocale}
                homeName={home}
                awayName={away}
                homeLineup={predicted.home}
                awayLineup={predicted.away}
              />
            )}
            <MatchClientCenter
              matchId={matchId}
              locale={typedLocale}
              coverage={coverage}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeName={home}
              awayName={away}
              isUpcoming={isUpcoming}
            />
          </div>
        }
        rightRail={matchSidebar}
        belowCenter={<div className="xl:hidden">{matchSidebar}</div>}
      />
    </>
  );

  const body = isLive ? (
    <MatchLiveUpdater
      fixtureId={match.id}
      initialStatus={match.statusCode}
      initialHomeScore={match.homeScore}
      initialAwayScore={match.awayScore}
      initialMinute={match.minute}
      initialExtraMinute={match.extraMinute}
    >
      {pageContent}
    </MatchLiveUpdater>
  ) : (
    pageContent
  );

  return <HydrationBoundary state={dehydrate(queryClient)}>{body}</HydrationBoundary>;
}
