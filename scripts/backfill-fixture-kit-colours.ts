/**
 * Re-fetch line-ups for fixtures whose saved kit palettes are missing or only
 * a neutral fallback, and write the resolved colours onto fixture_lineups.colors.
 *
 * Does not touch events, statistics, or the 15s score path. Intended for
 * recent fixtures after the colors column is migrated.
 *
 * Run (after DATABASE_URL and API_FOOTBALL_KEY are set in the environment):
 *   pnpm tsx scripts/backfill-fixture-kit-colours.ts
 *   pnpm tsx scripts/backfill-fixture-kit-colours.ts --days 21
 *   pnpm tsx scripts/backfill-fixture-kit-colours.ts --limit 200
 *   pnpm tsx scripts/backfill-fixture-kit-colours.ts --fixture 1635715
 *
 * Never run this against production from a laptop without an explicit ops plan;
 * this script is the repo-side operator tool, not a deploy step.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, desc, inArray, sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncLiveFixtureDetails } from '@/lib/ingestion/fixture-details';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const provider = getDataProvider();

const daysArg = process.argv.find((_, i, a) => a[i - 1] === '--days');
const days = daysArg ? Number(daysArg) : 14;
const limitArg = process.argv.find((_, i, a) => a[i - 1] === '--limit');
const limit = limitArg ? Number(limitArg) : 300;
const fixtureArg = process.argv.find((_, i, a) => a[i - 1] === '--fixture');
const onlyFixture = fixtureArg ? Number(fixtureArg) : null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string) {
  console.log(`[backfill-fixture-kit-colours] ${new Date().toISOString()} ${msg}`);
}

async function fixturesNeedingKits(): Promise<number[]> {
  if (onlyFixture != null) return [onlyFixture];
  const rows = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .where(
      and(
        sql`${schema.fixtures.kickoffAt} >= now() - (${days} * interval '1 day')`,
        sql`${schema.fixtures.kickoffAt} <= now() + interval '2 days'`,
        inArray(schema.fixtures.statusCode, [
          'NS',
          '1H',
          'HT',
          '2H',
          'ET',
          'BT',
          'P',
          'LIVE',
          'FT',
          'AET',
          'PEN',
        ]),
        sql`(
          SELECT COUNT(*) FILTER (
            WHERE ${schema.fixtureLineups.colors} IS NOT NULL
              AND ${schema.fixtureLineups.colors}->'player'->>'source' IS DISTINCT FROM 'neutral'
              AND ${schema.fixtureLineups.colors}->'goalkeeper'->>'source' IS DISTINCT FROM 'neutral'
          ) < 2
          FROM ${schema.fixtureLineups}
          WHERE ${schema.fixtureLineups.fixtureId} = ${schema.fixtures.id}
        )`,
        sql`EXISTS (
          SELECT 1 FROM ${schema.fixtureLineups}
          WHERE ${schema.fixtureLineups.fixtureId} = ${schema.fixtures.id}
        ) OR EXISTS (
          SELECT 1 FROM ${schema.leagueCoverage} c
          WHERE c.league_id = ${schema.fixtures.leagueId}
            AND c.season = ${schema.fixtures.season}
            AND c.lineups = true
        )`,
      ),
    )
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(limit);
  return rows.map((r) => r.id);
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const ids = await fixturesNeedingKits();
  log(`Days=${days} limit=${limit} fixtures=${ids.length}`);
  if (ids.length === 0) {
    log('Nothing to backfill.');
    return;
  }

  let ok = 0;
  let written = 0;
  let errors = 0;
  const t0 = Date.now();
  for (const id of ids) {
    try {
      const counts = await syncLiveFixtureDetails(provider, db, id, {
        events: false,
        lineups: true,
        statistics: false,
      });
      written += counts.lineups;
      ok++;
      if (ok % 25 === 0) {
        log(`  Progress: ${ok}/${ids.length} fixtures, ${written} lineup rows`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] fixture ${id}: ${msg}`);
      errors++;
    }
    await sleep(250);
  }
  const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
  log('=== COMPLETE ===');
  log(`Fixtures processed: ${ok}`);
  log(`Lineup rows written: ${written}`);
  log(`Errors: ${errors}`);
  log(`Duration: ${elapsed}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
