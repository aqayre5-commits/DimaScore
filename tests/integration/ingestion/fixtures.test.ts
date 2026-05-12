import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedFixture } from '@/lib/data/types';
import { RANGE_FIXTURES, testDb, cleanTestData } from './_helpers';

const R = RANGE_FIXTURES;
const COUNTRY_CODE = `TEST${R.min}A`;
const COMP_ID = R.min + 1;
const TEAM_HOME = R.min + 10;
const TEAM_AWAY = R.min + 11;
const VENUE_ID = R.min + 20;
const FIXTURE_ID = R.min + 50;

function makeFixture(overrides: Partial<NormalizedFixture> = {}): NormalizedFixture {
  return {
    id: FIXTURE_ID,
    referee: 'Test Ref',
    date: '2026-06-13T22:00:00+00:00',
    timestamp: 1781539200,
    venue: { id: VENUE_ID, name: 'Test Arena', city: 'Test City' },
    status: { short: 'NS', long: 'Not Started', elapsed: null },
    league: {
      id: COMP_ID,
      name: 'Test League',
      logo: null,
      country: 'Testland',
      round: 'Group A - 1',
      season: 2026,
    },
    homeTeam: { id: TEAM_HOME, name: 'Home FC', logo: null, winner: null },
    awayTeam: { id: TEAM_AWAY, name: 'Away FC', logo: null, winner: null },
    goals: { home: null, away: null },
    score: {
      halftime: { home: null, away: null },
      fulltime: { home: null, away: null },
      extratime: { home: null, away: null },
      penalty: { home: null, away: null },
    },
    ...overrides,
  };
}

function mockProvider(fixtures: NormalizedFixture[]): DataProvider {
  return {
    getFixtures: async () => fixtures,
  } as unknown as DataProvider;
}

describe('syncFixtures (integration)', () => {
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
        slug: 'test-comp-fix',
        name: { en: 'Test' },
        type: 'League',
        countryCode: COUNTRY_CODE,
      })
      .onConflictDoNothing();
    await testDb
      .insert(schema.teams)
      .values([
        {
          id: TEAM_HOME,
          slug: 'home-fc-fix',
          name: { en: 'Home FC' },
          shortName: { en: 'HFC' },
          countryCode: COUNTRY_CODE,
        },
        {
          id: TEAM_AWAY,
          slug: 'away-fc-fix',
          name: { en: 'Away FC' },
          shortName: { en: 'AFC' },
          countryCode: COUNTRY_CODE,
        },
      ])
      .onConflictDoNothing();
  });

  afterEach(() => cleanTestData(testDb, R));

  it('inserts a fixture with venue side-effect', async () => {
    const provider = mockProvider([makeFixture()]);
    const stats = await syncFixtures(provider, testDb, { leagueId: COMP_ID, season: 2026 });
    expect(stats.updated).toBe(1);

    const venues = await testDb.select().from(schema.venues).where(eq(schema.venues.id, VENUE_ID));
    expect(venues).toHaveLength(1);
    expect(venues[0].name).toBe('Test Arena');

    const fixtures = await testDb
      .select()
      .from(schema.fixtures)
      .where(eq(schema.fixtures.id, FIXTURE_ID));
    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].competitionId).toBe(COMP_ID);
    expect(fixtures[0].seasonYear).toBe(2026);
    expect(fixtures[0].round).toBe('Group A - 1');
    expect(fixtures[0].roundNumber).toBe(1);
    expect(fixtures[0].statusCode).toBe('NS');
    expect(fixtures[0].homeTeamId).toBe(TEAM_HOME);
    expect(fixtures[0].awayTeamId).toBe(TEAM_AWAY);
  });

  it('upserts scores when fixture updates to FT', async () => {
    const provider1 = mockProvider([makeFixture()]);
    await syncFixtures(provider1, testDb, { leagueId: COMP_ID, season: 2026 });

    const provider2 = mockProvider([
      makeFixture({
        status: { short: 'FT', long: 'Match Finished', elapsed: 90 },
        goals: { home: 2, away: 1 },
        score: {
          halftime: { home: 1, away: 0 },
          fulltime: { home: 2, away: 1 },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null },
        },
      }),
    ]);
    await syncFixtures(provider2, testDb, { leagueId: COMP_ID, season: 2026 });

    const fixtures = await testDb
      .select()
      .from(schema.fixtures)
      .where(eq(schema.fixtures.id, FIXTURE_ID));
    expect(fixtures[0].statusCode).toBe('FT');
    expect(fixtures[0].homeScore).toBe(2);
    expect(fixtures[0].awayScore).toBe(1);
    expect(fixtures[0].homeScoreHt).toBe(1);
    expect(fixtures[0].awayScoreHt).toBe(0);
  });
});
