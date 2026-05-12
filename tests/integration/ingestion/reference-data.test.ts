import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { syncCountries, syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedCountry, NormalizedLeague } from '@/lib/data/types';
import type { CompetitionMeta } from '@/lib/ingestion/types';
import { RANGE_REFERENCE, testDb, cleanTestData } from './_helpers';

const R = RANGE_REFERENCE;
const COUNTRY_CODE = `TEST${R.min}A`;
const COMP_ID = R.min + 1;

function mockCountry(code: string, name: string): NormalizedCountry {
  return { name, code, flag: `https://flags.io/${code.toLowerCase()}.svg` };
}

function mockLeague(id: number): NormalizedLeague {
  return {
    id,
    name: 'Test League',
    type: 'league',
    logo: 'https://logo.io/test.png',
    country: { name: 'Testland', code: COUNTRY_CODE, flag: null },
    seasons: [
      {
        year: 2026,
        start: '2026-01-01',
        end: '2026-12-31',
        current: true,
        coverage: {
          fixtures: {
            events: true,
            lineups: true,
            statisticsFixtures: true,
            statisticsPlayers: false,
          },
          standings: true,
          players: true,
          topScorers: true,
          topAssists: false,
          topCards: false,
          injuries: true,
          predictions: false,
        },
      },
    ],
  };
}

function mockProvider(countries: NormalizedCountry[], leagues: NormalizedLeague[]): DataProvider {
  return {
    getCountries: async () => countries,
    getLeagues: async ({ id }: { id?: number } = {}) => leagues.filter((l) => !id || l.id === id),
  } as unknown as DataProvider;
}

describe('syncCountries (integration)', () => {
  beforeEach(() => cleanTestData(testDb, R));
  afterEach(() => cleanTestData(testDb, R));

  it('inserts countries and upserts on re-run', async () => {
    const code1 = `TEST${R.min}B`;
    const code2 = `TEST${R.min}C`;
    const provider = mockProvider(
      [mockCountry(code1, 'Testland'), mockCountry(code2, 'Testria')],
      [],
    );

    await syncCountries(provider, testDb);

    const rows = await testDb
      .select()
      .from(schema.countries)
      .where(eq(schema.countries.code, code1));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toEqual({ en: 'Testland' });

    // Re-run with updated name
    const updatedProvider = mockProvider([mockCountry(code1, 'Testland Updated')], []);
    await syncCountries(updatedProvider, testDb);

    const updated = await testDb
      .select()
      .from(schema.countries)
      .where(eq(schema.countries.code, code1));
    expect(updated[0].name).toEqual({ en: 'Testland Updated' });
  });
});

describe('syncCompetitionsWithSeasons (integration)', () => {
  beforeEach(async () => {
    await cleanTestData(testDb, R);
    await testDb
      .insert(schema.countries)
      .values({ code: COUNTRY_CODE, name: { en: 'Testland' } })
      .onConflictDoNothing();
  });

  afterEach(() => cleanTestData(testDb, R));

  it('creates competition, season, and coverage', async () => {
    const meta: CompetitionMeta = {
      id: COMP_ID,
      slug: 'test-league-ref',
      tier: 5,
      isWomen: false,
      isFeatured: false,
      isMoroccoFocus: false,
      displayPriority: 99,
    };

    const league = mockLeague(COMP_ID);
    const provider = mockProvider([], [league]);

    await syncCompetitionsWithSeasons(provider, testDb, [meta]);

    // Verify competition
    const comps = await testDb
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.id, COMP_ID));
    expect(comps).toHaveLength(1);
    expect(comps[0].slug).toBe('test-league-ref');
    expect(comps[0].tier).toBe(5);

    // Verify season
    const seasons = await testDb
      .select()
      .from(schema.seasons)
      .where(eq(schema.seasons.competitionId, COMP_ID));
    expect(seasons).toHaveLength(1);
    expect(seasons[0].year).toBe(2026);
    expect(seasons[0].isCurrent).toBe(true);

    // Verify coverage
    const cov = await testDb
      .select()
      .from(schema.leagueCoverage)
      .where(eq(schema.leagueCoverage.leagueId, COMP_ID));
    expect(cov).toHaveLength(1);
    expect(cov[0].events).toBe(true);
    expect(cov[0].statisticsPlayers).toBe(false);
    expect(cov[0].standings).toBe(true);
  });
});
