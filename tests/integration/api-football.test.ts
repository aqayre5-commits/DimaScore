import { describe, it, expect, vi } from 'vitest';
import { LEAGUE_IDS, TEAM_IDS, PLAYER_IDS } from '@/lib/constants/canonical-ids';

// Mock @upstash/redis — integration tests hit real API but not real Redis
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    set = vi.fn().mockResolvedValue('OK');
    get = vi.fn().mockResolvedValue(null);
  },
}));

const hasApiKey = !!process.env.API_FOOTBALL_KEY;

const { ApiFootballAdapter } = await import('@/lib/data/adapters/api-football/adapter');

describe.skipIf(!hasApiKey)('API-Football integration (real API)', { timeout: 30_000 }, () => {
  const adapter = new ApiFootballAdapter();

  it('getStatus returns valid account info', async () => {
    const status = await adapter.getStatus();
    expect(status.account).toHaveProperty('email');
    expect(status.subscription.active).toBe(true);
    expect(status.requests.limitDay).toBeGreaterThan(0);
  });

  it('getLeagues returns Botola Pro 1 with coverage', async () => {
    const leagues = await adapter.getLeagues({ id: LEAGUE_IDS.BOTOLA_PRO_1 });
    expect(leagues).toHaveLength(1);
    const botola = leagues[0];
    expect(botola.id).toBe(LEAGUE_IDS.BOTOLA_PRO_1);
    expect(botola.name).toMatch(/Botola/i);
    expect(botola.type).toBe('league');
    expect(botola.country.name).toBe('Morocco');
    expect(botola.seasons.length).toBeGreaterThan(0);

    const currentSeason = botola.seasons.find((s) => s.current);
    expect(currentSeason).toBeDefined();
    expect(currentSeason!.coverage).toHaveProperty('standings');
    expect(currentSeason!.coverage).toHaveProperty('topScorers');
    expect(currentSeason!.coverage.fixtures).toHaveProperty('statisticsFixtures');
  });

  it('getTeams returns Wydad AC', async () => {
    const teams = await adapter.getTeams({ id: TEAM_IDS.WYDAD });
    expect(teams.length).toBeGreaterThan(0);
    const wydad = teams[0];
    expect(wydad.id).toBe(TEAM_IDS.WYDAD);
    expect(wydad.name).toMatch(/Wydad/i);
  });

  it('getTeams returns Morocco national team', async () => {
    const teams = await adapter.getTeams({ id: TEAM_IDS.MOROCCO_MEN });
    expect(teams.length).toBeGreaterThan(0);
    const morocco = teams[0];
    expect(morocco.id).toBe(TEAM_IDS.MOROCCO_MEN);
    expect(morocco.name).toBe('Morocco');
    expect(morocco.national).toBe(true);
  });

  it('getPlayers returns Hakimi with Moroccan nationality', async () => {
    const players = await adapter.getPlayerProfiles({ player: PLAYER_IDS.HAKIMI });
    expect(players.length).toBeGreaterThan(0);
    const hakimi = players[0];
    expect(hakimi.id).toBe(PLAYER_IDS.HAKIMI);
    expect(hakimi.name).toMatch(/Hakimi/i);
    expect(hakimi.nationality).toBe('Morocco');
  });

  it('getStandings returns standings for Botola Pro 1', async () => {
    const leagues = await adapter.getLeagues({ id: LEAGUE_IDS.BOTOLA_PRO_1 });
    const currentSeason = leagues[0].seasons.find((s) => s.current);
    const standings = await adapter.getStandings({
      league: LEAGUE_IDS.BOTOLA_PRO_1,
      season: currentSeason!.year,
    });
    expect(standings.length).toBeGreaterThan(0);
    expect(standings[0].length).toBeGreaterThan(0);
    expect(standings[0][0]).toHaveProperty('rank');
    expect(standings[0][0]).toHaveProperty('points');
    expect(standings[0][0]).toHaveProperty('team');
    expect(standings[0][0].all).toHaveProperty('goalsFor');
    expect(standings[0][0].all).toHaveProperty('goalsAgainst');
  });
});
