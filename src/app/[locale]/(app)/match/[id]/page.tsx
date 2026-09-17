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
import { getMatchState, LIVE_CODES_ARRAY } from '@/lib/match-status';
import { buildMatchMeta, buildMatchH1 } from '@/lib/seo/match-metadata';
import {
  buildRecap,
  buildPreview,
  buildH2HNarrative,
  buildMatchFaq,
  summarizeH2H,
  type NarrativeScorer,
} from '@/lib/seo/match-narrative';
import { qk } from '@/lib/query-keys';
import { previewFromMatchDetail } from '@/lib/match-header-preview';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { JsonLd } from '@/components/seo/JsonLd';
import {
  buildGraph,
  buildWebPage,
  buildSportsEventMatch,
  buildBreadcrumbList,
  buildNewsArticle,
  buildVideoObject,
} from '@/lib/seo/jsonld';
import { getMediaVideos } from '@/lib/db/queries/media';
import { getStandings } from '@/lib/db/queries';
import { sameAsForTeam, sameAsForCompetition } from '@/lib/constants/entity-links';
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

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

function parseFixtureId(raw: string): number | null {
  const id = Number(raw);
  // Upper bound caps pathological inputs (e.g. /match/999999999999999) before they hit
  // the DB. API-Football fixture ids are <10M today; 2B leaves comfortable headroom while
  // staying inside Postgres int4 range.
  return Number.isFinite(id) && Number.isInteger(id) && id > 0 && id < 2_000_000_000 ? id : null;
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
  const [events, lineups, teamStats, playerStats, h2h, nextFixtures, formMap] = await Promise.all([
    !isUpcoming ? getMatchEvents(db, fixtureId) : null,
    !isUpcoming ? getMatchLineups(db, fixtureId) : null,
    hasStats ? getMatchStatistics(db, fixtureId) : null,
    hasStats ? getMatchPlayerStats(db, fixtureId) : null,
    hasTeams ? getHeadToHead(db, homeTeamId, awayTeamId, fixtureId) : [],
    hasTeams ? getNextFixtures(db, homeTeamId, awayTeamId, fixtureId) : [],
    hasTeams ? getTeamForm(db, [homeTeamId, awayTeamId]) : new Map<number, FormResult[]>(),
  ]);
  const homeForm = formMap.get(homeTeamId) ?? [];
  const awayForm = formMap.get(awayTeamId) ?? [];

  // Highlights video for the recap VideoObject (finished/live only; null when none is linked).
  const highlightVideo = !isUpcoming
    ? ((await getMediaVideos(db, { fixtureId, category: 'highlights', limit: 1 })).videos[0] ??
      null)
    : null;

  // Top of the competition table for the right-rail "Classement" card.
  const standings = hasTeams
    ? (await getStandings(db, match.competition.id, match.seasonYear)).slice(0, 5)
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
      h2h,
      nextFixtures,
      homeForm,
      awayForm,
      highlightVideo,
      standings,
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

  const matchState = getMatchState(match.statusCode, match.kickoffAt);
  const { title, description } = buildMatchMeta({
    home,
    away,
    competition: compName,
    locale,
    state: matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming',
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  });
  const canonical = `${BASE_URL}/${locale}/match/${fixtureId}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/match/${fixtureId}`])),
        'x-default': `${BASE_URL}/${defaultLocale}/match/${fixtureId}`,
      },
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

  // Concise, entity-first trail: Football › Competition › Home vs Away. Keyword intent
  // (live score, lineups, …) lives in the <title>/<h1>, not the breadcrumb.
  const breadcrumbs: BreadcrumbSegment[] = [
    { label: tBc('football'), href: `/${locale}` },
    { label: compName, href: competitionHref ?? undefined },
    { label: `${home} vs ${away}` },
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
  // lg:hidden block so mobile/tablet (where the rail is hidden) still gets match info + H2H.
  const classementCard =
    prefetch.standings.length > 0 ? (
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
            {typedLocale === 'ar'
              ? 'الترتيب — أفضل 5'
              : typedLocale === 'en'
                ? 'Standings — top 5'
                : 'Classement — top 5'}
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {prefetch.standings.map((r) => (
            <div key={r.teamId ?? r.rank} className="flex items-center gap-2 px-4 py-2 text-sm">
              <span className="w-5 text-center text-xs font-semibold tabular-nums text-text-tertiary">
                {r.rank}
              </span>
              <span className="min-w-0 flex-1 truncate text-text-primary">
                {r.team?.name[typedLocale] ?? r.team?.name['en'] ?? '—'}
              </span>
              <span className="text-xs font-semibold tabular-nums text-text-secondary">
                {r.points}
              </span>
            </div>
          ))}
        </div>
      </div>
    ) : null;
  const matchSidebar = (
    <>
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
      {classementCard}
    </>
  );

  // ── SEO editorial layer (Task 15.11): server-rendered prose per state ──
  const narrativeState =
    matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming';
  const scorers: NarrativeScorer[] = (prefetch.events ?? []).flatMap((e) => {
    const type = e.type?.toLowerCase() ?? '';
    const detail = (e.detail ?? '').toLowerCase();
    if (type !== 'goal' || detail.includes('missed')) return [];
    return [
      {
        name: e.player?.name?.[typedLocale] ?? e.player?.name?.en ?? '—',
        minute: e.minute,
        extra: e.extraMinute,
        side: (e.teamId === match.homeTeam?.id ? 'home' : 'away') as 'home' | 'away',
        isPenalty: detail.includes('penalty'),
        isOwnGoal: detail.includes('own goal'),
      },
    ];
  });
  const h2hSummary =
    match.homeTeam?.id != null && match.awayTeam?.id != null
      ? summarizeH2H(prefetch.h2h, match.homeTeam.id, match.awayTeam.id)
      : { played: 0, homeWins: 0, draws: 0, awayWins: 0 };
  const kickoffLabel = new Intl.DateTimeFormat(
    typedLocale === 'ar' ? 'ar-MA' : typedLocale === 'en' ? 'en-GB' : 'fr-MA',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Casablanca',
    },
  ).format(match.kickoffAt);
  const bcp = typedLocale === 'ar' ? 'ar-MA' : typedLocale === 'en' ? 'en-GB' : 'fr-MA';
  const dateShort = new Intl.DateTimeFormat(bcp, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Casablanca',
  }).format(match.kickoffAt);
  const stateWord = (
    {
      finished: { fr: 'Terminé', en: 'Finished', ar: 'انتهت' },
      live: { fr: 'En direct', en: 'Live', ar: 'مباشر' },
      upcoming: { fr: 'À venir', en: 'Upcoming', ar: 'قادمة' },
    } as const
  )[narrativeState][typedLocale];
  const stateColor =
    narrativeState === 'live'
      ? 'text-accent-crimson'
      : narrativeState === 'finished'
        ? 'text-accent-green'
        : 'text-accent-azure';
  const bylineWord = ({ fr: 'publié le', en: 'published', ar: 'نُشر في' } as const)[typedLocale];
  const secLabels = (
    {
      fr: {
        recap: 'Résumé du match',
        preview: 'Avant-match',
        h2h: 'Face-à-face',
        faq: 'Questions fréquentes',
        notes: 'Notes des joueurs',
      },
      en: {
        recap: 'Match recap',
        preview: 'Preview',
        h2h: 'Head-to-head',
        faq: 'FAQ',
        notes: 'Player ratings',
      },
      ar: {
        recap: 'ملخص المباراة',
        preview: 'قبل المباراة',
        h2h: 'المواجهات المباشرة',
        faq: 'الأسئلة الشائعة',
        notes: 'تقييمات اللاعبين',
      },
    } as const
  )[typedLocale];
  const h2hNarr = buildH2HNarrative({ home, away, h2h: h2hSummary, locale: typedLocale });
  const h2hRows = (match.homeTeam?.id != null ? prefetch.h2h : [])
    .filter((f) => f.homeScore != null && f.awayScore != null)
    .slice(0, 5)
    .map((f) => {
      const homeIsThisHome = f.homeTeamId === match.homeTeam?.id;
      return {
        date: new Intl.DateTimeFormat(bcp, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(f.kickoffAt),
        hn: homeIsThisHome ? home : away,
        hs: (homeIsThisHome ? f.homeScore : f.awayScore) as number,
        as: (homeIsThisHome ? f.awayScore : f.homeScore) as number,
        an: homeIsThisHome ? away : home,
      };
    });
  const topRated = (prefetch.playerStats ?? [])
    .map((p) => ({
      name: p.playerName[typedLocale] ?? p.playerName['en'] ?? '—',
      side: (p.teamId === match.homeTeam?.id ? 'home' : 'away') as 'home' | 'away',
      rating: p.rating ? Number(p.rating) : NaN,
    }))
    .filter((p) => Number.isFinite(p.rating))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);
  const matchFaq = buildMatchFaq({
    state: narrativeState,
    home,
    away,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    scorers,
    kickoffLabel,
    locale: typedLocale,
  });
  // Recap only for genuinely-played results (FT/AET/PEN). Awarded/walkover/abandoned scores are
  // administrative — their goal events can contradict the scoreline, so they get no played recap.
  const isPlayedResult = ['FT', 'AET', 'PEN'].includes(match.statusCode);
  const recapText =
    narrativeState === 'finished' &&
    isPlayedResult &&
    typeof match.homeScore === 'number' &&
    typeof match.awayScore === 'number'
      ? buildRecap({
          home,
          away,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          scorers,
          competition: compName,
          locale: typedLocale,
        })
      : null;
  const narrativeLead = recapText ? (
    <section aria-labelledby="recap-h">
      <h2 id="recap-h" className="mb-1 text-base font-semibold text-text-primary">
        {secLabels.recap}
      </h2>
      <p className="mb-2 text-xs text-text-tertiary">{`DimaScore · ${bylineWord} ${dateShort}`}</p>
      <p className="text-sm leading-relaxed text-text-secondary">{recapText}</p>
    </section>
  ) : narrativeState === 'upcoming' ? (
    <section aria-labelledby="preview-h">
      <h2 id="preview-h" className="mb-1.5 text-base font-semibold text-text-primary">
        {secLabels.preview}
      </h2>
      <p className="text-sm leading-relaxed text-text-secondary">
        {buildPreview({
          home,
          away,
          competition: compName,
          kickoffLabel,
          venue: match.venue?.name,
          h2h: h2hSummary,
          locale: typedLocale,
        })}
      </p>
    </section>
  ) : null;
  const narrativeTail = (
    <>
      {topRated.length > 0 && (
        <section aria-labelledby="notes-h">
          <h2 id="notes-h" className="mb-1.5 text-base font-semibold text-text-primary">
            {secLabels.notes}
          </h2>
          <div className="max-w-md">
            {topRated.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-t border-border-subtle py-1.5 text-sm first:border-t-0"
              >
                <span className="text-text-secondary">
                  <span className="font-semibold text-text-primary">{p.name}</span>
                  {` · ${p.side === 'home' ? home : away}`}
                </span>
                <span className="rounded bg-accent-green/10 px-1.5 py-0.5 font-mono text-xs font-bold tabular-nums text-accent-green">
                  {p.rating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {h2hNarr && (
        <section aria-labelledby="h2h-h">
          <h2 id="h2h-h" className="mb-1.5 text-base font-semibold text-text-primary">
            {secLabels.h2h}
          </h2>
          <p className="text-sm leading-relaxed text-text-secondary">{h2hNarr}</p>
          {h2hRows.length > 0 && (
            <div className="mt-2 max-w-md">
              {h2hRows.map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between border-t border-border-subtle py-1.5 text-sm text-text-secondary first:border-t-0"
                >
                  <span>{r.date}</span>
                  <span className="font-semibold text-text-primary">
                    {r.hn} {r.hs}–{r.as} {r.an}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
      {matchFaq.length > 0 && (
        <section aria-labelledby="faq-h">
          <h2 id="faq-h" className="mb-1.5 text-base font-semibold text-text-primary">
            {secLabels.faq}
          </h2>
          <dl className="space-y-2">
            {matchFaq.map((f, i) => (
              <div key={i}>
                <dt className="text-sm font-semibold text-text-primary">{f.q}</dt>
                <dd className="text-sm text-text-secondary">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </>
  );

  const pageContent = (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-px">
        <SeoBreadcrumb segments={breadcrumbs} compact emitJsonLd={false} />
        <h1 className="mt-1 px-1 text-base font-semibold text-text-primary sm:text-lg">
          {buildMatchH1({
            home,
            away,
            competition: compName,
            locale: typedLocale,
            state:
              matchState === 'live' ? 'live' : matchState === 'finished' ? 'finished' : 'upcoming',
            homeScore: match.homeScore,
            awayScore: match.awayScore,
          })}
        </h1>
        <p className="mb-1 px-1 text-xs text-text-tertiary">
          <span className={`font-semibold uppercase tracking-wide ${stateColor}`}>{stateWord}</span>
          {` · ${compName}`}
          {match.round ? ` · ${match.round}` : ''}
          {` · ${dateShort}`}
        </p>
        <JsonLd
          graph={buildGraph(
            buildWebPage({
              url: `${BASE_URL}/${typedLocale}/match/${fixtureId}`,
              name: `${home} - ${away} — ${compName}`,
              locale: typedLocale,
              baseUrl: BASE_URL,
              hasBreadcrumb: true,
            }),
            buildSportsEventMatch({
              url: `${BASE_URL}/${typedLocale}/match/${fixtureId}`,
              homeName: home,
              awayName: away,
              homeLogo: match.homeTeam?.logoUrl,
              awayLogo: match.awayTeam?.logoUrl,
              competitionName: compName,
              kickoffAt: match.kickoffAt,
              statusCode: match.statusCode,
              venueName: match.venue?.name,
              venueCity: match.venue?.city,
              homeSameAs: sameAsForTeam(match.homeTeam?.id),
              awaySameAs: sameAsForTeam(match.awayTeam?.id),
              competitionSameAs: sameAsForCompetition(match.competition.id),
            }),
            buildBreadcrumbList(
              breadcrumbs,
              `${BASE_URL}/${typedLocale}/match/${fixtureId}`,
              BASE_URL,
            ),
            recapText
              ? buildNewsArticle({
                  url: `${BASE_URL}/${typedLocale}/match/${fixtureId}`,
                  baseUrl: BASE_URL,
                  headline: buildMatchMeta({
                    home,
                    away,
                    competition: compName,
                    locale: typedLocale,
                    state: 'finished',
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                  }).title,
                  body: recapText,
                  datePublished: match.kickoffAt.toISOString(),
                })
              : null,
            prefetch.highlightVideo
              ? buildVideoObject({
                  url: `${BASE_URL}/${typedLocale}/match/${fixtureId}`,
                  youtubeId: prefetch.highlightVideo.youtubeId,
                  name: prefetch.highlightVideo.title,
                  description: prefetch.highlightVideo.title,
                  thumbnailUrl: prefetch.highlightVideo.thumbnailUrl,
                  uploadDate: (
                    prefetch.highlightVideo.publishedAt ?? match.kickoffAt
                  ).toISOString(),
                  durationSeconds: prefetch.highlightVideo.duration,
                })
              : null,
          )}
        />
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
            <ScoreHeader
              match={match}
              locale={typedLocale}
              competitionHref={competitionHref}
              goalScorers={(prefetch.events ?? []).flatMap((e) => {
                const type = e.type?.toLowerCase() ?? '';
                const detail = (e.detail ?? '').toLowerCase();
                if (type !== 'goal' || detail.includes('missed')) return [];
                return [
                  {
                    playerName: e.player?.name?.[typedLocale] ?? e.player?.name?.en ?? '—',
                    minute: e.minute,
                    extraMinute: e.extraMinute,
                    isOwnGoal: detail.includes('own goal'),
                    isPenalty: detail.includes('penalty'),
                    teamId: e.teamId,
                  },
                ];
              })}
            />
            {narrativeLead}
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
            {narrativeTail}
          </div>
        }
        rightRail={matchSidebar}
        belowCenter={<div className="lg:hidden">{matchSidebar}</div>}
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
