/**
 * Backfill fixture details (events, lineups, statistics, player stats)
 * for all finished fixtures missing details_synced_at.
 *
 * Run:
 *   pnpm tsx scripts/backfill-fixture-details.ts                    # default batch of 50
 *   pnpm tsx scripts/backfill-fixture-details.ts --batch 100        # 100 per batch
 *   pnpm tsx scripts/backfill-fixture-details.ts --limit 500        # cap at 500 total
 *   pnpm tsx scripts/backfill-fixture-details.ts --all              # process ALL unsynced
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, sql, asc, inArray } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncFixtureDetails } from '@/lib/ingestion/fixture-details';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const provider = getDataProvider();

const batchArg = process.argv.find((_, i, a) => a[i - 1] === '--batch');
const batchSize = batchArg ? Number(batchArg) : 50;

const limitArg = process.argv.find((_, i, a) => a[i - 1] === '--limit');
const processAll = process.argv.includes('--all');
const maxTotal = processAll ? Infinity : limitArg ? Number(limitArg) : 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string) {
  console.log(`[backfill-fixture-details] ${new Date().toISOString()} ${msg}`);
}

async function getUnsyncedFixtures(limit: number): Promise<number[]> {
  // Include stale NS fixtures (kickoff_at in the past) alongside finished codes
  const rows = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .where(
      and(
        sql`${schema.fixtures.detailsSyncedAt} IS NULL`,
        sql`(${schema.fixtures.statusCode} IN ('FT', 'AET', 'PEN', 'WO', 'AWD') OR (${schema.fixtures.statusCode} = 'NS' AND ${schema.fixtures.kickoffAt} < now()))`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(limit);

  return rows.map((r) => r.id);
}

async function main() {
  log(`Batch size: ${batchSize}, Max total: ${maxTotal === Infinity ? 'ALL' : maxTotal}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }

  let totalProcessed = 0;
  let totalEvents = 0;
  let totalLineups = 0;
  let totalStats = 0;
  let totalPlayerStats = 0;
  let totalErrors = 0;
  const t0 = Date.now();

  while (totalProcessed < maxTotal) {
    const remaining = maxTotal - totalProcessed;
    const fetchSize = Math.min(batchSize, remaining === Infinity ? batchSize : remaining);
    const fixtureIds = await getUnsyncedFixtures(fetchSize);

    if (fixtureIds.length === 0) {
      log('No more unsynced fixtures. Done.');
      break;
    }

    log(`Batch: ${fixtureIds.length} fixtures (${totalProcessed} processed so far)`);

    for (const fid of fixtureIds) {
      try {
        const result = await syncFixtureDetails(provider, db, fid);
        totalEvents += result.events;
        totalLineups += result.lineups;
        totalStats += result.statistics;
        totalPlayerStats += result.playerStats;
        totalProcessed++;

        if (totalProcessed % 25 === 0) {
          const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
          log(
            `  Progress: ${totalProcessed} fixtures, ${totalEvents} events, ${totalLineups} lineups, ${totalPlayerStats} player stats (${elapsed}s)`,
          );
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] fixture ${fid}: ${msg}`);
        totalErrors++;
      }
      await sleep(250); // 4 API calls per fixture, be gentle
    }
  }

  const elapsed = ((Date.now() - t0) / 1000 / 60).toFixed(1);
  log('=== COMPLETE ===');
  log(`Fixtures processed: ${totalProcessed}`);
  log(`Events: ${totalEvents}`);
  log(`Lineups: ${totalLineups}`);
  log(`Match stats: ${totalStats}`);
  log(`Player stats: ${totalPlayerStats}`);
  log(`Errors: ${totalErrors}`);
  log(`Duration: ${elapsed} minutes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
