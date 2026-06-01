'use client';

import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { fetchMatchSidebar } from '@/lib/api/match';
import type { MatchDetail, MatchCoverage } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import { MatchInfoCard } from '@/components/match/MatchInfoCard';
import { H2HPanel } from '@/components/match/H2HPanel';
import { NextMatchCard } from '@/components/match/NextMatchCard';
import { MatchEventsCard } from '@/components/match/MatchEventsCard';
import { PredictionCard } from '@/components/match/PredictionCard';
import { fetchMatchEvents } from '@/lib/api/match';

/** Serializable subset of MatchDetail (kickoffAt as ISO string) */
export interface SerializedMatchDetail {
  id: number;
  kickoffAt: string;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
  round: string | null;
  referee: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScoreFt: number | null;
  awayScoreFt: number | null;
  homeScoreEt: number | null;
  awayScoreEt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  competition: {
    id: number;
    slug: string;
    name: Record<string, string>;
    countryCode: string | null;
    logoUrl: string | null;
  };
  venue: {
    id: number;
    name: string | null;
    city: string | null;
    capacity: number | null;
    imageUrl: string | null;
  } | null;
  seasonYear: number;
}

interface MatchClientSidebarProps {
  matchId: string;
  locale: Locale;
  match: SerializedMatchDetail;
  coverage: MatchCoverage | null;
  competitionHref: string | null;
  homeTeamId: number;
  awayTeamId: number;
  homeName: string;
  awayName: string;
  isUpcoming: boolean;
}

export function MatchClientLeftRail({
  matchId,
  locale,
  match,
  coverage,
  homeTeamId,
  awayTeamId,
  isUpcoming,
}: Pick<
  MatchClientSidebarProps,
  'matchId' | 'locale' | 'match' | 'coverage' | 'homeTeamId' | 'awayTeamId' | 'isUpcoming'
>) {
  const sidebarKey = [...qk.match(matchId), 'sidebar'] as const;

  const { data: sidebar } = useQuery({
    queryKey: sidebarKey,
    queryFn: () => fetchMatchSidebar(matchId),
  });

  const { data: events } = useQuery({
    queryKey: qk.matchEvents(matchId),
    queryFn: () => fetchMatchEvents(matchId),
    enabled: !isUpcoming && (coverage?.events ?? false),
  });

  const nextFixtures = (sidebar?.nextFixtures ?? []).map((f) => ({
    ...f,
    kickoffAt: new Date(f.kickoffAt),
  }));

  const hasEvents = (coverage?.events ?? false) && (events?.length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <NextMatchCard
        fixtures={nextFixtures}
        homeTeamId={homeTeamId}
        awayTeamId={awayTeamId}
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        locale={locale}
      />
      {hasEvents && events && (
        <MatchEventsCard events={events} homeTeamId={homeTeamId} locale={locale} />
      )}
      {coverage?.predictions && <PredictionCard />}
    </div>
  );
}

export function MatchClientRightRail({
  matchId,
  locale,
  match,
  competitionHref,
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
}: Omit<MatchClientSidebarProps, 'coverage' | 'isUpcoming'>) {
  const sidebarKey = [...qk.match(matchId), 'sidebar'] as const;

  const { data: sidebar } = useQuery({
    queryKey: sidebarKey,
    queryFn: () => fetchMatchSidebar(matchId),
  });

  // Rehydrate dates and map to H2HFixture shape
  const h2hFixtures = (sidebar?.h2h ?? []).map((f) => ({
    ...f,
    kickoffAt: new Date(f.kickoffAt),
  }));

  // MatchInfoCard expects MatchDetail with Date — rehydrate
  const matchForInfo = {
    ...match,
    kickoffAt: new Date(match.kickoffAt),
  } as MatchDetail;

  return (
    <div className="space-y-4">
      <MatchInfoCard match={matchForInfo} locale={locale} competitionHref={competitionHref} />
      <H2HPanel
        fixtures={h2hFixtures}
        homeTeamId={homeTeamId}
        homeTeamName={homeName}
        awayTeamName={awayName}
        locale={locale}
      />
    </div>
  );
}
