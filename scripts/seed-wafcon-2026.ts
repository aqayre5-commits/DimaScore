/**
 * Populate WAFCON 2026 (competition_id=922, season=2026) from API-Football.
 *
 * Pulls teams, fixtures, and standings for the women's national tournament.
 * Idempotent — uses the standard upsert path.
 *
 * Run: pnpm tsx scripts/seed-wafcon-2026.ts
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncTeams } from '@/lib/ingestion/teams';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { syncStandings } from '@/lib/ingestion/standings';

const COMPETITION_ID = 922;
const SEASON = 2026;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const provider = getDataProvider();

function log(msg: string) {
  console.log(`[seed-wafcon-2026] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  const t0 = Date.now();

  log(`Syncing teams (league=${COMPETITION_ID}, season=${SEASON})...`);
  const teamStats = await syncTeams(provider, db, {
    leagueId: COMPETITION_ID,
    season: SEASON,
    isWomen: true,
  });
  log(`  Teams: ${teamStats.updated} upserted`);

  log(`Syncing fixtures (league=${COMPETITION_ID}, season=${SEASON})...`);
  const fixtureStats = await syncFixtures(provider, db, {
    leagueId: COMPETITION_ID,
    season: SEASON,
  });
  log(`  Fixtures: ${fixtureStats.updated} upserted`);

  log(`Syncing standings (league=${COMPETITION_ID}, season=${SEASON})...`);
  try {
    const standingStats = await syncStandings(provider, db, {
      leagueId: COMPETITION_ID,
      season: SEASON,
    });
    log(`  Standings: ${standingStats.updated} upserted`);
  } catch (err) {
    log(
      `  Standings sync failed (group draw may not be loaded upstream yet): ${(err as Error).message}`,
    );
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`WAFCON 2026 seed complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[seed-wafcon-2026] Fatal error:', err);
  process.exit(1);
});
