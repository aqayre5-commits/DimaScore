/**
 * Backfill historical World Cup editions (audit P1-5).
 *
 * The edition selector only surfaces seasons that have fixtures, so older WC editions
 * (2018 sparse, 2014/2006 empty or absent) never appear. This pulls each target season
 * straight from the data provider in FK-safe order: ensure the seasons row, then
 * teams → fixtures → standings (fixtures and standings reference team ids). Idempotent —
 * every step upserts, so it's safe to re-run.
 *
 * NOTE: historical coverage depends on the API-Football plan. Seasons the plan does not
 * include simply return empty (reported as 0s here) — harmless. That's why seasons are
 * args-gated: test one first, then run the rest.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-wc-historical.ts [season...]
 *   e.g.  ... backfill-wc-historical.ts 2018   (test a single season first)
 *         ... backfill-wc-historical.ts        (default: 2018 2014 2010 2006)
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncTeams } from '@/lib/ingestion/teams';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { syncStandings } from '@/lib/ingestion/standings';

const WORLD_CUP_ID = 1;
const DEFAULT_SEASONS = [2018, 2014, 2010, 2006];

function parseSeasons(): number[] {
  const args = process.argv
    .slice(2)
    .filter((a) => /^\d{4}$/.test(a))
    .map(Number);
  return args.length > 0 ? args : DEFAULT_SEASONS;
}

async function countFor(season: number): Promise<{ fixtures: number; standings: number }> {
  const res = await db.execute(
    sql`SELECT
          (SELECT count(*) FROM fixtures
             WHERE competition_id = ${WORLD_CUP_ID} AND season_year = ${season}) AS fixtures,
          (SELECT count(*) FROM standings
             WHERE competition_id = ${WORLD_CUP_ID} AND season_year = ${season}) AS standings`,
  );
  const r = res.rows[0] as { fixtures: string; standings: string };
  return { fixtures: Number(r.fixtures), standings: Number(r.standings) };
}

async function main(): Promise<void> {
  const seasons = parseSeasons();
  const provider = getDataProvider();
  console.log(`[wc-backfill] seasons: ${seasons.join(', ')}`);

  for (const season of seasons) {
    console.log(`\n[wc-backfill] === ${season} ===`);

    // 1. Ensure the seasons row exists — FK target, and the selector keys on has-fixtures.
    await db
      .insert(schema.seasons)
      .values({ competitionId: WORLD_CUP_ID, year: season, isCurrent: false })
      .onConflictDoNothing();

    // 2. Teams first — fixtures and standings reference team ids (FK).
    const teamStats = await syncTeams(provider, db, { leagueId: WORLD_CUP_ID, season });
    console.log(`[wc-backfill] ${season} teams:`, teamStats);

    // 3. Fixtures (group + knockout, with venues).
    const fixtureStats = await syncFixtures(provider, db, { leagueId: WORLD_CUP_ID, season });
    console.log(`[wc-backfill] ${season} fixtures:`, fixtureStats);

    // 4. Standings (group tables).
    const standingStats = await syncStandings(provider, db, { leagueId: WORLD_CUP_ID, season });
    console.log(`[wc-backfill] ${season} standings:`, standingStats);

    const counts = await countFor(season);
    console.log(`[wc-backfill] ${season} now in DB:`, counts);
    if (counts.fixtures === 0) {
      console.warn(
        `[wc-backfill] ${season}: no fixtures returned — likely outside the API plan's coverage.`,
      );
    }
  }

  console.log('\n[wc-backfill] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[wc-backfill] fatal:', err);
  process.exit(1);
});
