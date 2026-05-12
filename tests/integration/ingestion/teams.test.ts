import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { syncTeams } from '@/lib/ingestion/teams';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedTeam } from '@/lib/data/types';
import { RANGE_TEAMS, testDb, cleanTestData } from './_helpers';

const R = RANGE_TEAMS;
const COUNTRY_CODE = `TEST${R.min}A`;
const COMP_ID = R.min + 1;
const TEAM_ID_1 = R.min + 10;
const TEAM_ID_2 = R.min + 11;
const VENUE_ID_1 = R.min + 20;

function mockTeam(id: number, name: string, venueId: number | null): NormalizedTeam {
  return {
    id,
    name,
    code: name.slice(0, 3).toUpperCase(),
    logo: `https://logo.io/${id}.png`,
    country: COUNTRY_CODE,
    founded: 2000,
    national: false,
    venue: venueId
      ? {
          id: venueId,
          name: 'Team Stadium',
          city: 'Team City',
          country: 'Testland',
          capacity: 50000,
          image: null,
        }
      : null,
  };
}

function mockProvider(teams: NormalizedTeam[]): DataProvider {
  return {
    getTeams: async () => teams,
  } as unknown as DataProvider;
}

describe('syncTeams (integration)', () => {
  beforeEach(async () => {
    await cleanTestData(testDb, R);
    await testDb
      .insert(schema.countries)
      .values({ code: COUNTRY_CODE, name: { en: 'Testland' } })
      .onConflictDoNothing();
    await testDb
      .insert(schema.competitions)
      .values({
        id: COMP_ID,
        slug: 'test-comp-teams',
        name: { en: 'Test' },
        type: 'League',
        countryCode: COUNTRY_CODE,
      })
      .onConflictDoNothing();
  });

  afterEach(() => cleanTestData(testDb, R));

  it('inserts teams with venues', async () => {
    const provider = mockProvider([
      mockTeam(TEAM_ID_1, 'Test FC', VENUE_ID_1),
      mockTeam(TEAM_ID_2, 'Test United', null),
    ]);

    const stats = await syncTeams(provider, testDb, {
      leagueId: COMP_ID,
      season: 2026,
      isWomen: false,
    });
    expect(stats.updated).toBe(2);

    const venues = await testDb
      .select()
      .from(schema.venues)
      .where(eq(schema.venues.id, VENUE_ID_1));
    expect(venues).toHaveLength(1);
    expect(venues[0].name).toBe('Team Stadium');

    const teams = await testDb.select().from(schema.teams).where(eq(schema.teams.id, TEAM_ID_1));
    expect(teams).toHaveLength(1);
    expect(teams[0].slug).toBe(`test-fc-${TEAM_ID_1}`);
    expect(teams[0].venueId).toBe(VENUE_ID_1);
    expect(teams[0].isWomen).toBe(false);
  });

  it('upserts on re-run with changed data', async () => {
    const provider1 = mockProvider([mockTeam(TEAM_ID_1, 'Test FC', VENUE_ID_1)]);
    await syncTeams(provider1, testDb, { leagueId: COMP_ID, season: 2026, isWomen: false });

    const provider2 = mockProvider([mockTeam(TEAM_ID_1, 'Test FC Renamed', VENUE_ID_1)]);
    await syncTeams(provider2, testDb, { leagueId: COMP_ID, season: 2026, isWomen: false });

    const teams = await testDb.select().from(schema.teams).where(eq(schema.teams.id, TEAM_ID_1));
    expect(teams[0].name).toEqual({ en: 'Test FC Renamed' });
    expect(teams[0].slug).toBe(`test-fc-renamed-${TEAM_ID_1}`);
  });
});
