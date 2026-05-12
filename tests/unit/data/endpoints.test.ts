import { describe, it, expect, vi } from 'vitest';
import { LEAGUE_IDS, TEAM_IDS } from '@/lib/constants/canonical-ids';

// Mock @upstash/redis
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    set = vi.fn().mockResolvedValue('OK');
    get = vi.fn().mockResolvedValue(null);
  },
}));

const endpoints = await import('@/lib/data/adapters/api-football/endpoints');

describe('API-Football endpoint wrappers', () => {
  // --- Health ---
  it('fetchStatus returns status envelope', async () => {
    const res = await endpoints.fetchStatus();
    expect(res.get).toBe('status');
    expect(res.response[0]).toHaveProperty('account');
    expect(res.response[0]).toHaveProperty('subscription');
    expect(res.response[0]).toHaveProperty('requests');
  });

  // --- Reference data ---
  it('fetchTimezones returns timezone strings', async () => {
    const res = await endpoints.fetchTimezones();
    expect(res.response).toContain('Africa/Casablanca');
  });

  it('fetchCountries returns countries with codes', async () => {
    const res = await endpoints.fetchCountries();
    expect(res.response.length).toBeGreaterThan(0);
    expect(res.response[0]).toHaveProperty('name');
    expect(res.response[0]).toHaveProperty('code');
  });

  it('fetchLeagues returns Botola Pro (BOTOLA_PRO_1)', async () => {
    const res = await endpoints.fetchLeagues();
    expect(res.response.length).toBeGreaterThan(0);
    const botola = res.response.find((l) => l.league.id === LEAGUE_IDS.BOTOLA_PRO_1);
    expect(botola).toBeDefined();
    expect(botola!.league.name).toBe('Botola Pro');
    expect(botola!.seasons[0].coverage).toHaveProperty('standings');
  });

  it('fetchLeagueSeasons returns year numbers', async () => {
    const res = await endpoints.fetchLeagueSeasons();
    expect(res.response).toContain(2025);
  });

  it('fetchVenues returns venue data', async () => {
    const res = await endpoints.fetchVenues({ country: 'Morocco' });
    expect(res.response[0]).toHaveProperty('id');
    expect(res.response[0]).toHaveProperty('name');
    expect(res.response[0]).toHaveProperty('capacity');
  });

  // --- Teams ---
  it('fetchTeams returns team entries', async () => {
    const res = await endpoints.fetchTeams({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].team).toHaveProperty('id');
    expect(res.response[0].team).toHaveProperty('name');
  });

  it('fetchTeamStatistics returns statistics', async () => {
    const res = await endpoints.fetchTeamStatistics({
      league: LEAGUE_IDS.BOTOLA_PRO_1,
      season: 2025,
      team: TEAM_IDS.WYDAD,
    });
    expect(res.response[0]).toHaveProperty('form');
    expect(res.response[0].fixtures).toHaveProperty('played');
  });

  it('fetchTeamSeasons returns year numbers', async () => {
    const res = await endpoints.fetchTeamSeasons({ team: TEAM_IDS.WYDAD });
    expect(res.response).toContain(2025);
  });

  // --- Fixtures ---
  it('fetchFixtures returns fixture entries', async () => {
    const res = await endpoints.fetchFixtures({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].fixture).toHaveProperty('id');
    expect(res.response[0].fixture).toHaveProperty('status');
    expect(res.response[0].teams).toHaveProperty('home');
  });

  it('fetchLiveFixtures returns live fixture list', async () => {
    const res = await endpoints.fetchLiveFixtures();
    expect(Array.isArray(res.response)).toBe(true);
  });

  it('fetchFixtureRounds returns round strings', async () => {
    const res = await endpoints.fetchFixtureRounds({
      league: LEAGUE_IDS.BOTOLA_PRO_1,
      season: 2025,
    });
    expect(res.response[0]).toMatch(/Regular Season/);
  });

  it('fetchHeadToHead returns fixture array', async () => {
    const res = await endpoints.fetchHeadToHead({ h2h: `${TEAM_IDS.WYDAD}-${TEAM_IDS.RAJA}` });
    expect(Array.isArray(res.response)).toBe(true);
  });

  it('fetchFixtureStatistics returns stats per team', async () => {
    const res = await endpoints.fetchFixtureStatistics({ fixture: 1050001 });
    expect(res.response[0]).toHaveProperty('team');
    expect(res.response[0]).toHaveProperty('statistics');
  });

  it('fetchFixtureEvents returns event timeline', async () => {
    const res = await endpoints.fetchFixtureEvents({ fixture: 1050001 });
    expect(res.response[0]).toHaveProperty('time');
    expect(res.response[0]).toHaveProperty('type');
    expect(res.response[0]).toHaveProperty('player');
  });

  it('fetchFixtureLineups returns lineup data', async () => {
    const res = await endpoints.fetchFixtureLineups({ fixture: 1050001 });
    expect(res.response[0]).toHaveProperty('formation');
    expect(res.response[0]).toHaveProperty('startXI');
    expect(res.response[0].startXI).toHaveLength(11);
  });

  it('fetchFixturePlayers returns per-player match stats', async () => {
    const res = await endpoints.fetchFixturePlayers({ fixture: 1050001 });
    expect(res.response[0]).toHaveProperty('team');
    expect(res.response[0]).toHaveProperty('players');
    expect(res.response[0].players[0].statistics[0]).toHaveProperty('games');
  });

  // --- Standings ---
  it('fetchStandings returns standings for Botola (BOTOLA_PRO_1)', async () => {
    const res = await endpoints.fetchStandings({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].league.id).toBe(LEAGUE_IDS.BOTOLA_PRO_1);
    expect(res.response[0].league.standings).toHaveLength(1);
    expect(res.response[0].league.standings[0][0]).toHaveProperty('rank');
  });

  // --- Players ---
  it('fetchPlayers returns player entries', async () => {
    const res = await endpoints.fetchPlayers({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].player).toHaveProperty('id');
    expect(res.response[0].statistics).toHaveLength(1);
  });

  it('fetchPlayerProfiles returns player bio', async () => {
    const res = await endpoints.fetchPlayerProfiles({ player: 50001 });
    expect(res.response[0].player.name).toBe('Ayoub Jabrane');
  });

  it('fetchPlayerSquads returns squad list', async () => {
    const res = await endpoints.fetchPlayerSquads({ team: TEAM_IDS.WYDAD });
    expect(res.response[0].players.length).toBeGreaterThan(0);
    expect(res.response[0].players[0]).toHaveProperty('position');
  });

  it('fetchPlayerSeasons returns year numbers', async () => {
    const res = await endpoints.fetchPlayerSeasons({ player: 50001 });
    expect(res.response).toContain(2025);
  });

  it('fetchTopScorers returns top scorer list', async () => {
    const res = await endpoints.fetchTopScorers({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].player).toHaveProperty('name');
    expect(res.response[0].statistics[0].goals.total).toBeGreaterThan(0);
  });

  it('fetchTopAssists returns top assist list', async () => {
    const res = await endpoints.fetchTopAssists({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].statistics[0].goals.assists).toBeGreaterThan(0);
  });

  it('fetchTopYellowCards returns top yellow card list', async () => {
    const res = await endpoints.fetchTopYellowCards({
      league: LEAGUE_IDS.BOTOLA_PRO_1,
      season: 2025,
    });
    expect(res.response[0].statistics[0].cards.yellow).toBeGreaterThan(0);
  });

  it('fetchTopRedCards returns top red card list', async () => {
    const res = await endpoints.fetchTopRedCards({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].statistics[0].cards.red).toBeGreaterThan(0);
  });

  // --- Coaches ---
  it('fetchCoaches returns coach data', async () => {
    const res = await endpoints.fetchCoaches({ team: TEAM_IDS.WYDAD });
    expect(res.response[0]).toHaveProperty('id');
    expect(res.response[0]).toHaveProperty('career');
  });

  // --- Injuries ---
  it('fetchInjuries returns injury list', async () => {
    const res = await endpoints.fetchInjuries({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(res.response[0].player).toHaveProperty('id');
    expect(res.response[0].player).toHaveProperty('reason');
  });

  // --- Transfers ---
  it('fetchTransfers returns transfer history', async () => {
    const res = await endpoints.fetchTransfers({ player: 50001 });
    expect(res.response[0]).toHaveProperty('transfers');
    expect(res.response[0].transfers[0].teams).toHaveProperty('in');
  });

  // --- Trophies ---
  it('fetchTrophies returns trophy list', async () => {
    const res = await endpoints.fetchTrophies({ player: 50001 });
    expect(res.response[0]).toHaveProperty('league');
    expect(res.response[0]).toHaveProperty('place');
  });

  // --- Sidelined ---
  it('fetchSidelined returns sidelined entries', async () => {
    const res = await endpoints.fetchSidelined({ player: 50001 });
    expect(res.response[0]).toHaveProperty('type');
    expect(res.response[0]).toHaveProperty('start');
  });

  // --- Predictions ---
  it('fetchPredictions returns prediction data', async () => {
    const res = await endpoints.fetchPredictions({ fixture: 1050001 });
    expect(res.response[0].predictions).toHaveProperty('winner');
    expect(res.response[0].predictions).toHaveProperty('percent');
    expect(res.response[0]).toHaveProperty('comparison');
  });
});
