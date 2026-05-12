import type {
  NormalizedCountry,
  NormalizedLeague,
  NormalizedVenue,
  NormalizedTeam,
  NormalizedTeamStatistics,
  NormalizedFixture,
  NormalizedFixtureEvent,
  NormalizedFixtureLineup,
  NormalizedFixtureStatistic,
  NormalizedFixturePlayer,
  NormalizedStandings,
  NormalizedPlayer,
  NormalizedPlayerStatistics,
  NormalizedSquadPlayer,
  NormalizedTopPlayer,
  NormalizedCoach,
  NormalizedInjury,
  NormalizedTransfer,
  NormalizedTrophy,
  NormalizedSidelined,
  NormalizedPrediction,
  NormalizedStatus,
} from './types';

export interface DataProvider {
  // Health / status
  getStatus(): Promise<NormalizedStatus>;

  // Reference data
  getTimezones(): Promise<string[]>;
  getCountries(): Promise<NormalizedCountry[]>;
  getLeagues(params?: {
    id?: number;
    country?: string;
    season?: number;
  }): Promise<NormalizedLeague[]>;
  getLeagueSeasons(): Promise<number[]>;
  getVenues(params: { country?: string; id?: number }): Promise<NormalizedVenue[]>;

  // Teams
  getTeams(params: {
    league?: number;
    season?: number;
    id?: number;
    country?: string;
  }): Promise<NormalizedTeam[]>;
  getTeamStatistics(params: {
    team: number;
    league: number;
    season: number;
  }): Promise<NormalizedTeamStatistics>;
  getTeamSeasons(params: { team: number }): Promise<number[]>;

  // Fixtures
  getFixtures(params: {
    id?: number;
    ids?: number[];
    league?: number;
    season?: number;
    team?: number;
    date?: string;
    from?: string;
    to?: string;
    round?: string;
    status?: string;
    live?: string;
  }): Promise<NormalizedFixture[]>;
  getLiveFixtures(params?: { league?: string }): Promise<NormalizedFixture[]>;
  getFixtureRounds(params: { league: number; season: number }): Promise<string[]>;
  getHeadToHead(params: { h2h: string; last?: number }): Promise<NormalizedFixture[]>;
  getFixtureEvents(params: { fixture: number }): Promise<NormalizedFixtureEvent[]>;
  getFixtureLineups(params: { fixture: number }): Promise<NormalizedFixtureLineup[]>;
  getFixtureStatistics(params: { fixture: number }): Promise<NormalizedFixtureStatistic[]>;
  getFixturePlayers(params: { fixture: number }): Promise<NormalizedFixturePlayer[]>;

  // Standings
  getStandings(params: { league: number; season: number }): Promise<NormalizedStandings>;

  // Players
  getPlayers(params: {
    id?: number;
    team?: number;
    league?: number;
    season?: number;
    page?: number;
  }): Promise<NormalizedPlayerStatistics[]>;
  getPlayerProfiles(params: { player: number }): Promise<NormalizedPlayer[]>;
  getPlayerSquads(params: { team: number }): Promise<NormalizedSquadPlayer[]>;
  getPlayerSeasons(params: { player: number }): Promise<number[]>;
  getTopScorers(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]>;
  getTopAssists(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]>;
  getTopYellowCards(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]>;
  getTopRedCards(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]>;

  // Coaches
  getCoaches(params: { id?: number; team?: number }): Promise<NormalizedCoach[]>;

  // Injuries
  getInjuries(params: {
    league?: number;
    season?: number;
    fixture?: number;
    team?: number;
  }): Promise<NormalizedInjury[]>;

  // Transfers
  getTransfers(params: { player?: number; team?: number }): Promise<NormalizedTransfer[]>;

  // Trophies
  getTrophies(params: { player?: number; coach?: number }): Promise<NormalizedTrophy[]>;

  // Sidelined
  getSidelined(params: { player?: number; coach?: number }): Promise<NormalizedSidelined[]>;

  // Predictions (editorial framing only — no odds, Rule 11)
  getPredictions(params: { fixture: number }): Promise<NormalizedPrediction[]>;
}
