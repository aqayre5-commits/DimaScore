import { apiGet } from './client';
import type {
  RawStatus,
  RawCountry,
  RawLeagueEntry,
  RawVenue,
  RawTeamEntry,
  RawTeamStatistics,
  RawFixtureEntry,
  RawFixtureEvent,
  RawFixtureLineup,
  RawFixtureStatistic,
  RawFixturePlayerEntry,
  RawStandingsEntry,
  RawPlayerEntry,
  RawSquadEntry,
  RawCoachEntry,
  RawInjuryEntry,
  RawTransferEntry,
  RawTrophyEntry,
  RawSidelinedEntry,
  RawPredictionEntry,
  ApiResponse,
} from './types';

// --- Health (does not count against quota) ---

export function fetchStatus(): Promise<ApiResponse<RawStatus>> {
  return apiGet<RawStatus>('/status');
}

// --- Reference data ---

export function fetchTimezones(): Promise<ApiResponse<string>> {
  return apiGet<string>('/timezone');
}

export function fetchCountries(params?: {
  name?: string;
  code?: string;
}): Promise<ApiResponse<RawCountry>> {
  return apiGet<RawCountry>('/countries', params);
}

export function fetchLeagues(params?: {
  id?: number;
  name?: string;
  country?: string;
  code?: string;
  season?: number;
  current?: boolean;
  type?: 'league' | 'cup';
}): Promise<ApiResponse<RawLeagueEntry>> {
  return apiGet<RawLeagueEntry>('/leagues', params as Record<string, string | number | boolean>);
}

export function fetchLeagueSeasons(): Promise<ApiResponse<number>> {
  return apiGet<number>('/leagues/seasons');
}

export function fetchVenues(params: {
  id?: number;
  name?: string;
  city?: string;
  country?: string;
}): Promise<ApiResponse<RawVenue>> {
  return apiGet<RawVenue>('/venues', params);
}

// --- Teams ---

export function fetchTeams(params: {
  id?: number;
  name?: string;
  league?: number;
  season?: number;
  country?: string;
}): Promise<ApiResponse<RawTeamEntry>> {
  return apiGet<RawTeamEntry>('/teams', params as Record<string, string | number | boolean>);
}

export function fetchTeamStatistics(params: {
  league: number;
  season: number;
  team: number;
}): Promise<ApiResponse<RawTeamStatistics>> {
  return apiGet<RawTeamStatistics>('/teams/statistics', params);
}

export function fetchTeamSeasons(params: { team: number }): Promise<ApiResponse<number>> {
  return apiGet<number>('/teams/seasons', params);
}

// --- Fixtures ---

export function fetchFixtures(params: {
  id?: number;
  ids?: string;
  league?: number;
  season?: number;
  team?: number;
  date?: string;
  from?: string;
  to?: string;
  round?: string;
  status?: string;
  live?: string;
}): Promise<ApiResponse<RawFixtureEntry>> {
  return apiGet<RawFixtureEntry>('/fixtures', params as Record<string, string | number | boolean>);
}

export function fetchLiveFixtures(params?: {
  league?: string;
}): Promise<ApiResponse<RawFixtureEntry>> {
  return apiGet<RawFixtureEntry>('/fixtures', { live: 'all', ...params });
}

export function fetchFixtureRounds(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<string>> {
  return apiGet<string>('/fixtures/rounds', params);
}

export function fetchHeadToHead(params: {
  h2h: string;
  last?: number;
}): Promise<ApiResponse<RawFixtureEntry>> {
  return apiGet<RawFixtureEntry>(
    '/fixtures/headtohead',
    params as Record<string, string | number | boolean>,
  );
}

export function fetchFixtureStatistics(params: {
  fixture: number;
  type?: string;
}): Promise<ApiResponse<RawFixtureStatistic>> {
  return apiGet<RawFixtureStatistic>(
    '/fixtures/statistics',
    params as Record<string, string | number | boolean>,
  );
}

export function fetchFixtureEvents(params: {
  fixture: number;
  team?: number;
  player?: number;
  type?: string;
}): Promise<ApiResponse<RawFixtureEvent>> {
  return apiGet<RawFixtureEvent>(
    '/fixtures/events',
    params as Record<string, string | number | boolean>,
  );
}

export function fetchFixtureLineups(params: {
  fixture: number;
}): Promise<ApiResponse<RawFixtureLineup>> {
  return apiGet<RawFixtureLineup>('/fixtures/lineups', params);
}

export function fetchFixturePlayers(params: {
  fixture: number;
}): Promise<ApiResponse<RawFixturePlayerEntry>> {
  return apiGet<RawFixturePlayerEntry>('/fixtures/players', params);
}

// --- Standings ---

export function fetchStandings(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<RawStandingsEntry>> {
  return apiGet<RawStandingsEntry>('/standings', params);
}

// --- Players ---

export function fetchPlayers(params: {
  id?: number;
  team?: number;
  league?: number;
  season?: number;
  page?: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players', params as Record<string, string | number | boolean>);
}

export function fetchPlayerProfiles(params: {
  player: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players/profiles', params);
}

export function fetchPlayerSquads(params: { team: number }): Promise<ApiResponse<RawSquadEntry>> {
  return apiGet<RawSquadEntry>('/players/squads', params);
}

export function fetchPlayerSeasons(params: { player: number }): Promise<ApiResponse<number>> {
  return apiGet<number>('/players/seasons', params);
}

export function fetchTopScorers(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players/topscorers', params);
}

export function fetchTopAssists(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players/topassists', params);
}

export function fetchTopYellowCards(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players/topyellowcards', params);
}

export function fetchTopRedCards(params: {
  league: number;
  season: number;
}): Promise<ApiResponse<RawPlayerEntry>> {
  return apiGet<RawPlayerEntry>('/players/topredcards', params);
}

// --- Coaches ---

export function fetchCoaches(params: {
  id?: number;
  team?: number;
  search?: string;
}): Promise<ApiResponse<RawCoachEntry>> {
  return apiGet<RawCoachEntry>('/coachs', params as Record<string, string | number | boolean>);
}

// --- Injuries ---

export function fetchInjuries(params: {
  league?: number;
  season?: number;
  fixture?: number;
  team?: number;
  player?: number;
}): Promise<ApiResponse<RawInjuryEntry>> {
  return apiGet<RawInjuryEntry>('/injuries', params as Record<string, string | number | boolean>);
}

// --- Transfers ---

export function fetchTransfers(params: {
  player?: number;
  team?: number;
}): Promise<ApiResponse<RawTransferEntry>> {
  return apiGet<RawTransferEntry>(
    '/transfers',
    params as Record<string, string | number | boolean>,
  );
}

// --- Trophies ---

export function fetchTrophies(params: {
  player?: number;
  coach?: number;
}): Promise<ApiResponse<RawTrophyEntry>> {
  return apiGet<RawTrophyEntry>('/trophies', params as Record<string, string | number | boolean>);
}

// --- Sidelined ---

export function fetchSidelined(params: {
  player?: number;
  coach?: number;
}): Promise<ApiResponse<RawSidelinedEntry>> {
  return apiGet<RawSidelinedEntry>(
    '/sidelined',
    params as Record<string, string | number | boolean>,
  );
}

// --- Predictions (editorial framing only — no odds, Rule 11) ---

export function fetchPredictions(params: {
  fixture: number;
}): Promise<ApiResponse<RawPredictionEntry>> {
  return apiGet<RawPredictionEntry>('/predictions', params);
}
