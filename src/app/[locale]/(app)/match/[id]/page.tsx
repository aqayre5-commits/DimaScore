import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import {
  getMatchDetail,
  getMatchCoverage,
  getMatchEvents,
  getMatchLineups,
  getMatchStatistics,
  getMatchPlayerStats,
} from '@/lib/db/queries/match-detail';
import {
  getCompetitionResults,
  getUpcomingCompetitionFixtures,
} from '@/lib/db/queries/match-centre';
import { getStandings } from '@/lib/db/queries';
import { getMatchState, LIVE_CODES_ARRAY } from '@/lib/match-status';
import { buildMatchMeta, buildMatchH1 } from '@/lib/seo/match-metadata';
import { isMatchIndexable } from '@/lib/seo/indexable';
import { qk } from '@/lib/query-keys';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { flagImageSrc } from '@/components/shared/Flag';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildGraph, buildWebPage, buildSportsEventMatch } from '@/lib/seo/jsonld';
import { parseTrailingId } from '@/lib/seo/entity-slug';
import { buildMatchSlug } from '@/lib/seo/match-slug';
import { matchOgImageAlt, matchOgImageUrl } from '@/lib/og/og-urls';
import { OG_SIZE } from '@/lib/og/og-size';
import { sameAsForTeam, sameAsForCompetition } from '@/lib/constants/entity-links';
import { formatLongMatchDate, formatShortMatchDate } from '@/lib/match/key-facts';
import { matchweekNumber } from '@/lib/match/match-view';
import type { Phase, TableBase } from '@/lib/match/match-centre';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { MatchLiveUpdater } from '@/components/match/MatchLiveUpdater';
import { MatchCentre } from '@/components/match/centre/MatchCentre';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import type { McMatch, McTable, McTeam, McUpcoming } from '@/components/match/centre/types';
import '@/components/match/centre/match-centre.css';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { BASE_URL } from '@/lib/constants/site';

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
const TZ = 'Africa/Casablanca';

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

/** Calendar day in Morocco ("2026-11-24"), for the Today / Tomorrow card labels. */
const dayKey = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);

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
  const now = new Date();
  const state = getMatchState(match.statusCode, match.kickoffAt, now);
  const started = state !== 'upcoming';

  // Server-prefetch the tab data so the client queries hydrate with it (every panel is in the
  // HTML). Line-ups are read before kick-off too: the template shows confirmed line-ups pre-match.
  const [events, lineups, teamStats, playerStats, standings, upcoming, results] = await Promise.all(
    [
      started ? getMatchEvents(db, fixtureId) : null,
      getMatchLineups(db, fixtureId),
      started ? getMatchStatistics(db, fixtureId) : null,
      started ? getMatchPlayerStats(db, fixtureId) : null,
      hasTeams ? getStandings(db, match.competition.id, match.seasonYear) : [],
      getUpcomingCompetitionFixtures(db, match.competition.id, fixtureId),
      hasTeams ? getCompetitionResults(db, match.competition.id, match.seasonYear) : [],
    ],
  );

  // Table tab: the group (or league table) holding this match's teams; none for knockout ties.
  const group = standings.find(
    (s) => s.teamId === homeTeamId || s.teamId === awayTeamId,
  )?.groupLabel;
  const groupRows =
    group != null
      ? standings
          .filter((s) => s.groupLabel === group && s.teamId != null)
          .sort((a, b) => a.rank - b.rank)
      : [];
  const groupIds = new Set(groupRows.map((s) => s.teamId as number));
  const inGroup = (r: { homeTeamId: number; awayTeamId: number }) =>
    groupIds.has(r.homeTeamId) && groupIds.has(r.awayTeamId);

  return {
    match,
    coverage,
    state,
    today: dayKey(now),
    tomorrow: dayKey(new Date(now.getTime() + 86_400_000)),
    upcoming,
    table:
      groupRows.length > 0
        ? {
            rows: groupRows,
            results: results.filter((r) => !r.live && inGroup(r)),
            live: results.filter((r) => r.live && inGroup(r)),
          }
        : null,
    prefetch: { events, lineups, teamStats, playerStats },
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
  const matchState = data.state;
  const isLive = LIVE_CODES.has(match.statusCode);
  const bcp = typedLocale === 'ar' ? 'ar-MA' : typedLocale === 'en' ? 'en-GB' : 'fr-MA';

  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    typedLocale,
  );
  const home = getTeamDisplayName(match.homeTeam, typedLocale);
  const away = getTeamDisplayName(match.awayTeam, typedLocale);
  const competitionEntry = findEntryByCompetitionId(match.competition.id);
  const competitionHref = competitionEntry
    ? buildCompetitionHref(competitionEntry, typedLocale)
    : null;
  const teamHref = (slug: string | null | undefined) =>
    slug ? `/${typedLocale}/equipe/${slug}` : null;

  const matchId = String(fixtureId);
  // Seed a server QueryClient with the prefetched tab data under the same keys the client
  // components query, then dehydrate into the page (no client-fetch "content dump").
  const queryClient = new QueryClient();
  if (prefetch.events) queryClient.setQueryData(qk.matchEvents(matchId), prefetch.events);
  queryClient.setQueryData(qk.matchLineups(matchId), prefetch.lineups);
  if (prefetch.teamStats) {
    queryClient.setQueryData(qk.matchStats(matchId), {
      teamStats: prefetch.teamStats,
      playerStats: prefetch.playerStats ?? [],
    });
  }

  const t = await getTranslations({ locale: typedLocale, namespace: 'matchCentre' });

  const mw = matchweekNumber(match.round);
  const roundLabel =
    mw != null
      ? t('board.matchweek', { n: mw.toLocaleString(bcp) })
      : match.groupLabel || match.round
        ? localizeRound(match.groupLabel ?? match.round, typedLocale)
        : null;

  const fmt = (d: Date, o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(bcp, { timeZone: TZ, ...o }).format(d);
  const timeOf = (d: Date) => fmt(d, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const tzName =
    new Intl.DateTimeFormat('en-GB', { timeZone: TZ, timeZoneName: 'short' })
      .formatToParts(match.kickoffAt)
      .find((x) => x.type === 'timeZoneName')?.value ?? '';
  const dateText = `${fmt(match.kickoffAt, { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeOf(match.kickoffAt)} ${tzName}`;

  const phase: Phase =
    match.statusCode === 'HT'
      ? 'halftime'
      : matchState === 'live'
        ? 'live'
        : matchState === 'finished'
          ? 'finished'
          : matchState === 'interrupted'
            ? 'interrupted'
            : 'upcoming';

  const matchH1 = buildMatchH1({
    home,
    away,
    competition: compName,
    locale: typedLocale,
    state: matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  });

  const team = (tm: typeof match.homeTeam, id: number, name: string): McTeam => ({
    id,
    name,
    href: teamHref(tm?.slug),
    logo: tm ? flagImageSrc({ ...tm, logoStatus: tm.logoStatus }) : null,
    logoStatus: tm?.logoStatus ?? null,
    code: tm?.code ?? null,
    primary: tm?.primaryColor ?? null,
    secondary: tm?.secondaryColor ?? null,
  });
  const view: McMatch = {
    id: fixtureId,
    locale: typedLocale,
    bcp,
    h1: matchH1,
    coverage,
    phase,
    statusCode: match.statusCode,
    minute: match.minute,
    extraMinute: match.extraMinute,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeScoreHt: match.homeScoreHt,
    awayScoreHt: match.awayScoreHt,
    homeScorePen: match.homeScorePen,
    awayScorePen: match.awayScorePen,
    kickoffIso: match.kickoffAt.toISOString(),
    dateText,
    timeText: timeOf(match.kickoffAt),
    venue: match.venue?.name ?? null,
    competition: {
      id: match.competition.id,
      name: compName,
      href: competitionHref,
      logo: resolveCompetitionLogo(
        match.competition.id,
        match.competition.logoUrl,
        match.competition.logoStatus,
      ),
    },
    roundLabel,
    home: team(match.homeTeam, homeTeamId, home),
    away: team(match.awayTeam, awayTeamId, away),
  };

  const upcoming: McUpcoming[] = data.upcoming.map((f) => {
    const at = new Date(f.kickoffAt);
    const day = dayKey(at);
    return {
      id: f.id,
      href: `/${typedLocale}/match/${buildMatchSlug(f.home?.slug, f.away?.slug, f.id)}`,
      dayLabel:
        day === data.today
          ? t('upcoming.today')
          : day === data.tomorrow
            ? t('upcoming.tomorrow')
            : fmt(at, { weekday: 'short', day: 'numeric', month: 'short' }),
      iso: f.kickoffAt,
      time: timeOf(at),
      home: {
        name: getTeamDisplayName(f.home, typedLocale),
        logo: f.home ? flagImageSrc(f.home) : null,
      },
      away: {
        name: getTeamDisplayName(f.away, typedLocale),
        logo: f.away ? flagImageSrc(f.away) : null,
      },
    };
  });

  const table: McTable | null = data.table
    ? {
        base: data.table.rows.map(
          (r): TableBase => ({
            teamId: r.teamId as number,
            name: getTeamDisplayName(r.team, typedLocale),
            logo: r.team ? flagImageSrc(r.team) : null,
            href: teamHref(r.team?.slug),
            rank: r.rank,
            played: r.played,
            goalDiff: r.goalDiff ?? (r.goalsFor ?? 0) - (r.goalsAgainst ?? 0),
            points: r.points,
          }),
        ),
        results: data.table.results,
        live: data.table.live,
      }
    : null;

  // ── Left rail (template) and the mobile navbar picker share one set of props ──
  const { rail, current: railCurrent } = await getRailProps(typedLocale, match.competition.id);

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
            // The image the header card shows (the flag for national teams).
            homeLogo: match.homeTeam ? flagImageSrc(match.homeTeam) : null,
            awayLogo: match.awayTeam ? flagImageSrc(match.awayTeam) : null,
            competitionName: compName,
            kickoffAt: match.kickoffAt,
            statusCode: match.statusCode,
            // The header card shows the stadium name only (no city, no summary text), so the
            // structured data carries no description or address either.
            venueName: match.venue?.name,
            homeSameAs: sameAsForTeam(match.homeTeam?.id),
            awaySameAs: sameAsForTeam(match.awayTeam?.id),
            competitionSameAs: sameAsForCompetition(match.competition.id),
          }),
          // No BreadcrumbList (no visible breadcrumb), no NewsArticle (no visible publish date)
          // and no VideoObject (no video on the page): structured data only for what is shown.
        )}
      />
      <NavCompetitionRegister current={railCurrent} rail={rail} />
      {/* Edge cache TTL input (cf/edge-cache-policy.ts): status and kick-off already loaded above. */}
      <div
        className={`mc ${mcFont.variable}`}
        data-edge-status={match.statusCode}
        data-edge-ko={Math.floor(match.kickoffAt.getTime() / 1000)}
      >
        <div className="shell">
          <aside className="rail">
            <CompetitionRail {...rail} />
          </aside>
          <div className="mc-mainarea">
            <MatchCentre match={view} upcoming={upcoming} table={table} />
          </div>
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
