import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { syncSquad } from '@/lib/ingestion/squads';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedSquadPlayer } from '@/lib/data/types';
import { RANGE_SQUADS, testDb, cleanTestData } from './_helpers';

const R = RANGE_SQUADS;
const COUNTRY_CODE = `TEST${R.min}A`;
const TEAM_ID = R.min + 10;
const TEAM_ID_2 = R.min + 11;
const PLAYER_ID_1 = R.min + 100;
const PLAYER_ID_2 = R.min + 101;

function mockSquadPlayer(id: number, name: string): NormalizedSquadPlayer {
  return {
    id,
    name,
    age: 25,
    number: id % 100,
    position: 'Midfielder',
    photo: `https://img.io/${id}.png`,
  };
}

function mockProvider(players: NormalizedSquadPlayer[]): DataProvider {
  return {
    getPlayerSquads: async () => players,
  } as unknown as DataProvider;
}

describe('syncSquad (integration)', () => {
  beforeEach(async () => {
    await cleanTestData(testDb, R);
    await testDb
      .insert(schema.countries)
      .values({ code: COUNTRY_CODE, name: { en: 'Testland' } })
      .onConflictDoNothing();
    await testDb
      .insert(schema.teams)
      .values([
        {
          id: TEAM_ID,
          slug: 'test-team-sq',
          name: { en: 'Test Team' },
          shortName: { en: 'TST' },
          countryCode: COUNTRY_CODE,
        },
        {
          id: TEAM_ID_2,
          slug: 'new-team-sq',
          name: { en: 'New Team' },
          shortName: { en: 'NEW' },
          countryCode: COUNTRY_CODE,
        },
      ])
      .onConflictDoNothing();
  });

  afterEach(() => cleanTestData(testDb, R));

  it('inserts players from squad', async () => {
    const provider = mockProvider([
      mockSquadPlayer(PLAYER_ID_1, 'Player One'),
      mockSquadPlayer(PLAYER_ID_2, 'Player Two'),
    ]);

    const stats = await syncSquad(provider, testDb, { teamId: TEAM_ID, isWomen: false });
    expect(stats.updated).toBe(2);

    const players = await testDb
      .select()
      .from(schema.players)
      .where(eq(schema.players.currentTeamId, TEAM_ID));
    expect(players).toHaveLength(2);
    expect(players.map((p) => p.slug).sort()).toEqual(['player-one', 'player-two']);
  });

  it('upserts currentTeamId when player moves', async () => {
    const provider = mockProvider([mockSquadPlayer(PLAYER_ID_1, 'Player One')]);
    await syncSquad(provider, testDb, { teamId: TEAM_ID, isWomen: false });

    // Same player now in a different team's squad
    await syncSquad(provider, testDb, { teamId: TEAM_ID_2, isWomen: false });

    const player = await testDb
      .select()
      .from(schema.players)
      .where(eq(schema.players.id, PLAYER_ID_1));
    expect(player[0].currentTeamId).toBe(TEAM_ID_2);
  });
});
