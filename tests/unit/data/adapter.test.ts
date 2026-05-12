import { describe, it, expect, vi } from 'vitest';
import { LEAGUE_IDS, TEAM_IDS } from '@/lib/constants/canonical-ids';

// Mock @upstash/redis
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    set = vi.fn().mockResolvedValue('OK');
    get = vi.fn().mockResolvedValue(null);
  },
}));

const { ApiFootballAdapter } = await import('@/lib/data/adapters/api-football/adapter');

describe('ApiFootballAdapter normalization', () => {
  const adapter = new ApiFootballAdapter();

  it('getStatus normalizes status shape', async () => {
    const status = await adapter.getStatus();
    expect(status.account).toHaveProperty('firstname');
    expect(status.subscription).toHaveProperty('plan');
    expect(status.requests).toHaveProperty('current');
    expect(status.requests).toHaveProperty('limitDay');
  });

  it('getTimezones returns string array', async () => {
    const tzs = await adapter.getTimezones();
    expect(tzs).toContain('Africa/Casablanca');
  });

  it('getCountries normalizes country shape', async () => {
    const countries = await adapter.getCountries();
    expect(countries[0]).toHaveProperty('name');
    expect(countries[0]).toHaveProperty('code');
    expect(countries[0]).toHaveProperty('flag');
  });

  it('getLeagues normalizes Botola with coverage', async () => {
    const leagues = await adapter.getLeagues();
    const botola = leagues.find((l) => l.id === LEAGUE_IDS.BOTOLA_PRO_1);
    expect(botola).toBeDefined();
    expect(botola!.name).toBe('Botola Pro');
    expect(botola!.type).toBe('league');
    expect(botola!.country.name).toBe('Morocco');
    expect(botola!.seasons[0].coverage).toHaveProperty('standings');
    expect(botola!.seasons[0].coverage).toHaveProperty('topScorers');
    // Coverage uses camelCase (not snake_case)
    expect(botola!.seasons[0].coverage.fixtures).toHaveProperty('statisticsFixtures');
  });

  it('getVenues normalizes venue shape', async () => {
    const venues = await adapter.getVenues({ country: 'Morocco' });
    expect(venues[0]).toHaveProperty('id');
    expect(venues[0]).toHaveProperty('name');
    expect(venues[0]).toHaveProperty('capacity');
    expect(venues[0]).not.toHaveProperty('surface'); // stripped in normalization
  });

  it('getTeams normalizes team shape with nested venue', async () => {
    const teams = await adapter.getTeams({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(teams[0].id).toBe(TEAM_IDS.WYDAD);
    expect(teams[0].name).toBe('Wydad AC');
    expect(teams[0].venue).not.toBeNull();
    expect(teams[0].venue!.name).toBe('Complexe Sportif Mohammed V');
  });

  it('getTeamStatistics normalizes stat shape', async () => {
    const stats = await adapter.getTeamStatistics({
      team: TEAM_IDS.WYDAD,
      league: LEAGUE_IDS.BOTOLA_PRO_1,
      season: 2025,
    });
    expect(stats.teamId).toBe(TEAM_IDS.WYDAD);
    expect(stats.form).toBe('WWDLW');
    expect(stats.played).toHaveProperty('total');
    // snake_case → camelCase
    expect(stats).toHaveProperty('longestStreak');
    expect(stats.longestStreak).toHaveProperty('losses'); // not 'loses'
  });

  it('getFixtures normalizes fixture shape', async () => {
    const fixtures = await adapter.getFixtures({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(fixtures[0].id).toBe(1050001);
    expect(fixtures[0].status.short).toBe('FT');
    expect(fixtures[0].homeTeam.name).toBe('Wydad AC');
    expect(fixtures[0].awayTeam.name).toBe('Raja CA');
    expect(fixtures[0].goals.home).toBe(2);
  });

  it('getFixtureEvents normalizes event shape', async () => {
    const events = await adapter.getFixtureEvents({ fixture: 1050001 });
    expect(events[0].type).toBe('Goal');
    expect(events[0].player.name).toBe('A. Jabrane');
    expect(events[0].time.elapsed).toBe(23);
  });

  it('getFixtureLineups normalizes lineup shape', async () => {
    const lineups = await adapter.getFixtureLineups({ fixture: 1050001 });
    expect(lineups[0].formation).toBe('4-3-3');
    expect(lineups[0].startXI).toHaveLength(11);
    expect(lineups[0].startXI[0].player).toHaveProperty('grid');
  });

  it('getFixtureStatistics normalizes stat shape', async () => {
    const stats = await adapter.getFixtureStatistics({ fixture: 1050001 });
    expect(stats[0].team.id).toBe(TEAM_IDS.WYDAD);
    expect(stats[0].statistics[0]).toHaveProperty('type');
    expect(stats[0].statistics[0]).toHaveProperty('value');
  });

  it('getFixturePlayers normalizes player match stats', async () => {
    const result = await adapter.getFixturePlayers({ fixture: 1050001 });
    expect(result[0].team.id).toBe(TEAM_IDS.WYDAD);
    const player = result[0].players[0];
    expect(player.player.name).toBe('A. Jabrane');
    expect(player.statistics[0]).toHaveProperty('rating');
    expect(player.statistics[0]).toHaveProperty('captain');
    expect(player.statistics[0].cards).toHaveProperty('yellow');
    expect(player.statistics[0].cards).toHaveProperty('red');
  });

  it('getStandings normalizes standings shape', async () => {
    const standings = await adapter.getStandings({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(standings).toHaveLength(1); // one group
    expect(standings[0][0].rank).toBe(1);
    expect(standings[0][0].team.name).toBe('Wydad AC');
    expect(standings[0][0].all).toHaveProperty('goalsFor');
    expect(standings[0][0].all).toHaveProperty('goalsAgainst');
  });

  it('getPlayers normalizes player statistics', async () => {
    const players = await adapter.getPlayers({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(players[0].player.name).toBe('Ayoub Jabrane');
    expect(players[0].statistics[0].goals).toHaveProperty('total');
    expect(players[0].statistics[0].goals).toHaveProperty('assists');
  });

  it('getPlayerSquads returns squad players', async () => {
    const squad = await adapter.getPlayerSquads({ team: TEAM_IDS.WYDAD });
    expect(squad.length).toBeGreaterThan(0);
    expect(squad[0]).toHaveProperty('position');
  });

  it('getTopScorers normalizes top player shape', async () => {
    const scorers = await adapter.getTopScorers({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(scorers[0].player).toHaveProperty('name');
    expect(scorers[0].statistics[0]).toHaveProperty('goals');
  });

  it('getCoaches normalizes coach shape', async () => {
    const coaches = await adapter.getCoaches({ team: TEAM_IDS.WYDAD });
    expect(coaches[0].id).toBe(1001);
    expect(coaches[0].career).toHaveLength(1);
  });

  it('getInjuries normalizes injury shape', async () => {
    const injuries = await adapter.getInjuries({ league: LEAGUE_IDS.BOTOLA_PRO_1, season: 2025 });
    expect(injuries[0].type).toBe('Missing Fixture');
    expect(injuries[0].reason).toBe('Knee Injury');
  });

  it('getTransfers flattens transfer history', async () => {
    const transfers = await adapter.getTransfers({ player: 50001 });
    expect(transfers[0].player.name).toBe('A. Jabrane');
    expect(transfers[0].teams.from.name).toBe('Raja CA');
    expect(transfers[0].teams.to.name).toBe('Wydad AC');
  });

  it('getTrophies normalizes trophy shape', async () => {
    const trophies = await adapter.getTrophies({ player: 50001 });
    expect(trophies[0].place).toBe('Winner');
  });

  it('getSidelined normalizes sidelined shape', async () => {
    const sidelined = await adapter.getSidelined({ player: 50001 });
    expect(sidelined[0].type).toBe('Knee Injury');
  });

  it('getPredictions normalizes prediction shape (no odds)', async () => {
    const predictions = await adapter.getPredictions({ fixture: 1050001 });
    expect(predictions[0].winner.name).toBe('Wydad AC');
    expect(predictions[0].percent).toHaveProperty('home');
    expect(predictions[0]).toHaveProperty('comparison');
    expect(predictions[0]).not.toHaveProperty('odds');
  });
});
