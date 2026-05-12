import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, gte, and, lt } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

/**
 * Sentinel ID sub-ranges for integration tests.
 * Each test file uses its own 100k range to avoid cross-file collisions
 * when Vitest runs files in parallel.
 *
 *   reference-data: 9_100_000 – 9_199_999
 *   teams:          9_200_000 – 9_299_999
 *   squads:         9_300_000 – 9_399_999
 *   fixtures:       9_400_000 – 9_499_999
 *   standings:      9_500_000 – 9_599_999
 *
 * Real API-Football IDs never reach this range (max observed ~500k for players).
 */
export const RANGE_REFERENCE = { min: 9_100_000, max: 9_200_000 };
export const RANGE_TEAMS = { min: 9_200_000, max: 9_300_000 };
export const RANGE_SQUADS = { min: 9_300_000, max: 9_400_000 };
export const RANGE_FIXTURES = { min: 9_400_000, max: 9_500_000 };
export const RANGE_STANDINGS = { min: 9_500_000, max: 9_600_000 };

const neonSql = neon(process.env.DATABASE_URL!);
export const testDb = drizzle(neonSql, { schema });

/**
 * Delete all test data for a specific ID range, in correct FK dependency order.
 * Leaf tables first, then parents.
 *
 * Tables with text PKs (countries) use a range-specific prefix: TEST_{rangeMin}.
 */
export async function cleanTestData(db: typeof testDb, range: { min: number; max: number }) {
  const countryPrefix = `TEST${range.min}%`;

  // Leaf tables first (some cascade from fixtures, but explicit is safer)
  await db
    .delete(schema.fixtureEvents)
    .where(
      and(
        gte(schema.fixtureEvents.fixtureId, range.min),
        lt(schema.fixtureEvents.fixtureId, range.max),
      ),
    );
  await db
    .delete(schema.fixtureLineups)
    .where(
      and(
        gte(schema.fixtureLineups.fixtureId, range.min),
        lt(schema.fixtureLineups.fixtureId, range.max),
      ),
    );
  await db
    .delete(schema.fixtureStatistics)
    .where(
      and(
        gte(schema.fixtureStatistics.fixtureId, range.min),
        lt(schema.fixtureStatistics.fixtureId, range.max),
      ),
    );
  await db
    .delete(schema.fixturePlayerStats)
    .where(
      and(
        gte(schema.fixturePlayerStats.fixtureId, range.min),
        lt(schema.fixturePlayerStats.fixtureId, range.max),
      ),
    );
  await db
    .delete(schema.predictions)
    .where(
      and(
        gte(schema.predictions.fixtureId, range.min),
        lt(schema.predictions.fixtureId, range.max),
      ),
    );
  await db
    .delete(schema.injuries)
    .where(and(gte(schema.injuries.id, range.min), lt(schema.injuries.id, range.max)));
  await db
    .delete(schema.transfers)
    .where(and(gte(schema.transfers.id, range.min), lt(schema.transfers.id, range.max)));
  await db
    .delete(schema.playerSeasonStats)
    .where(
      and(
        gte(schema.playerSeasonStats.playerId, range.min),
        lt(schema.playerSeasonStats.playerId, range.max),
      ),
    );
  await db
    .delete(schema.standings)
    .where(
      and(
        gte(schema.standings.competitionId, range.min),
        lt(schema.standings.competitionId, range.max),
      ),
    );

  // Mid-level
  await db
    .delete(schema.fixtures)
    .where(and(gte(schema.fixtures.id, range.min), lt(schema.fixtures.id, range.max)));
  await db
    .delete(schema.players)
    .where(and(gte(schema.players.id, range.min), lt(schema.players.id, range.max)));
  await db
    .delete(schema.seasons)
    .where(
      and(
        gte(schema.seasons.competitionId, range.min),
        lt(schema.seasons.competitionId, range.max),
      ),
    );
  await db
    .delete(schema.leagueCoverage)
    .where(
      and(
        gte(schema.leagueCoverage.leagueId, range.min),
        lt(schema.leagueCoverage.leagueId, range.max),
      ),
    );

  // Parent entities
  await db
    .delete(schema.teams)
    .where(and(gte(schema.teams.id, range.min), lt(schema.teams.id, range.max)));
  await db
    .delete(schema.competitions)
    .where(and(gte(schema.competitions.id, range.min), lt(schema.competitions.id, range.max)));
  await db
    .delete(schema.venues)
    .where(and(gte(schema.venues.id, range.min), lt(schema.venues.id, range.max)));

  // Root (text PK — use prefix matching)
  await db.delete(schema.countries).where(sql`${schema.countries.code} LIKE ${countryPrefix}`);
}
