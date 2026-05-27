/**
 * Catch-up script for stale fixtures.
 *
 * Finds fixtures in DB with status NS/1H/HT/2H whose kickoff has passed,
 * queries API-Football for their current state, and updates the DB.
 *
 * Usage: pnpm tsx scripts/catchup-stale-fixtures.ts [--dry-run]
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';

const DRY_RUN = process.argv.includes('--dry-run');
const STALE_CODES = ['NS', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];

async function main() {
  console.log(`[catchup] ${DRY_RUN ? 'DRY RUN — no DB writes' : 'LIVE — will update DB'}`);

  // 1. Find stale fixtures (status still in-progress/NS but kickoff in the past)
  const staleRows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      competitionId: schema.fixtures.competitionId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
    })
    .from(schema.fixtures)
    .where(
      sql`${schema.fixtures.statusCode} IN (${sql.join(
        STALE_CODES.map((c) => sql`${c}`),
        sql`, `,
      )})
          AND ${schema.fixtures.kickoffAt} < NOW()`,
    );

  if (staleRows.length === 0) {
    console.log('[catchup] No stale fixtures found. All up to date.');
    return;
  }

  console.log(`[catchup] Found ${staleRows.length} stale fixtures`);

  // 2. Query API-Football by individual fixture ID (most reliable)
  const provider = getDataProvider();
  const BATCH_SIZE = 20; // API supports ?ids=id1-id2-... up to 20
  const ids = staleRows.map((r) => r.id);
  const staleMap = new Map(staleRows.map((r) => [r.id, r]));

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let apiCalls = 0;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const fixtures = await provider.getFixtures({ ids: batch });
    apiCalls++;
    console.log(
      `[catchup] Batch ${Math.floor(i / BATCH_SIZE) + 1}: queried ${batch.length} IDs, API returned ${fixtures.length}`,
    );

    for (const f of fixtures) {
      const stale = staleMap.get(f.id);
      if (!stale) continue;

      // Check if status actually changed
      if (
        stale.statusCode === f.status.short &&
        stale.homeScore === f.goals.home &&
        stale.awayScore === f.goals.away
      ) {
        skipped++;
        staleMap.delete(f.id);
        continue;
      }

      console.log(
        `  [update] fixture=${f.id} ${stale.statusCode}→${f.status.short} score=${f.goals.home ?? '?'}-${f.goals.away ?? '?'} (was ${stale.homeScore ?? '?'}-${stale.awayScore ?? '?'})`,
      );

      if (!DRY_RUN) {
        const row = mapFixtureToInsert(f);
        await db
          .insert(schema.fixtures)
          .values(row)
          .onConflictDoUpdate({
            target: schema.fixtures.id,
            set: {
              statusCode: row.statusCode,
              minute: row.minute,
              homeScore: row.homeScore,
              awayScore: row.awayScore,
              homeScoreHt: row.homeScoreHt,
              awayScoreHt: row.awayScoreHt,
              homeScoreFt: row.homeScoreFt,
              awayScoreFt: row.awayScoreFt,
              homeScoreEt: row.homeScoreEt,
              awayScoreEt: row.awayScoreEt,
              homeScorePen: row.homeScorePen,
              awayScorePen: row.awayScorePen,
              updatedAt: new Date(),
            },
          });
      }

      updated++;
      staleMap.delete(f.id);
    }
  }

  notFound = staleMap.size;

  console.log(`\n[catchup] Done.`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Skipped:   ${skipped} (no change)`);
  console.log(`  Not found: ${notFound} (not in API response for those dates)`);
  console.log(`  API calls: ${apiCalls}`);

  if (notFound > 0) {
    console.log(`\n[catchup] Fixtures not found in API (may need individual lookup):`);
    for (const [id, row] of staleMap) {
      console.log(
        `  id=${id} status=${row.statusCode} kickoff=${row.kickoffAt.toISOString()} comp=${row.competitionId}`,
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[catchup] Fatal error:', err);
    process.exit(1);
  });
