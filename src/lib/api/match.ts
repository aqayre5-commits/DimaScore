import type {
  MatchCoverage,
  MatchEvent,
  MatchLineup,
  MatchTeamStats,
  MatchPlayerStat,
  H2HFixture,
  NextFixture,
} from '@/lib/db/queries/match-detail';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import type { GoalScorer } from '@/components/match/ScoreHeader';

/** JSON-serialized match summary (dates as ISO strings) */
export interface MatchSummary {
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
  coverage: MatchCoverage | null;
  goalScorers: GoalScorer[];
}

export interface MatchStatsResponse {
  teamStats: MatchTeamStats[];
  playerStats: MatchPlayerStat[];
}

export interface MatchSidebarResponse {
  h2h: (Omit<H2HFixture, 'kickoffAt'> & { kickoffAt: string })[];
  nextFixtures: (Omit<NextFixture, 'kickoffAt'> & { kickoffAt: string })[];
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${url} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchMatch(id: string): Promise<MatchSummary> {
  return fetchJson(`/api/v1/match/${id}`);
}

export function fetchMatchEvents(id: string): Promise<MatchEvent[]> {
  return fetchJson(`/api/v1/match/${id}/events`);
}

export function fetchMatchLineups(id: string): Promise<MatchLineup[]> {
  return fetchJson(`/api/v1/match/${id}/lineups`);
}

export function fetchMatchStats(id: string): Promise<MatchStatsResponse> {
  return fetchJson(`/api/v1/match/${id}/stats`);
}

export function fetchMatchSidebar(id: string): Promise<MatchSidebarResponse> {
  return fetchJson(`/api/v1/match/${id}/sidebar`);
}
