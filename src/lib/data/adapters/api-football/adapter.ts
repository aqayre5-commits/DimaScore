import type { DataProvider } from '@/lib/data/provider';
import type {
  NormalizedCountry,
  NormalizedLeague,
  NormalizedSeason,
  NormalizedVenue,
  NormalizedTeam,
  NormalizedTeamStatistics,
  NormalizedFixture,
  NormalizedFixtureEvent,
  NormalizedFixtureLineup,
  NormalizedFixtureStatistic,
  NormalizedFixturePlayer,
  NormalizedStandings,
  NormalizedPlayerStatistics,
  NormalizedPlayer,
  NormalizedSquadPlayer,
  NormalizedTopPlayer,
  NormalizedCoach,
  NormalizedInjury,
  NormalizedTransfer,
  NormalizedTrophy,
  NormalizedSidelined,
  NormalizedPrediction,
  NormalizedStatus,
  Coverage,
  FixtureStatus,
} from '@/lib/data/types';
import type {
  RawCoverage,
  RawLeagueEntry,
  RawSeason,
  RawVenue,
  RawTeamEntry,
  RawTeamStatistics,
  RawFixtureEntry,
  RawFixtureEvent,
  RawFixtureLineup,
  RawFixtureStatistic,
  RawFixturePlayerEntry,
  RawStandingsEntry,
  RawStandingRow,
  RawPlayerEntry,
  RawSquadEntry,
  RawCoachEntry,
  RawInjuryEntry,
  RawTransferEntry,
  RawTrophyEntry,
  RawSidelinedEntry,
  RawPredictionEntry,
  RawStatus,
  RawCountry,
} from './types';
import * as endpoints from './endpoints';
import {
  filterValid,
  isValidFixtureEntry,
  isValidStandingsEntry,
  isValidTeamEntry,
  isValidLeagueEntry,
} from './validators';

// --- Normalizers ---

function normalizeCoverage(raw: RawCoverage): Coverage {
  return {
    fixtures: {
      events: raw.fixtures.events,
      lineups: raw.fixtures.lineups,
      statisticsFixtures: raw.fixtures.statistics_fixtures,
      statisticsPlayers: raw.fixtures.statistics_players,
    },
    standings: raw.standings,
    players: raw.players,
    topScorers: raw.top_scorers,
    topAssists: raw.top_assists,
    topCards: raw.top_cards,
    injuries: raw.injuries,
    predictions: raw.predictions,
  };
}

function normalizeSeason(raw: RawSeason): NormalizedSeason {
  return {
    year: raw.year,
    start: raw.start,
    end: raw.end,
    current: raw.current,
    coverage: normalizeCoverage(raw.coverage),
  };
}

function normalizeCountry(raw: RawCountry): NormalizedCountry {
  return { name: raw.name, code: raw.code, flag: raw.flag };
}

function normalizeLeague(raw: RawLeagueEntry): NormalizedLeague {
  return {
    id: raw.league.id,
    name: raw.league.name,
    type: raw.league.type.toLowerCase() as 'league' | 'cup',
    logo: raw.league.logo,
    country: normalizeCountry(raw.country),
    seasons: raw.seasons.map(normalizeSeason),
  };
}

function normalizeVenue(raw: RawVenue): NormalizedVenue {
  return {
    id: raw.id,
    name: raw.name,
    city: raw.city,
    country: raw.country,
    capacity: raw.capacity,
    image: raw.image,
  };
}

function normalizeTeam(raw: RawTeamEntry): NormalizedTeam {
  return {
    id: raw.team.id,
    name: raw.team.name,
    code: raw.team.code,
    logo: raw.team.logo,
    country: raw.team.country,
    founded: raw.team.founded,
    national: raw.team.national,
    venue: raw.venue ? normalizeVenue(raw.venue) : null,
  };
}

function normalizeTeamStatistics(raw: RawTeamStatistics): NormalizedTeamStatistics {
  return {
    teamId: raw.team.id,
    leagueId: raw.league.id,
    season: raw.league.season,
    form: raw.form,
    played: raw.fixtures.played,
    wins: raw.fixtures.wins,
    draws: raw.fixtures.draws,
    losses: raw.fixtures.loses,
    goalsFor: raw.goals.for.total,
    goalsAgainst: raw.goals.against.total,
    biggestWin: raw.biggest.wins,
    longestStreak: {
      wins: raw.biggest.streak.wins,
      draws: raw.biggest.streak.draws,
      losses: raw.biggest.streak.loses,
    },
    formations: raw.lineups,
  };
}

function normalizeFixture(raw: RawFixtureEntry): NormalizedFixture {
  return {
    id: raw.fixture.id,
    referee: raw.fixture.referee,
    date: raw.fixture.date,
    timestamp: raw.fixture.timestamp,
    venue: raw.fixture.venue,
    status: {
      short: raw.fixture.status.short as FixtureStatus,
      long: raw.fixture.status.long,
      elapsed: raw.fixture.status.elapsed,
    },
    league: {
      id: raw.league.id,
      name: raw.league.name,
      logo: raw.league.logo,
      country: raw.league.country,
      round: raw.league.round,
      season: raw.league.season,
    },
    homeTeam: raw.teams.home,
    awayTeam: raw.teams.away,
    goals: raw.goals,
    score: raw.score,
  };
}

function normalizeFixtureEvent(raw: RawFixtureEvent): NormalizedFixtureEvent {
  return {
    time: raw.time,
    team: raw.team,
    player: raw.player,
    assist: raw.assist,
    type: raw.type,
    detail: raw.detail,
  };
}

function normalizeFixtureLineup(raw: RawFixtureLineup): NormalizedFixtureLineup {
  return {
    team: raw.team,
    formation: raw.formation,
    coach: raw.coach,
    startXI: raw.startXI,
    substitutes: raw.substitutes.map((s) => ({
      player: { id: s.player.id, name: s.player.name, number: s.player.number, pos: s.player.pos },
    })),
  };
}

function normalizeFixtureStatistic(raw: RawFixtureStatistic): NormalizedFixtureStatistic {
  return { team: raw.team, statistics: raw.statistics };
}

function normalizeFixturePlayer(raw: RawFixturePlayerEntry): NormalizedFixturePlayer {
  return {
    team: { id: raw.team.id, name: raw.team.name, logo: raw.team.logo },
    players: raw.players.map((p) => ({
      player: p.player,
      statistics: p.statistics.map((s) => ({
        minutes: s.games.minutes,
        rating: s.games.rating,
        captain: s.games.captain,
        position: s.games.position,
        shots: s.shots,
        goals: { total: s.goals.total, assists: s.goals.assists },
        passes: s.passes,
        tackles: s.tackles,
        duels: s.duels,
        dribbles: { attempts: s.dribbles.attempts, success: s.dribbles.success },
        fouls: s.fouls,
        cards: { yellow: s.cards.yellow, red: s.cards.red },
        penalty: { scored: s.penalty.scored, missed: s.penalty.missed },
      })),
    })),
  };
}

function normalizeStandingRow(raw: RawStandingRow) {
  return {
    rank: raw.rank,
    team: raw.team,
    points: raw.points,
    goalsDiff: raw.goalsDiff,
    group: raw.group,
    description: raw.description,
    form: raw.form,
    all: { ...raw.all, goalsFor: raw.all.goals.for, goalsAgainst: raw.all.goals.against },
    home: { ...raw.home, goalsFor: raw.home.goals.for, goalsAgainst: raw.home.goals.against },
    away: { ...raw.away, goalsFor: raw.away.goals.for, goalsAgainst: raw.away.goals.against },
  };
}

function normalizePlayer(raw: RawPlayerEntry['player']): NormalizedPlayer {
  return {
    id: raw.id,
    name: raw.name,
    firstname: raw.firstname,
    lastname: raw.lastname,
    age: raw.age,
    nationality: raw.nationality,
    height: raw.height,
    weight: raw.weight,
    photo: raw.photo,
    injured: raw.injured,
  };
}

function normalizePlayerStatistics(raw: RawPlayerEntry): NormalizedPlayerStatistics {
  return {
    player: normalizePlayer(raw.player),
    statistics: raw.statistics.map((s) => ({
      team: s.team,
      league: { id: s.league.id, name: s.league.name, season: s.league.season },
      games: {
        appearances: s.games.appearances,
        minutes: s.games.minutes,
        position: s.games.position,
        rating: s.games.rating,
      },
      goals: { total: s.goals.total, assists: s.goals.assists },
      shots: s.shots,
      passes: s.passes,
      tackles: s.tackles,
      duels: s.duels,
      dribbles: { attempts: s.dribbles.attempts, success: s.dribbles.success },
      fouls: s.fouls,
      cards: { yellow: s.cards.yellow, red: s.cards.red },
      penalty: { scored: s.penalty.scored, missed: s.penalty.missed },
    })),
  };
}

function normalizeTopPlayer(raw: RawPlayerEntry): NormalizedTopPlayer {
  return {
    player: normalizePlayer(raw.player),
    statistics: raw.statistics.map((s) => ({
      team: s.team,
      league: { id: s.league.id, name: s.league.name, season: s.league.season },
      goals: s.goals.total,
      assists: s.goals.assists,
      yellowCards: s.cards.yellow,
      redCards: s.cards.red,
    })),
  };
}

function normalizeCoach(raw: RawCoachEntry): NormalizedCoach {
  return {
    id: raw.id,
    name: raw.name,
    firstname: raw.firstname,
    lastname: raw.lastname,
    age: raw.age,
    nationality: raw.nationality,
    photo: raw.photo,
    team: raw.team,
    career: raw.career,
  };
}

function normalizeInjury(raw: RawInjuryEntry): NormalizedInjury {
  return {
    player: { id: raw.player.id, name: raw.player.name, photo: raw.player.photo },
    team: raw.team,
    fixture: { id: raw.fixture.id, date: raw.fixture.date },
    league: { id: raw.league.id, name: raw.league.name, season: raw.league.season },
    type: raw.player.type,
    reason: raw.player.reason,
  };
}

function normalizeTransfer(raw: RawTransferEntry): NormalizedTransfer[] {
  return raw.transfers.map((t) => ({
    player: raw.player,
    date: t.date,
    type: t.type,
    teams: { from: t.teams.out, to: t.teams.in },
  }));
}

function normalizePrediction(raw: RawPredictionEntry, fixtureId: number): NormalizedPrediction {
  return {
    fixtureId,
    winner: raw.predictions.winner,
    winOrDraw: raw.predictions.win_or_draw,
    underOver: raw.predictions.under_over,
    advice: raw.predictions.advice,
    percent: raw.predictions.percent,
    comparison: raw.comparison,
  };
}

function normalizeStatus(raw: RawStatus): NormalizedStatus {
  return {
    account: raw.account,
    subscription: raw.subscription,
    requests: {
      current: raw.requests.current,
      limitDay: raw.requests.limit_day,
    },
  };
}

// --- Adapter ---

export class ApiFootballAdapter implements DataProvider {
  async getStatus(): Promise<NormalizedStatus> {
    const res = await endpoints.fetchStatus();
    // /status returns response as a plain object, not an array
    const raw = Array.isArray(res.response) ? res.response[0] : res.response;
    return normalizeStatus(raw);
  }

  async getTimezones(): Promise<string[]> {
    const res = await endpoints.fetchTimezones();
    return res.response;
  }

  async getCountries(): Promise<NormalizedCountry[]> {
    const res = await endpoints.fetchCountries();
    return res.response.map(normalizeCountry);
  }

  async getLeagues(params?: {
    id?: number;
    country?: string;
    season?: number;
  }): Promise<NormalizedLeague[]> {
    const res = await endpoints.fetchLeagues(params);
    const valid = filterValid(res.response, isValidLeagueEntry, 'leagues');
    return valid.map(normalizeLeague);
  }

  async getLeagueSeasons(): Promise<number[]> {
    const res = await endpoints.fetchLeagueSeasons();
    return res.response;
  }

  async getVenues(params: { country?: string; id?: number }): Promise<NormalizedVenue[]> {
    const res = await endpoints.fetchVenues(params);
    return res.response.map(normalizeVenue);
  }

  async getTeams(params: {
    league?: number;
    season?: number;
    id?: number;
    country?: string;
  }): Promise<NormalizedTeam[]> {
    const res = await endpoints.fetchTeams(params);
    const valid = filterValid(res.response, isValidTeamEntry, 'teams');
    return valid.map(normalizeTeam);
  }

  async getTeamStatistics(params: {
    team: number;
    league: number;
    season: number;
  }): Promise<NormalizedTeamStatistics> {
    const res = await endpoints.fetchTeamStatistics(params);
    return normalizeTeamStatistics(res.response[0]);
  }

  async getTeamSeasons(params: { team: number }): Promise<number[]> {
    const res = await endpoints.fetchTeamSeasons(params);
    return res.response;
  }

  async getFixtures(params: {
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
  }): Promise<NormalizedFixture[]> {
    const apiParams: Record<string, string | number | boolean> = {};
    if (params.id !== undefined) apiParams.id = params.id;
    if (params.ids !== undefined) apiParams.ids = params.ids.join('-');
    if (params.league !== undefined) apiParams.league = params.league;
    if (params.season !== undefined) apiParams.season = params.season;
    if (params.team !== undefined) apiParams.team = params.team;
    if (params.date !== undefined) apiParams.date = params.date;
    if (params.from !== undefined) apiParams.from = params.from;
    if (params.to !== undefined) apiParams.to = params.to;
    if (params.round !== undefined) apiParams.round = params.round;
    if (params.status !== undefined) apiParams.status = params.status;
    if (params.live !== undefined) apiParams.live = params.live;

    const res = await endpoints.fetchFixtures(
      apiParams as Parameters<typeof endpoints.fetchFixtures>[0],
    );
    const valid = filterValid(res.response, isValidFixtureEntry, 'fixtures');
    return valid.map(normalizeFixture);
  }

  async getLiveFixtures(params?: { league?: string }): Promise<NormalizedFixture[]> {
    const res = await endpoints.fetchLiveFixtures(params);
    const valid = filterValid(res.response, isValidFixtureEntry, 'live-fixtures');
    return valid.map(normalizeFixture);
  }

  async getFixtureRounds(params: { league: number; season: number }): Promise<string[]> {
    const res = await endpoints.fetchFixtureRounds(params);
    return res.response;
  }

  async getHeadToHead(params: { h2h: string; last?: number }): Promise<NormalizedFixture[]> {
    const res = await endpoints.fetchHeadToHead(params);
    const valid = filterValid(res.response, isValidFixtureEntry, 'h2h');
    return valid.map(normalizeFixture);
  }

  async getFixtureEvents(params: { fixture: number }): Promise<NormalizedFixtureEvent[]> {
    const res = await endpoints.fetchFixtureEvents(params);
    return res.response.map(normalizeFixtureEvent);
  }

  async getFixtureLineups(params: { fixture: number }): Promise<NormalizedFixtureLineup[]> {
    const res = await endpoints.fetchFixtureLineups(params);
    return res.response.map(normalizeFixtureLineup);
  }

  async getFixtureStatistics(params: { fixture: number }): Promise<NormalizedFixtureStatistic[]> {
    const res = await endpoints.fetchFixtureStatistics(params);
    return res.response.map(normalizeFixtureStatistic);
  }

  async getFixturePlayers(params: { fixture: number }): Promise<NormalizedFixturePlayer[]> {
    const res = await endpoints.fetchFixturePlayers(params);
    return res.response.map(normalizeFixturePlayer);
  }

  async getStandings(params: { league: number; season: number }): Promise<NormalizedStandings> {
    const res = await endpoints.fetchStandings(params);
    const valid = filterValid(res.response, isValidStandingsEntry, 'standings');
    if (valid.length === 0) return [];
    return valid[0].league.standings.map((group) => group.map(normalizeStandingRow));
  }

  async getPlayers(params: {
    id?: number;
    team?: number;
    league?: number;
    season?: number;
    page?: number;
  }): Promise<NormalizedPlayerStatistics[]> {
    const res = await endpoints.fetchPlayers(params);
    return res.response.map(normalizePlayerStatistics);
  }

  async getPlayerProfiles(params: { player: number }): Promise<NormalizedPlayer[]> {
    const res = await endpoints.fetchPlayerProfiles(params);
    return res.response.map((r) => normalizePlayer(r.player));
  }

  async getPlayerSquads(params: { team: number }): Promise<NormalizedSquadPlayer[]> {
    const res = await endpoints.fetchPlayerSquads(params);
    if (res.response.length === 0) return [];
    return res.response[0].players;
  }

  async getPlayerSeasons(params: { player: number }): Promise<number[]> {
    const res = await endpoints.fetchPlayerSeasons(params);
    return res.response;
  }

  async getTopScorers(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]> {
    const res = await endpoints.fetchTopScorers(params);
    return res.response.map(normalizeTopPlayer);
  }

  async getTopAssists(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]> {
    const res = await endpoints.fetchTopAssists(params);
    return res.response.map(normalizeTopPlayer);
  }

  async getTopYellowCards(params: {
    league: number;
    season: number;
  }): Promise<NormalizedTopPlayer[]> {
    const res = await endpoints.fetchTopYellowCards(params);
    return res.response.map(normalizeTopPlayer);
  }

  async getTopRedCards(params: { league: number; season: number }): Promise<NormalizedTopPlayer[]> {
    const res = await endpoints.fetchTopRedCards(params);
    return res.response.map(normalizeTopPlayer);
  }

  async getCoaches(params: { id?: number; team?: number }): Promise<NormalizedCoach[]> {
    const res = await endpoints.fetchCoaches(params);
    return res.response.map(normalizeCoach);
  }

  async getInjuries(params: {
    league?: number;
    season?: number;
    fixture?: number;
    team?: number;
  }): Promise<NormalizedInjury[]> {
    const res = await endpoints.fetchInjuries(params);
    return res.response.map(normalizeInjury);
  }

  async getTransfers(params: { player?: number; team?: number }): Promise<NormalizedTransfer[]> {
    const res = await endpoints.fetchTransfers(params);
    return res.response.flatMap(normalizeTransfer);
  }

  async getTrophies(params: { player?: number; coach?: number }): Promise<NormalizedTrophy[]> {
    const res = await endpoints.fetchTrophies(params);
    return res.response.map((t: RawTrophyEntry) => ({
      league: t.league,
      country: t.country,
      season: t.season,
      place: t.place,
    }));
  }

  async getSidelined(params: { player?: number; coach?: number }): Promise<NormalizedSidelined[]> {
    const res = await endpoints.fetchSidelined(params);
    return res.response.map((s: RawSidelinedEntry) => ({
      type: s.type,
      start: s.start,
      end: s.end,
    }));
  }

  async getPredictions(params: { fixture: number }): Promise<NormalizedPrediction[]> {
    const res = await endpoints.fetchPredictions(params);
    return res.response.map((r) => normalizePrediction(r, params.fixture));
  }
}
