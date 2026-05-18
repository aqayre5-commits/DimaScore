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
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { ScoreHeader } from '@/components/match/ScoreHeader';
import { EventTimeline } from '@/components/match/EventTimeline';
import { LineupPitch } from '@/components/match/LineupPitch';
import { StatsBars } from '@/components/match/StatsBars';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingBadge';
import { H2HPanel } from '@/components/match/H2HPanel';
import { PredictionCard } from '@/components/match/PredictionCard';
import { MatchMediaSection } from '@/components/match/MatchMediaSection';
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

  const breadcrumbs: BreadcrumbSegment[] = [{ label: compName }, { label: `${home} vs ${away}` }];

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

  // Tab definitions — gated by coverage
  const tabs = [
    { key: 'summary', label: t('summary'), always: true },
    { key: 'events', label: t('events'), always: false, visible: hasEvents },
    { key: 'lineups', label: t('lineups'), always: false, visible: hasLineups },
    { key: 'stats', label: t('stats'), always: false, visible: hasStats },
    { key: 'playerRatings', label: t('playerRatings'), always: false, visible: hasRatings },
    { key: 'h2h', label: t('h2h'), always: true },
    { key: 'prediction', label: t('prediction'), always: false, visible: coverage?.predictions },
    { key: 'media', label: t('media'), always: true },
  ].filter((tab) => tab.always || tab.visible);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-4">
      <SeoBreadcrumb segments={breadcrumbs} />

      <section id="summary" className="mt-4 scroll-mt-16">
        <ScoreHeader match={match} locale={typedLocale} />
      </section>

      {/* Tab bar — anchor links scroll to matching section ids */}
      <nav
        className="sticky top-0 z-10 mt-4 flex gap-1 overflow-x-auto border-b border-border-subtle bg-bg-base"
        aria-label="Match tabs"
      >
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={`#${tab.key}`}
            className="shrink-0 border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-accent-gold hover:text-text-primary"
          >
            {tab.label}
          </a>
        ))}
      </nav>

      {/* Sections */}
      <div className="mt-4 space-y-6">
        {/* Events */}
        {hasEvents && (
          <section id="events" className="scroll-mt-16">
            <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('events')}</h3>
            <EventTimeline events={events} homeTeamId={homeTeamId} locale={typedLocale} />
          </section>
        )}

        {/* Lineups */}
        {hasLineups && homeLineup && awayLineup && (
          <section id="lineups" className="scroll-mt-16">
            <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('lineups')}</h3>
            <LineupPitch
              homeLineup={homeLineup}
              awayLineup={awayLineup}
              homeTeamName={home}
              awayTeamName={away}
              locale={typedLocale}
            />
          </section>
        )}

        {/* Statistics */}
        {hasStats && homeStats && awayStats && (
          <section id="stats" className="scroll-mt-16">
            <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('stats')}</h3>
            <StatsBars
              homeStats={homeStats}
              awayStats={awayStats}
              homeTeamName={home}
              awayTeamName={away}
            />
          </section>
        )}

        {/* Player Ratings */}
        {hasRatings && (
          <section id="playerRatings" className="scroll-mt-16">
            <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('playerRatings')}</h3>
            <PlayerRatingsPanel
              playerStats={playerStats}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeTeamName={home}
              awayTeamName={away}
              locale={typedLocale}
            />
          </section>
        )}

        {/* H2H */}
        <section id="h2h" className="scroll-mt-16">
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('h2h')}</h3>
          <H2HPanel
            fixtures={h2hFixtures}
            homeTeamId={homeTeamId}
            homeTeamName={home}
            awayTeamName={away}
            locale={typedLocale}
          />
        </section>

        {/* Prediction placeholder */}
        {coverage?.predictions && (
          <section id="prediction" className="scroll-mt-16">
            <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('prediction')}</h3>
            <PredictionCard />
          </section>
        )}

        {/* Media */}
        <section id="media" className="scroll-mt-16">
          <h3 className="mb-2 text-sm font-medium text-text-secondary">{t('media')}</h3>
          <MatchMediaSection videos={matchVideos} />
        </section>
      </div>
    </div>
  );
}
