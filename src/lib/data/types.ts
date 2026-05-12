// Normalized domain types — adapter-agnostic.
// Every DataProvider implementation emits these shapes.

// --- Fixture status (§A.6) ---

export type FixtureStatus =
  | 'TBD'
  | 'NS'
  | '1H'
  | '2H'
  | 'HT'
  | 'ET'
  | 'BT'
  | 'P'
  | 'SUSP'
  | 'INT'
  | 'FT'
  | 'AET'
  | 'PEN'
  | 'PST'
  | 'CANC'
  | 'ABD'
  | 'AWD'
  | 'WO'
  | 'LIVE';

export function isLiveStatus(status: FixtureStatus): boolean {
  return ['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE'].includes(status);
}

// --- Coverage (§A.2) ---

export interface Coverage {
  fixtures: {
    events: boolean;
    lineups: boolean;
    statisticsFixtures: boolean;
    statisticsPlayers: boolean;
  };
  standings: boolean;
  players: boolean;
  topScorers: boolean;
  topAssists: boolean;
  topCards: boolean;
  injuries: boolean;
  predictions: boolean;
}

// --- Quota ---

export interface QuotaInfo {
  daily: { limit: number; remaining: number };
  minute: { limit: number; remaining: number };
}

// --- Country ---

export interface NormalizedCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

// --- League / Competition ---

export interface NormalizedLeague {
  id: number;
  name: string;
  type: 'league' | 'cup';
  logo: string | null;
  country: NormalizedCountry;
  seasons: NormalizedSeason[];
}

export interface NormalizedSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: Coverage;
}

// --- Venue ---

export interface NormalizedVenue {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
  image: string | null;
}

// --- Team ---

export interface NormalizedTeam {
  id: number;
  name: string;
  code: string | null;
  logo: string | null;
  country: string | null;
  founded: number | null;
  national: boolean;
  venue: NormalizedVenue | null;
}

export interface NormalizedTeamStatistics {
  teamId: number;
  leagueId: number;
  season: number;
  form: string | null;
  played: { home: number; away: number; total: number };
  wins: { home: number; away: number; total: number };
  draws: { home: number; away: number; total: number };
  losses: { home: number; away: number; total: number };
  goalsFor: { home: number; away: number; total: number };
  goalsAgainst: { home: number; away: number; total: number };
  biggestWin: { home: string | null; away: string | null };
  longestStreak: { wins: number; draws: number; losses: number };
  formations: Array<{ formation: string; played: number }>;
}

// --- Player ---

export interface NormalizedPlayer {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  injured: boolean;
}

export interface NormalizedPlayerStatistics {
  player: NormalizedPlayer;
  statistics: Array<{
    team: { id: number; name: string; logo: string | null };
    league: { id: number; name: string; season: number };
    games: {
      appearances: number | null;
      minutes: number | null;
      position: string | null;
      rating: string | null;
    };
    goals: { total: number | null; assists: number | null };
    shots: { total: number | null; on: number | null };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number | null; red: number | null };
    penalty: { scored: number | null; missed: number | null };
  }>;
}

export interface NormalizedSquadPlayer {
  id: number;
  name: string;
  age: number | null;
  number: number | null;
  position: string | null;
  photo: string | null;
}

export interface NormalizedTopPlayer {
  player: NormalizedPlayer;
  statistics: Array<{
    team: { id: number; name: string; logo: string | null };
    league: { id: number; name: string; season: number };
    goals?: number | null;
    assists?: number | null;
    yellowCards?: number | null;
    redCards?: number | null;
  }>;
}

// --- Coach ---

export interface NormalizedCoach {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  nationality: string | null;
  photo: string | null;
  team: { id: number; name: string; logo: string | null } | null;
  career: Array<{
    team: { id: number; name: string; logo: string | null };
    start: string | null;
    end: string | null;
  }>;
}

// --- Fixture ---

export interface NormalizedFixture {
  id: number;
  referee: string | null;
  date: string;
  timestamp: number;
  venue: { id: number | null; name: string | null; city: string | null };
  status: { short: FixtureStatus; long: string; elapsed: number | null };
  league: {
    id: number;
    name: string;
    logo: string | null;
    country: string | null;
    round: string | null;
    season: number;
  };
  homeTeam: { id: number; name: string; logo: string | null; winner: boolean | null };
  awayTeam: { id: number; name: string; logo: string | null; winner: boolean | null };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface NormalizedFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string | null };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
}

export interface NormalizedFixtureLineup {
  team: { id: number; name: string; logo: string | null };
  formation: string | null;
  coach: { id: number | null; name: string | null; photo: string | null };
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string | null; grid: string | null };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string | null };
  }>;
}

export interface NormalizedFixtureStatistic {
  team: { id: number; name: string; logo: string | null };
  statistics: Array<{ type: string; value: number | string | null }>;
}

export interface NormalizedFixturePlayer {
  team: { id: number; name: string; logo: string | null };
  players: Array<{
    player: { id: number; name: string; photo: string | null };
    statistics: Array<{
      minutes: number | null;
      rating: string | null;
      captain: boolean;
      position: string | null;
      shots: { total: number | null; on: number | null };
      goals: { total: number | null; assists: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      dribbles: { attempts: number | null; success: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number; red: number };
      penalty: { scored: number | null; missed: number | null };
    }>;
  }>;
}

// --- Standings ---

export interface NormalizedStandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string | null };
  points: number;
  goalsDiff: number;
  group: string;
  description: string | null;
  form: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goalsFor: number;
    goalsAgainst: number;
  };
}

export type NormalizedStandings = NormalizedStandingEntry[][];

// --- Injuries ---

export interface NormalizedInjury {
  player: { id: number; name: string; photo: string | null };
  team: { id: number; name: string; logo: string | null };
  fixture: { id: number; date: string };
  league: { id: number; name: string; season: number };
  type: string | null;
  reason: string | null;
}

// --- Transfers ---

export interface NormalizedTransfer {
  player: { id: number; name: string };
  date: string | null;
  type: string | null;
  teams: {
    from: { id: number; name: string; logo: string | null };
    to: { id: number; name: string; logo: string | null };
  };
}

// --- Trophies ---

export interface NormalizedTrophy {
  league: string | null;
  country: string | null;
  season: string | null;
  place: string | null;
}

// --- Sidelined ---

export interface NormalizedSidelined {
  type: string | null;
  start: string | null;
  end: string | null;
}

// --- Predictions (editorial framing only, no odds — Rule 11) ---

export interface NormalizedPrediction {
  fixtureId: number;
  winner: { id: number | null; name: string | null; comment: string | null };
  winOrDraw: boolean;
  underOver: string | null;
  advice: string | null;
  percent: { home: string; draw: string; away: string };
  comparison: Record<string, { home: string; away: string }>;
}

// --- Status (health check) ---

export interface NormalizedStatus {
  account: {
    firstname: string;
    lastname: string;
    email: string;
  };
  subscription: {
    plan: string;
    end: string;
    active: boolean;
  };
  requests: {
    current: number;
    limitDay: number;
  };
}
