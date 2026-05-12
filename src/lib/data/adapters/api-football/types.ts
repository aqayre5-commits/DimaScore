// Raw response types from API-Football v3.
// These mirror the JSON shapes returned by the API exactly.

// --- Envelope ---

export interface ApiResponse<T> {
  get: string;
  parameters: Record<string, string | number>;
  errors: Record<string, string> | unknown[];
  results: number;
  paging: { current: number; total: number };
  response: T[];
}

// --- Status ---

export interface RawStatus {
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
    limit_day: number;
  };
}

// --- Country ---

export interface RawCountry {
  name: string;
  code: string | null;
  flag: string | null;
}

// --- League ---

export interface RawLeagueEntry {
  league: {
    id: number;
    name: string;
    type: 'League' | 'Cup';
    logo: string | null;
  };
  country: RawCountry;
  seasons: RawSeason[];
}

export interface RawSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
  coverage: RawCoverage;
}

export interface RawCoverage {
  fixtures: {
    events: boolean;
    lineups: boolean;
    statistics_fixtures: boolean;
    statistics_players: boolean;
  };
  standings: boolean;
  players: boolean;
  top_scorers: boolean;
  top_assists: boolean;
  top_cards: boolean;
  injuries: boolean;
  predictions: boolean;
  odds: boolean;
}

// --- Venue ---

export interface RawVenue {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  capacity: number | null;
  surface: string | null;
  image: string | null;
}

// --- Team ---

export interface RawTeamEntry {
  team: {
    id: number;
    name: string;
    code: string | null;
    country: string | null;
    founded: number | null;
    national: boolean;
    logo: string | null;
  };
  venue: RawVenue | null;
}

export interface RawTeamStatistics {
  league: { id: number; name: string; season: number };
  team: { id: number; name: string; logo: string | null };
  form: string | null;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    loses: { home: number; away: number; total: number };
  };
  goals: {
    for: { total: { home: number; away: number; total: number } };
    against: { total: { home: number; away: number; total: number } };
  };
  biggest: {
    wins: { home: string | null; away: string | null };
    streak: { wins: number; draws: number; loses: number };
  };
  lineups: Array<{ formation: string; played: number }>;
}

// --- Fixture ---

export interface RawFixtureEntry {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    periods: { first: number | null; second: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string | null;
    logo: string | null;
    flag: string | null;
    season: number;
    round: string | null;
  };
  teams: {
    home: { id: number; name: string; logo: string | null; winner: boolean | null };
    away: { id: number; name: string; logo: string | null; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface RawFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string | null };
  player: { id: number | null; name: string | null };
  assist: { id: number | null; name: string | null };
  type: string;
  detail: string;
  comments: string | null;
}

export interface RawFixtureLineup {
  team: { id: number; name: string; logo: string | null; colors: unknown };
  formation: string | null;
  coach: { id: number | null; name: string | null; photo: string | null };
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string | null; grid: string | null };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string | null; grid: string | null };
  }>;
}

export interface RawFixtureStatistic {
  team: { id: number; name: string; logo: string | null };
  statistics: Array<{ type: string; value: number | string | null }>;
}

export interface RawFixturePlayerEntry {
  team: { id: number; name: string; logo: string | null; update: string };
  players: Array<{
    player: { id: number; name: string; photo: string | null };
    statistics: Array<{
      games: {
        minutes: number | null;
        number: number;
        position: string | null;
        rating: string | null;
        captain: boolean;
      };
      shots: { total: number | null; on: number | null };
      goals: {
        total: number | null;
        conceded: number | null;
        assists: number | null;
        saves: number | null;
      };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      dribbles: { attempts: number | null; success: number | null; past: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number; yellowred: number; red: number };
      penalty: {
        won: number | null;
        commited: number | null;
        scored: number | null;
        missed: number | null;
        saved: number | null;
      };
    }>;
  }>;
}

// --- Standings ---

export interface RawStandingsEntry {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string;
    season: number;
    standings: RawStandingRow[][];
  };
}

export interface RawStandingRow {
  rank: number;
  team: { id: number; name: string; logo: string | null };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

// --- Player ---

export interface RawPlayerEntry {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: { date: string | null; place: string | null; country: string | null };
    nationality: string | null;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string | null;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string | null };
    league: {
      id: number;
      name: string;
      country: string | null;
      logo: string | null;
      flag: string | null;
      season: number;
    };
    games: {
      appearances: number | null;
      lineups: number | null;
      minutes: number | null;
      number: number | null;
      position: string | null;
      rating: string | null;
      captain: boolean;
    };
    substitutes: { in: number | null; out: number | null; bench: number | null };
    shots: { total: number | null; on: number | null };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null; past: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number | null; yellowred: number | null; red: number | null };
    penalty: {
      won: number | null;
      commited: number | null;
      scored: number | null;
      missed: number | null;
      saved: number | null;
    };
  }>;
}

export interface RawSquadEntry {
  team: { id: number; name: string; logo: string | null };
  players: Array<{
    id: number;
    name: string;
    age: number | null;
    number: number | null;
    position: string | null;
    photo: string | null;
  }>;
}

// --- Coach ---

export interface RawCoachEntry {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: { date: string | null; place: string | null; country: string | null };
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  team: { id: number; name: string; logo: string | null } | null;
  career: Array<{
    team: { id: number; name: string; logo: string | null };
    start: string | null;
    end: string | null;
  }>;
}

// --- Injuries ---

export interface RawInjuryEntry {
  player: {
    id: number;
    name: string;
    photo: string | null;
    type: string | null;
    reason: string | null;
  };
  team: { id: number; name: string; logo: string | null };
  fixture: { id: number; timezone: string; date: string; timestamp: number };
  league: {
    id: number;
    season: number;
    name: string;
    country: string | null;
    logo: string | null;
    flag: string | null;
  };
}

// --- Transfers ---

export interface RawTransferEntry {
  player: { id: number; name: string };
  update: string;
  transfers: Array<{
    date: string | null;
    type: string | null;
    teams: {
      in: { id: number; name: string; logo: string | null };
      out: { id: number; name: string; logo: string | null };
    };
  }>;
}

// --- Trophies ---

export interface RawTrophyEntry {
  league: string | null;
  country: string | null;
  season: string | null;
  place: string | null;
}

// --- Sidelined ---

export interface RawSidelinedEntry {
  type: string | null;
  start: string | null;
  end: string | null;
}

// --- Predictions ---

export interface RawPredictionEntry {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string; away: string };
    advice: string | null;
    percent: { home: string; draw: string; away: string };
  };
  league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
  teams: {
    home: Record<string, unknown>;
    away: Record<string, unknown>;
  };
  comparison: Record<string, { home: string; away: string }>;
  h2h: RawFixtureEntry[];
}
