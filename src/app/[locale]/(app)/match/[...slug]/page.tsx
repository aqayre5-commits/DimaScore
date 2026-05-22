import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import {
  getMatchDetail,
  getMatchCoverage,
  getMatchEvents,
  getMatchLineups,
  getMatchStatistics,
  getMatchPlayerStats,
  getHeadToHead,
} from '@/lib/db/queries/match-detail';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { CenterTabs } from '@/components/tournament/CenterTabs';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import { EventTimeline } from '@/components/match/EventTimeline';
import { LineupPitch } from '@/components/match/LineupPitch';
import { StatsBars } from '@/components/match/StatsBars';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingBadge';
import { H2HPanel } from '@/components/match/H2HPanel';
import { PredictionCard } from '@/components/match/PredictionCard';
import { MatchMediaSection } from '@/components/match/MatchMediaSection';
import { NewsletterCard } from '@/components/tournament/NewsletterCard';
import { getMediaVideos } from '@/lib/db/queries/media';
import type { Locale } from '@/lib/i18n/config';

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>;
}

function parseFixtureId(slug: string[]): number | null {
  const raw = slug[0];
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const fixtureId = parseFixtureId(slug);
  if (!fixtureId) return { title: 'Match | Atlas Kings' };

  const match = await getMatchDetail(db, fixtureId);
  if (!match) return { title: 'Match | Atlas Kings' };

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  return {
    title: `${home} vs ${away} | ${compName} | Atlas Kings`,
    description: `${home} vs ${away} — ${compName}${match.round ? `, ${match.round}` : ''}`,
  };
}

// Tab hash fragments per locale
const MATCH_TAB_HASHES: Record<string, Record<string, string>> = {
  fr: {
    summary: 'resume',
    events: 'evenements',
    lineups: 'compositions',
    stats: 'stats',
    playerRatings: 'notes',
    h2h: 'h2h',
    prediction: 'pronostic',
    media: 'media',
  },
  en: {
    summary: 'summary',
    events: 'events',
    lineups: 'lineups',
    stats: 'stats',
    playerRatings: 'ratings',
    h2h: 'h2h',
    prediction: 'prediction',
    media: 'media',
  },
  ar: {
    summary: 'ملخص',
    events: 'أحداث',
    lineups: 'التشكيلات',
    stats: 'الإحصائيات',
    playerRatings: 'التقييمات',
    h2h: 'مواجهات',
    prediction: 'التوقعات',
    media: 'وسائط',
  },
};

export default async function MatchDetailPage({ params }: PageProps) {
  const { locale, slug: rawSlug } = await params;
  const slug = rawSlug.map(decodeURIComponent);
  const fixtureId = parseFixtureId(slug);
  if (!fixtureId) notFound();

  const match = await getMatchDetail(db, fixtureId);
  if (!match) notFound();

  const typedLocale = locale as Locale;
  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;

  // Parallel data fetch
  const [
    t,
    coverage,
    events,
    lineups,
    teamStats,
    playerStats,
    h2hFixtures,
    { videos: matchVideos },
  ] = await Promise.all([
    getTranslations({ locale, namespace: 'matchDetail' }),
    getMatchCoverage(db, match.competition.id, match.seasonYear),
    getMatchEvents(db, fixtureId),
    getMatchLineups(db, fixtureId),
    getMatchStatistics(db, fixtureId),
    getMatchPlayerStats(db, fixtureId),
    homeTeamId > 0 && awayTeamId > 0
      ? getHeadToHead(db, homeTeamId, awayTeamId, fixtureId)
      : Promise.resolve([]),
    getMediaVideos(db, { fixtureId, limit: 9 }),
  ]);

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

  const breadcrumbs: BreadcrumbSegment[] = [
    { label: compName, href: competitionHref ?? undefined },
    { label: `${home} vs ${away}` },
  ];

  // Resolve which sections have data
  const hasEvents = (coverage?.events ?? false) && events.length > 0;
  const hasLineups = (coverage?.lineups ?? false) && lineups.length === 2;
  const hasStats = (coverage?.statisticsFixtures ?? false) && teamStats.length === 2;
  const hasRatings = (coverage?.statisticsPlayers ?? false) && playerStats.length > 0;

  // Lineup helpers
  const homeLineup = lineups.find((l) => l.teamId === homeTeamId);
  const awayLineup = lineups.find((l) => l.teamId === awayTeamId);
  const homeStats = teamStats.find((s) => s.teamId === homeTeamId);
  const awayStats = teamStats.find((s) => s.teamId === awayTeamId);

  const hashes = MATCH_TAB_HASHES[locale] ?? MATCH_TAB_HASHES.en;

  // Build center tabs — coverage-gated
  const centerTabs = [
    // Summary: events timeline (if available) as the main summary view
    {
      key: 'summary',
      hash: hashes.summary,
      labelKey: 'summary',
      content: hasEvents ? (
        <EventTimeline events={events} homeTeamId={homeTeamId} locale={typedLocale} />
      ) : (
        <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{t('predictionComingSoon')}</p>
        </div>
      ),
    },
    // Lineups
    ...(hasLineups && homeLineup && awayLineup
      ? [
          {
            key: 'lineups',
            hash: hashes.lineups,
            labelKey: 'lineups',
            content: (
              <LineupPitch
                homeLineup={homeLineup}
                awayLineup={awayLineup}
                homeTeamName={home}
                awayTeamName={away}
                locale={typedLocale}
              />
            ),
          },
        ]
      : []),
    // Statistics
    ...(hasStats && homeStats && awayStats
      ? [
          {
            key: 'stats',
            hash: hashes.stats,
            labelKey: 'stats',
            content: (
              <StatsBars
                homeStats={homeStats}
                awayStats={awayStats}
                homeTeamName={home}
                awayTeamName={away}
              />
            ),
          },
        ]
      : []),
    // Player Ratings
    ...(hasRatings
      ? [
          {
            key: 'playerRatings',
            hash: hashes.playerRatings,
            labelKey: 'playerRatings',
            content: (
              <PlayerRatingsPanel
                playerStats={playerStats}
                homeTeamId={homeTeamId}
                awayTeamId={awayTeamId}
                homeTeamName={home}
                awayTeamName={away}
                locale={typedLocale}
              />
            ),
          },
        ]
      : []),
    // H2H
    {
      key: 'h2h',
      hash: hashes.h2h,
      labelKey: 'h2h',
      content: (
        <H2HPanel
          fixtures={h2hFixtures}
          homeTeamId={homeTeamId}
          homeTeamName={home}
          awayTeamName={away}
          locale={typedLocale}
        />
      ),
    },
    // Media
    {
      key: 'media',
      hash: hashes.media,
      labelKey: 'media',
      content: <MatchMediaSection videos={matchVideos} />,
    },
  ];

  return (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        pageHeader={
          <ScoreHeader match={match} locale={typedLocale} competitionHref={competitionHref} />
        }
        leftRail={
          <div className="space-y-4">
            {/* Prediction */}
            {coverage?.predictions && <PredictionCard />}
            <NewsletterCard tournamentName={compName} />
          </div>
        }
        center={<CenterTabs tabs={centerTabs} />}
        rightRail={
          <div className="space-y-4">
            <H2HPanel
              fixtures={h2hFixtures}
              homeTeamId={homeTeamId}
              homeTeamName={home}
              awayTeamName={away}
              locale={typedLocale}
            />
          </div>
        }
      />
    </>
  );
}
