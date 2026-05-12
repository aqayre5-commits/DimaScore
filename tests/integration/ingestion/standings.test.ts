import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { syncStandings } from '@/lib/ingestion/standings';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedStandingEntry, NormalizedStandings } from '@/lib/data/types';
import { RANGE_STANDINGS, testDb, cleanTestData } from './_helpers';

const R = RANGE_STANDINGS;
const COUNTRY_CODE = `TEST${R.min}A`;
const COMP_ID = R.min + 1;
const TEAM_1 = R.min + 10;
const TEAM_2 = R.min + 11;

function makeEntry(teamId: number, rank: number): NormalizedStandingEntry {
  return {
    rank,
    team: { id: teamId, name: `Team ${teamId}`, logo: null },
    points: (4 - rank) * 3,
    goalsDiff: (4 - rank) * 2,
    group: 'Group A',
    description: rank === 1 ? 'Qualified' : null,
    form: 'WDL',
    all: { played: 3, win: 4 - rank, draw: 0, lose: rank - 1, goalsFor: 6, goalsAgainst: 2 },
    home: { played: 1, win: 1, draw: 0, lose: 0, goalsFor: 3, goalsAgainst: 1 },
    away: { played: 2, win: 3 - rank, draw: 0, lose: rank - 1, goalsFor: 3, goalsAgainst: 1 },
  };
}

function mockProvider(standings: NormalizedStandings): DataProvider {
  return {
    getStandings: async () => standings,
  } as unknown as DataProvider;
}

describe('syncStandings (integration)', () => {
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
        slug: 'test-comp-stand',
        name: { en: 'Test' },
        type: 'League',
        countryCode: COUNTRY_CODE,
      })
      .onConflictDoNothing();
    await testDb
      .insert(schema.teams)
      .values([
        {
          id: TEAM_1,
          slug: 'team-1-stand',
          name: { en: 'Team 1' },
          shortName: { en: 'T1' },
          countryCode: COUNTRY_CODE,
        },
        {
          id: TEAM_2,
          slug: 'team-2-stand',
          name: { en: 'Team 2' },
          shortName: { en: 'T2' },
          countryCode: COUNTRY_CODE,
        },
      ])
      .onConflictDoNothing();
  });

  afterEach(() => cleanTestData(testDb, R));

  it('inserts standings for a group', async () => {
    const provider = mockProvider([[makeEntry(TEAM_1, 1), makeEntry(TEAM_2, 2)]]);
    const stats = await syncStandings(provider, testDb, { leagueId: COMP_ID, season: 2026 });
    expect(stats.updated).toBe(2);

    const rows = await testDb
      .select()
      .from(schema.standings)
      .where(eq(schema.standings.competitionId, COMP_ID));
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.teamId === TEAM_1)?.rank).toBe(1);
    expect(rows.find((r) => r.teamId === TEAM_2)?.rank).toBe(2);
  });

  it('upserts rank changes on re-run', async () => {
    const provider1 = mockProvider([[makeEntry(TEAM_1, 1), makeEntry(TEAM_2, 2)]]);
    await syncStandings(provider1, testDb, { leagueId: COMP_ID, season: 2026 });

    const provider2 = mockProvider([[makeEntry(TEAM_1, 2), makeEntry(TEAM_2, 1)]]);
    await syncStandings(provider2, testDb, { leagueId: COMP_ID, season: 2026 });

    const rows = await testDb
      .select()
      .from(schema.standings)
      .where(eq(schema.standings.competitionId, COMP_ID));
    expect(rows.find((r) => r.teamId === TEAM_1)?.rank).toBe(2);
    expect(rows.find((r) => r.teamId === TEAM_2)?.rank).toBe(1);
  });
});
