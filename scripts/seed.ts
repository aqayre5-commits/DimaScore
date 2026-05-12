/**
 * Full seed orchestrator — populates all 36 verified competitions.
 *
 * Run: pnpm seed
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 *
 * Sequence:
 *   1. syncCountries
 *   2. syncCompetitionsWithSeasons (populates competitions, seasons, coverage)
 *   3. For each competition with current season → syncTeams
 *   4. For each competition with current season → syncFixtures
 *   5. For each competition with current season + standings coverage → syncStandings
 *   6. For ALL teams in the teams table → syncSquad
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncCountries, syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { syncTeams } from '@/lib/ingestion/teams';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { syncStandings } from '@/lib/ingestion/standings';
import { syncSquad } from '@/lib/ingestion/squads';
import { getCurrentSeasons } from '@/lib/db/queries';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const provider = getDataProvider();

function log(msg: string) {
  console.log(`[seed] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  const t0 = Date.now();

  // 1. Countries
  log('Syncing countries...');
  const countryStats = await syncCountries(provider, db);
  log(`Countries: ${countryStats.updated} upserted`);

  // 2. Competitions + seasons + coverage
  log(`Syncing ${VERIFIED_COMPETITIONS.length} competitions...`);
  const compResult = await syncCompetitionsWithSeasons(provider, db, VERIFIED_COMPETITIONS);
  log(
    `Competitions: ${compResult.competitions.updated} upserted, ` +
      `Seasons: ${compResult.seasons.updated} upserted, ` +
      `Coverage: ${compResult.coverage.updated} upserted`,
  );

  // 3. Read current seasons from DB
  const currentSeasons = await getCurrentSeasons(db);
  log(`Found ${currentSeasons.length} competitions with a current season`);

  const skippedIds = VERIFIED_COMPETITIONS.filter(
    (vc) => !currentSeasons.some((cs) => cs.competitionId === vc.id),
  );
  for (const s of skippedIds) {
    log(
      `WARNING: competition ${s.id} (${s.slug}) has no current season — skipping teams/fixtures/standings`,
    );
  }

  // 4. Teams (per competition with current season)
  log('Syncing teams...');
  for (const cs of currentSeasons) {
    const t = Date.now();
    const stats = await syncTeams(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
      isWomen: cs.isWomen,
    });
    log(
      `  Teams for competition ${cs.competitionId} (season ${cs.year}): ${stats.updated} upserted (${Date.now() - t}ms)`,
    );
  }

  // 5. Fixtures (per competition with current season)
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

  // 6. Standings (per competition with current season + standings coverage)
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

  // 7. Squads — ALL teams in the teams table
  log('Syncing squads for all teams...');
  const allTeams = await db
    .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
    .from(schema.teams);
  log(`  ${allTeams.length} teams to sync squads for`);

  let squadCount = 0;
  for (const team of allTeams) {
    const t = Date.now();
    const stats = await syncSquad(provider, db, {
      teamId: team.id,
      isWomen: team.isWomen ?? false,
    });
    squadCount += stats.updated;
    if (stats.updated > 0) {
      log(`  Squad for team ${team.id}: ${stats.updated} players (${Date.now() - t}ms)`);
    }
  }
  log(`Squads complete: ${squadCount} total players upserted`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`Seed complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[seed] Fatal error:', err);
  process.exit(1);
});
