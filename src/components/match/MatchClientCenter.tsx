'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { qk } from '@/lib/query-keys';
import { fetchMatchEvents, fetchMatchStats } from '@/lib/api/match';
import type { MatchCoverage } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';
import { EventTimeline } from '@/components/match/EventTimeline';
import { LineupPitch } from '@/components/match/LineupPitch';
import { StatsBars } from '@/components/match/StatsBars';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingBadge';
import { MatchSectionNav } from '@/components/match/MatchSectionNav';
import { fetchMatchLineups } from '@/lib/api/match';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { isLive } from '@/lib/match-status';

interface MatchClientCenterProps {
  matchId: string;
  locale: Locale;
  coverage: MatchCoverage | null;
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
  isUpcoming: boolean;
}

function SectionSkeleton() {
  return <div className="h-32 animate-pulse rounded bg-bg-surface-2" />;
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-t border-border-subtle bg-bg-surface-2 px-4 py-2.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">{label}</h3>
    </div>
  );
}

export function MatchClientCenter({
  matchId,
  locale,
  coverage,
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  isUpcoming,
}: MatchClientCenterProps) {
  const t = useTranslations('matchDetail');

  // While the match is live, poll the detail endpoints (SofaScore-style) so freshly
  // ingested lineups/events/stats surface without a reload. Stops once it goes FT.
  const live = useLiveMatch();
  const liveRefetch = live && isLive(live.statusCode) ? 30_000 : false;

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: qk.matchEvents(matchId),
    queryFn: () => fetchMatchEvents(matchId),
    enabled: !isUpcoming && (coverage?.events ?? false),
    refetchInterval: liveRefetch,
  });

  const { data: lineups, isLoading: lineupsLoading } = useQuery({
    queryKey: qk.matchLineups(matchId),
    queryFn: () => fetchMatchLineups(matchId),
    enabled: !isUpcoming && (coverage?.lineups ?? false),
    refetchInterval: liveRefetch,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: qk.matchStats(matchId),
    queryFn: () => fetchMatchStats(matchId),
    enabled:
      !isUpcoming &&
      ((coverage?.statisticsFixtures ?? false) || (coverage?.statisticsPlayers ?? false)),
    refetchInterval: liveRefetch,
  });

  const hasEvents = (coverage?.events ?? false) && (events?.length ?? 0) > 0;
  const hasLineups = (coverage?.lineups ?? false) && (lineups?.length ?? 0) === 2;
  const teamStats = statsData?.teamStats ?? [];
  const playerStats = statsData?.playerStats ?? [];
  const hasStats = (coverage?.statisticsFixtures ?? false) && teamStats.length === 2;
  const hasRatings = (coverage?.statisticsPlayers ?? false) && playerStats.length > 0;

  const homeLineup = lineups?.find((l) => l.teamId === homeTeamId);
  const awayLineup = lineups?.find((l) => l.teamId === awayTeamId);
  const homeStatData = teamStats.find((s) => s.teamId === homeTeamId);
  const awayStatData = teamStats.find((s) => s.teamId === awayTeamId);

  // Build sticky nav sections
  const navSections: Array<{ id: string; label: string }> = [];
  if (hasLineups) navSections.push({ id: 'sec-lineups', label: t('lineups') });
  if (hasEvents) navSections.push({ id: 'sec-events', label: t('events') });
  if (hasStats) navSections.push({ id: 'sec-statistics', label: t('stats') });
  if (hasRatings) navSections.push({ id: 'sec-players', label: t('playerRatings') });

  const isLoading = eventsLoading || lineupsLoading || statsLoading;
  const hasNoData = !isLoading && !hasEvents && !hasLineups && !hasStats && !hasRatings;

  return (
    <div className="space-y-3">
      {/* Sticky section nav — sits above every section as a standalone tab bar */}
      {navSections.length > 0 && <MatchSectionNav sections={navSections} />}

      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        {/* Lineups */}
        {lineupsLoading && coverage?.lineups && !isUpcoming && <SectionSkeleton />}
        {hasLineups && homeLineup && awayLineup && (
          <section id="sec-lineups" className="scroll-mt-[calc(var(--app-sticky-offset)_+_3.5rem)]">
            <LineupPitch
              homeLineup={homeLineup}
              awayLineup={awayLineup}
              homeTeamName={homeName}
              awayTeamName={awayName}
              locale={locale}
              pitchOnly
              events={events ?? []}
            />
          </section>
        )}

        {/* Events */}
        {eventsLoading && coverage?.events && !isUpcoming && <SectionSkeleton />}
        {hasEvents && events && (
          <section id="sec-events" className="scroll-mt-[calc(var(--app-sticky-offset)_+_3.5rem)]">
            <SectionHeader label={t('events')} />
            <EventTimeline events={events} homeTeamId={homeTeamId} locale={locale} />
          </section>
        )}

        {/* Statistics */}
        {statsLoading && coverage?.statisticsFixtures && !isUpcoming && <SectionSkeleton />}
        {hasStats && homeStatData && awayStatData && (
          <section
            id="sec-statistics"
            className="scroll-mt-[calc(var(--app-sticky-offset)_+_3.5rem)]"
          >
            <SectionHeader label={t('stats')} />
            <StatsBars homeStats={homeStatData} awayStats={awayStatData} />
          </section>
        )}

        {/* Player Statistics */}
        {hasRatings && (
          <section id="sec-players" className="scroll-mt-[calc(var(--app-sticky-offset)_+_3.5rem)]">
            <SectionHeader label={t('playerRatings')} />
            <PlayerRatingsPanel
              playerStats={playerStats}
              homeTeamId={homeTeamId}
              awayTeamId={awayTeamId}
              homeTeamName={homeName}
              awayTeamName={awayName}
              locale={locale}
            />
          </section>
        )}

        {/* Fallback */}
        {hasNoData && !isUpcoming && (
          <div className="px-4 py-10 text-center">
            <p className="text-sm text-text-tertiary">{t('noLiveDetailData')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
