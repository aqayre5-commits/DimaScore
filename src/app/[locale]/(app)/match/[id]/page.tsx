import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
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
  type MatchLineup,
} from '@/lib/db/queries/match-detail';
import { getMatchState, LIVE_CODES_ARRAY } from '@/lib/match-status';
import { buildMatchMeta, buildMatchH1 } from '@/lib/seo/match-metadata';
import { isMatchIndexable } from '@/lib/seo/indexable';
import { qk } from '@/lib/query-keys';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { flagImageSrc } from '@/components/shared/Flag';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, buildWebPage, buildSportsEventMatch } from '@/lib/seo/jsonld';
import { getStandings } from '@/lib/db/queries';
import { parseTrailingId } from '@/lib/seo/entity-slug';
import { buildMatchSlug } from '@/lib/seo/match-slug';
import { matchOgImageAlt, matchOgImageUrl } from '@/lib/og/og-urls';
import { OG_SIZE } from '@/lib/og/og-size';
import { sameAsForTeam, sameAsForCompetition } from '@/lib/constants/entity-links';
import { formatLongMatchDate, formatShortMatchDate } from '@/lib/match/key-facts';
import { MatchLiveUpdater } from '@/components/match/MatchLiveUpdater';
import { getCachedPredictedXI } from '@/lib/db/queries/predicted-lineup';
import { localizeRound } from '@/lib/i18n/feed-labels';
import {
  matchSummary,
  matchweekNumber,
  eventKind,
  eventGroup,
  pitchSpots,
  statGroups,
} from '@/lib/match/match-view';
import { matchFontFamily } from './match-font';
import { MatchHeaderCard, type HeaderStrip } from '@/components/match/page/MatchHeaderCard';
import { MatchTabs, MatchTabPanel, type MatchTab } from '@/components/match/page/MatchTabs';
import { KeyStatsCard, KeyMomentsCard } from '@/components/match/page/OverviewLive';
import { EventsCard } from '@/components/match/page/EventsCard';
import { StatsCard } from '@/components/match/page/StatsCard';
import { LineupsCard } from '@/components/match/page/LineupsCard';
import { SummaryCard, MatchDetailsCard, TableCard } from '@/components/match/page/ServerCards';
import type { MatchView, TeamView } from '@/components/match/page/types';

import { cacheLife } from 'next/cache';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseFixtureId(raw: string): number | null {
  // Accepts both the legacy bare id ("1570386") and the slug+id form
  // ("real-betis-getafe-1570386") — resolution is always by the trailing id.
  // Upper bound caps pathological inputs before they hit the DB (API-Football ids are <10M today).
  const id = parseTrailingId(raw);
  return id != null && id > 0 && id < 2_000_000_000 ? id : null;
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
  const hasStats = !isUpcoming;

  // Server-prefetch the tab data so the client useQuery hydrates with it (no
  // client-fetch "content dump"). Same gate as MatchClientCenter (`!isUpcoming`).
  const [events, lineups, teamStats, playerStats] = await Promise.all([
    !isUpcoming ? getMatchEvents(db, fixtureId) : null,
    !isUpcoming ? getMatchLineups(db, fixtureId) : null,
    hasStats ? getMatchStatistics(db, fixtureId) : null,
    hasStats ? getMatchPlayerStats(db, fixtureId) : null,
  ]);

  const fullStandings = hasTeams
    ? await getStandings(db, match.competition.id, match.seasonYear)
    : [];
  // Table tab: the group (or league table) this match's teams are in, ordered by rank. Only the
  // top five plus the match teams' rows are rendered; empty when neither team is in the table.
  const tableGroup = fullStandings.find(
    (s) => s.teamId === homeTeamId || s.teamId === awayTeamId,
  )?.groupLabel;
  const tableRows =
    tableGroup != null
      ? fullStandings
          .filter((s) => s.groupLabel === tableGroup)
          .sort((a, b) => a.rank - b.rank)
          .filter((s, i) => i < 5 || s.teamId === homeTeamId || s.teamId === awayTeamId)
      : [];

  return {
    match,
    coverage,
    prefetch: {
      events,
      lineups,
      teamStats,
      playerStats,
      hasStats,
      tableRows,
    },
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id: rawId } = await params;
  const fixtureId = parseFixtureId(decodeURIComponent(rawId));
  // Unknown match → noindex. Middleware returns the real 404 (or 503 if the DB is down) before
  // this runs; the body still notFound()s so a request that skips middleware gets the 404 UI.
  if (!fixtureId) return { title: 'Match | DimaScore', robots: { index: false, follow: false } };

  const data = await getCachedMatchData(fixtureId);
  if (!data) return { title: 'Match | DimaScore', robots: { index: false, follow: false } };
  const { match } = data;

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const matchState = getMatchState(match.statusCode, match.kickoffAt);
  const { title, description } = buildMatchMeta({
    home,
    away,
    competition: compName,
    locale,
    state: matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    dateLabel: formatShortMatchDate(match.kickoffAt, locale as Locale),
    dateLabelLong: formatLongMatchDate(match.kickoffAt, locale as Locale),
  });
  // Slug+ID canonical (Latin, identical across locales); the bare-id request 308s to this.
  const matchSlug = buildMatchSlug(match.homeTeam?.slug, match.awayTeam?.slug, fixtureId);
  const canonical = `${BASE_URL}/${locale}/match/${matchSlug}`;
  // Index policy (src/lib/seo/indexable.ts): same SQL as the sitemap. A finished match older
  // than FINISHED_MATCH_MAX_AGE_MONTHS is noindex, follow unless it is allow-listed and has data.
  const indexable = await isMatchIndexable(db, fixtureId, match.competition.id);

  return {
    title,
    description,
    robots: { index: indexable, follow: true },
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/match/${matchSlug}`])),
        'x-default': `${BASE_URL}/${defaultLocale}/match/${matchSlug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'DimaScore',
      locale: locale === 'ar' ? 'ar_MA' : locale === 'fr' ? 'fr_MA' : 'en_US',
      type: 'website',
      // Set explicitly (instead of the file convention's static alt) so the alt is in the page
      // language. Same URL as the opengraph-image route; twitter:image is filled from it.
      images: [
        {
          url: matchOgImageUrl(BASE_URL, locale, matchSlug),
          width: OG_SIZE.width,
          height: OG_SIZE.height,
          type: 'image/png',
          alt: matchOgImageAlt(home, away, locale),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
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

  const data = await getCachedMatchData(fixtureId);
  if (!data) notFound();
  const { match, coverage, prefetch } = data;

  const typedLocale = locale as Locale;

  // Canonical slug+ID URL; 301 the legacy bare-id (or any stale name-part) to it. Resolution was
  // by the trailing ID, so the page still renders the right match regardless of the name-part.
  const matchSlug = buildMatchSlug(match.homeTeam?.slug, match.awayTeam?.slug, fixtureId);
  if (decodeURIComponent(rawId) !== matchSlug) {
    permanentRedirect(`/${locale}/match/${matchSlug}`);
  }

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

  const matchId = String(fixtureId);

  // Seed a server QueryClient with the prefetched tab data under the same keys
  // the client components useQuery, then dehydrate into the page — so they
  // hydrate with data already present (no client-fetch "content dump").
  const queryClient = new QueryClient();
  if (prefetch.events) queryClient.setQueryData(qk.matchEvents(matchId), prefetch.events);
  if (prefetch.lineups) queryClient.setQueryData(qk.matchLineups(matchId), prefetch.lineups);
  if (prefetch.hasStats) {
    queryClient.setQueryData(qk.matchStats(matchId), {
      teamStats: prefetch.teamStats ?? [],
      playerStats: prefetch.playerStats ?? [],
    });
  }
  const bcp = typedLocale === 'ar' ? 'ar-MA' : typedLocale === 'en' ? 'en-GB' : 'fr-MA';
  // ── Match page view model (serializable; the client cards read live data on top of it) ──
  const teamView = (team: typeof match.homeTeam, id: number, name: string): TeamView => ({
    id,
    name,
    href: team?.slug ? `/${typedLocale}/equipe/${team.slug}` : null,
    logoUrl: team?.logoUrl ?? null,
    countryCode: team?.countryCode ?? null,
    isNational: team?.isNational ?? null,
  });
  const view: MatchView = {
    matchId,
    locale: typedLocale,
    coverage,
    isUpcoming,
    statusCode: match.statusCode,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeScoreHt: match.homeScoreHt,
    awayScoreHt: match.awayScoreHt,
    homeScorePen: match.homeScorePen,
    awayScorePen: match.awayScorePen,
    minute: match.minute,
    extraMinute: match.extraMinute,
    kickoffAt: match.kickoffAt.toISOString(),
    home: teamView(match.homeTeam, homeTeamId, home),
    away: teamView(match.awayTeam, awayTeamId, away),
  };
  const tMp = await getTranslations({ locale: typedLocale, namespace: 'matchPage' });
  const mw = matchweekNumber(match.round);
  const roundLabel =
    mw != null
      ? tMp('matchweekN', { n: mw })
      : match.groupLabel || match.round
        ? localizeRound(match.groupLabel ?? match.round, typedLocale)
        : null;
  const longDate = new Intl.DateTimeFormat(bcp, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Casablanca',
  }).format(match.kickoffAt);
  const strip: HeaderStrip = {
    competitionName: compName,
    // The h1 is the header's team row: its text equals matchH1 (score only once finished, as
    // in the <title>; the live score / kick-off time is shown beside it, outside the h1).
    h1Score:
      matchState === 'finished' && match.homeScore != null && match.awayScore != null
        ? `${match.homeScore}–${match.awayScore}`
        : null,
    vsWord: typedLocale === 'en' ? 'vs' : typedLocale === 'ar' ? 'ضد' : '–',
  };

  const summaryState =
    match.statusCode === 'HT'
      ? 'halfTime'
      : matchState === 'finished'
        ? 'finished'
        : matchState === 'live'
          ? 'live'
          : 'upcoming';
  const homeStatsRow = prefetch.teamStats?.find((x) => x.teamId === homeTeamId);
  const awayStatsRow = prefetch.teamStats?.find((x) => x.teamId === awayTeamId);
  // The mockup's summary sentence (shot counts); the card is hidden when there is none. It is
  // also the SportsEvent description, so the structured data only states what the page shows.
  const summaryText = matchSummary({
    state: summaryState,
    locale: typedLocale,
    home,
    away,
    stats:
      homeStatsRow && awayStatsRow ? { home: homeStatsRow.stats, away: awayStatsRow.stats } : null,
  });
  const summaryTitle = tMp(
    summaryState === 'halfTime'
      ? 'summaryHalfTime'
      : summaryState === 'finished'
        ? 'summaryFullTime'
        : summaryState === 'live'
          ? 'summaryLive'
          : 'summaryPreview',
  );

  const detailRows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: tMp('competition'),
      value: competitionHref ? (
        <a href={competitionHref} className="hover:underline">
          {compName}
        </a>
      ) : (
        compName
      ),
    },
    ...(roundLabel
      ? [
          {
            label: mw != null ? tMp('matchweek') : tMp('round'),
            value: mw != null ? String(mw) : roundLabel,
          },
        ]
      : []),
    { label: tMp('date'), value: longDate },
    ...(match.venue?.name ? [{ label: tMp('venue'), value: match.venue.name }] : []),
  ];

  // Tabs: only when the server already has something to show in them (the mockups have no
  // empty states). Events = goals, cards and substitutions; Stats = the mockup's rows only.
  const hasEvents = (prefetch.events ?? []).some((e) => eventGroup(eventKind(e)) != null);
  const hasStatsData = !!(
    homeStatsRow &&
    awayStatsRow &&
    statGroups(homeStatsRow, awayStatsRow).length > 0
  );
  // Line-ups: a pitch per team (confirmed, else predicted before kick-off), as in the mockup.
  const onPitch = (l: MatchLineup | null | undefined) =>
    !!l && pitchSpots(l.starters, l.formation).length > 0;
  const confirmedHome = prefetch.lineups?.find((l) => l.teamId === homeTeamId);
  const confirmedAway = prefetch.lineups?.find((l) => l.teamId === awayTeamId);
  const hasLineups =
    confirmedHome && confirmedAway
      ? onPitch(confirmedHome) && onPitch(confirmedAway)
      : onPitch(predicted?.home) && onPitch(predicted?.away);
  const tabs: MatchTab[] = [
    { id: 'overview', label: tMp('overview') },
    ...(hasEvents ? [{ id: 'events', label: tMp('events') }] : []),
    ...(hasStatsData ? [{ id: 'stats', label: tMp('stats') }] : []),
    ...(hasLineups ? [{ id: 'lineups', label: tMp('lineups') }] : []),
    ...(prefetch.tableRows.length > 0 ? [{ id: 'table', label: tMp('table') }] : []),
  ];
  const tabIds = new Set(tabs.map((x) => x.id));

  const matchH1 = buildMatchH1({
    home,
    away,
    competition: compName,
    locale: typedLocale,
    state: matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  });

  const pageContent = (
    <>
      <JsonLd
        graph={buildGraph(
          buildWebPage({
            url: `${BASE_URL}/${typedLocale}/match/${matchSlug}`,
            name: `${home} - ${away} — ${compName}`,
            locale: typedLocale,
            baseUrl: BASE_URL,
            hasBreadcrumb: false,
          }),
          buildSportsEventMatch({
            url: `${BASE_URL}/${typedLocale}/match/${matchSlug}`,
            name: matchH1,
            locale: typedLocale,
            description: summaryText,
            homeName: home,
            awayName: away,
            homeUrl: match.homeTeam?.slug
              ? `${BASE_URL}/${typedLocale}/equipe/${match.homeTeam.slug}`
              : null,
            awayUrl: match.awayTeam?.slug
              ? `${BASE_URL}/${typedLocale}/equipe/${match.awayTeam.slug}`
              : null,
            // The 1200×630 share image (og:image) is the event image; crests stay on the teams.
            image: matchOgImageUrl(BASE_URL, typedLocale, matchSlug),
            // The image the score header shows (the flag for national teams).
            homeLogo: match.homeTeam ? flagImageSrc(match.homeTeam) : null,
            awayLogo: match.awayTeam ? flagImageSrc(match.awayTeam) : null,
            competitionName: compName,
            kickoffAt: match.kickoffAt,
            statusCode: match.statusCode,
            venueName: match.venue?.name,
            venueCity: match.venue?.city,
            homeSameAs: sameAsForTeam(match.homeTeam?.id),
            awaySameAs: sameAsForTeam(match.awayTeam?.id),
            competitionSameAs: sameAsForCompetition(match.competition.id),
          }),
          // No BreadcrumbList (no visible breadcrumb), no NewsArticle (no visible publish date)
          // and no VideoObject (no video on the page): structured data only for what is shown.
        )}
      />

      <div
        className="mx-auto w-full max-w-[1280px] px-2 pb-10 md:px-4 md:pt-5"
        style={{ fontFamily: matchFontFamily(locale === 'ar') }}
      >
        <MatchHeaderCard view={view} strip={strip} />
        <div className="md:mt-[3px]">
          <MatchTabs tabs={tabs} label={tMp('tabsLabel')}>
            <MatchTabPanel id="overview">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)] md:gap-[19px]">
                <div className="contents md:block md:space-y-[19px]">
                  {summaryText && (
                    <div className="order-1 min-w-0">
                      <SummaryCard title={summaryTitle} paragraphs={[summaryText]} />
                    </div>
                  )}
                  {!isUpcoming && (
                    <div className="order-3 min-w-0">
                      <KeyMomentsCard view={view} />
                    </div>
                  )}
                </div>
                <div className="contents md:block md:space-y-[14px]">
                  {!isUpcoming && (
                    <div className="order-2 min-w-0">
                      <KeyStatsCard view={view} />
                    </div>
                  )}
                  <div className="order-4 min-w-0">
                    <MatchDetailsCard title={tMp('matchDetails')} rows={detailRows} />
                  </div>
                </div>
              </div>
            </MatchTabPanel>
            {tabIds.has('events') && (
              <MatchTabPanel id="events">
                <EventsCard view={view} />
              </MatchTabPanel>
            )}
            {tabIds.has('stats') && (
              <MatchTabPanel id="stats">
                <StatsCard view={view} />
              </MatchTabPanel>
            )}
            {tabIds.has('lineups') && (
              <MatchTabPanel id="lineups">
                <LineupsCard view={view} predicted={predicted} />
              </MatchTabPanel>
            )}
            {tabIds.has('table') && (
              <MatchTabPanel id="table">
                <TableCard
                  locale={typedLocale}
                  rows={prefetch.tableRows}
                  homeTeamId={homeTeamId}
                  awayTeamId={awayTeamId}
                  competitionName={compName}
                  competitionHref={competitionHref}
                />
              </MatchTabPanel>
            )}
          </MatchTabs>
        </div>
      </div>
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
