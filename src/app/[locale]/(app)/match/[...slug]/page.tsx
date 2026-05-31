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
  getNextFixtures,
} from '@/lib/db/queries/match-detail';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import {
  findEntryByCompetitionId,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { SeoBreadcrumb, type BreadcrumbSegment } from '@/components/chrome/SeoBreadcrumb';
import { InnerPageShell } from '@/components/layout/InnerPageShell';
import { ScoreHeader, type GoalScorer } from '@/components/match/ScoreHeader';
import { EventTimeline } from '@/components/match/EventTimeline';
import { MatchInfoCard } from '@/components/match/MatchInfoCard';
import { NextMatchCard } from '@/components/match/NextMatchCard';
import { MatchEventsCard } from '@/components/match/MatchEventsCard';
import { LineupPitch } from '@/components/match/LineupPitch';
import { StatsBars } from '@/components/match/StatsBars';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingBadge';
import { H2HPanel } from '@/components/match/H2HPanel';
import { PredictionCard } from '@/components/match/PredictionCard';
import { MatchMediaSection } from '@/components/match/MatchMediaSection';
import { MatchSectionNav } from '@/components/match/MatchSectionNav';
import { MatchLiveUpdater } from '@/components/match/MatchLiveUpdater';

import { getMediaVideos } from '@/lib/db/queries/media';
import type { Locale } from '@/lib/i18n/config';

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);

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
    tBc,
    coverage,
    events,
    lineups,
    teamStats,
    playerStats,
    h2hFixtures,
    { videos: matchVideos },
    nextFixtures,
  ] = await Promise.all([
    getTranslations({ locale, namespace: 'matchDetail' }),
    getTranslations({ locale, namespace: 'breadcrumb' }),
    getMatchCoverage(db, match.competition.id, match.seasonYear),
    getMatchEvents(db, fixtureId),
    getMatchLineups(db, fixtureId),
    getMatchStatistics(db, fixtureId),
    getMatchPlayerStats(db, fixtureId),
    homeTeamId > 0 && awayTeamId > 0
      ? getHeadToHead(db, homeTeamId, awayTeamId, fixtureId)
      : Promise.resolve([]),
    getMediaVideos(db, { fixtureId, limit: 9 }),
    homeTeamId > 0 && awayTeamId > 0
      ? getNextFixtures(db, homeTeamId, awayTeamId, fixtureId)
      : Promise.resolve([]),
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
    { label: tBc('football'), href: `/${locale}` },
    { label: compName, href: competitionHref ?? undefined },
    ...(match.round ? [{ label: match.round }] : []),
    { label: `${home} vs ${away}` },
  ];

  // Resolve which sections have data
  const hasEvents = (coverage?.events ?? false) && events.length > 0;
  const hasLineups = (coverage?.lineups ?? false) && lineups.length === 2;
  const hasStats = (coverage?.statisticsFixtures ?? false) && teamStats.length === 2;
  const hasRatings = (coverage?.statisticsPlayers ?? false) && playerStats.length > 0;

  const homeLineup = lineups.find((l) => l.teamId === homeTeamId);
  const awayLineup = lineups.find((l) => l.teamId === awayTeamId);
  const homeStatData = teamStats.find((s) => s.teamId === homeTeamId);
  const awayStatData = teamStats.find((s) => s.teamId === awayTeamId);

  // Build sticky nav sections — only include sections that have data
  const navSections: Array<{ id: string; label: string }> = [];
  if (hasLineups) navSections.push({ id: 'sec-lineups', label: t('lineups') });
  if (hasEvents) navSections.push({ id: 'sec-events', label: t('events') });
  if (hasStats) navSections.push({ id: 'sec-statistics', label: t('stats') });
  if (hasRatings) navSections.push({ id: 'sec-players', label: t('playerRatings') });

  // Extract goal scorers for ScoreHeader display
  const goalScorers: GoalScorer[] = events
    .filter((e) => {
      const type = e.type?.toLowerCase() ?? '';
      const detail = (e.detail ?? '').toLowerCase();
      return type === 'goal' && !detail.includes('missed');
    })
    .map((e) => {
      const name = e.player?.name?.[typedLocale] ?? e.player?.name?.['en'] ?? '';
      const detail = (e.detail ?? '').toLowerCase();
      return {
        playerName: name,
        minute: e.minute,
        extraMinute: e.extraMinute,
        isOwnGoal: detail.includes('own goal'),
        isPenalty: detail.includes('penalty'),
        teamId: e.teamId,
      };
    });

  const isLive = LIVE_CODES.has(match.statusCode);

  const pageContent = (
    <>
      <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
        <SeoBreadcrumb segments={breadcrumbs} />
      </div>

      <InnerPageShell
        leftRail={
          <div className="space-y-4">
            <NextMatchCard
              fixtures={nextFixtures}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeTeam={match.homeTeam}
              awayTeam={match.awayTeam}
              locale={typedLocale}
            />
            {hasEvents && (
              <MatchEventsCard events={events} homeTeamId={homeTeamId} locale={typedLocale} />
            )}
            {coverage?.predictions && <PredictionCard />}
          </div>
        }
        center={
          <div className="space-y-4">
            <ScoreHeader
              match={match}
              locale={typedLocale}
              competitionHref={competitionHref}
              goalScorers={goalScorers}
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
              {/* ── Lineups (pitch + coaches, no substitutes list) ── */}
              {hasLineups && homeLineup && awayLineup && (
                <section id="sec-lineups" className="scroll-mt-14">
                  <LineupPitch
                    homeLineup={homeLineup}
                    awayLineup={awayLineup}
                    homeTeamName={home}
                    awayTeamName={away}
                    locale={typedLocale}
                    pitchOnly
                    events={events}
                  />
                </section>
              )}

              {/* ── Sticky section nav ── */}
              {navSections.length > 0 && <MatchSectionNav sections={navSections} />}

              {/* ── Events ── */}
              {hasEvents && (
                <section id="sec-events" className="scroll-mt-14">
                  <SectionHeader label={t('events')} />
                  <EventTimeline events={events} homeTeamId={homeTeamId} locale={typedLocale} />
                </section>
              )}

              {/* ── Statistics ── */}
              {hasStats && homeStatData && awayStatData && (
                <section id="sec-statistics" className="scroll-mt-14">
                  <SectionHeader label={t('stats')} />
                  <StatsBars homeStats={homeStatData} awayStats={awayStatData} />
                </section>
              )}

              {/* ── Player Statistics ── */}
              {hasRatings && (
                <section id="sec-players" className="scroll-mt-14">
                  <SectionHeader label={t('playerRatings')} />
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

              {/* ── Media ── */}
              {matchVideos.length > 0 && (
                <section>
                  <SectionHeader label={t('media')} />
                  <MatchMediaSection videos={matchVideos} />
                </section>
              )}

              {/* Fallback if no sections at all */}
              {!hasEvents && !hasLineups && !hasStats && !hasRatings && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-text-tertiary">{t('predictionComingSoon')}</p>
                </div>
              )}
            </div>
          </div>
        }
        rightRail={
          <div className="space-y-4">
            <MatchInfoCard match={match} locale={typedLocale} competitionHref={competitionHref} />
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

  if (isLive) {
    return (
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
    );
  }

  return pageContent;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-border-subtle bg-bg-surface-2 px-4 py-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">{label}</h3>
    </div>
  );
}
