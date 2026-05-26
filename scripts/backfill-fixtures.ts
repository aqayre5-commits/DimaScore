/**
 * Backfill fixtures — re-syncs all fixtures for every competition with a current season.
 * Updates statusCode, scores, and other match data from API-Football.
 *
 * Run: pnpm tsx scripts/backfill-fixtures.ts
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { syncStandings } from '@/lib/ingestion/standings';
import { getCurrentSeasons } from '@/lib/db/queries';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const provider = getDataProvider();

function log(msg: string) {
  console.log(`[backfill-fixtures] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  const t0 = Date.now();

  const currentSeasons = await getCurrentSeasons(db);
  log(`Found ${currentSeasons.length} competitions with a current season`);

  // 1. Re-sync fixtures
  log('Syncing fixtures...');
  for (const cs of currentSeasons) {
    const t = Date.now();
    const stats = await syncFixtures(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
    });
    log(
      `  Fixtures for competition ${cs.competitionId} (season ${cs.year}): ${stats.updated} upserted (${Date.now() - t}ms)`,
    );
  }

  // 2. Re-sync standings (results affect standings)
  log('Syncing standings...');
  const withStandings = currentSeasons.filter((cs) => cs.hasStandingsCoverage);
  log(`  ${withStandings.length} competitions have standings coverage`);
  for (const cs of withStandings) {
    const t = Date.now();
    const stats = await syncStandings(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
    });
    log(
      `  Standings for competition ${cs.competitionId} (season ${cs.year}): ${stats.updated} upserted (${Date.now() - t}ms)`,
    );
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`Backfill complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[backfill-fixtures] Fatal error:', err);
  process.exit(1);
});
