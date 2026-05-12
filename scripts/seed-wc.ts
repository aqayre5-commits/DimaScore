/**
 * WC-only fast seed variant — Tier 1 competitions only.
 *
 * Run: pnpm seed:wc
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
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

const TIER_1 = VERIFIED_COMPETITIONS.filter((c) => c.tier === 1);

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });
const provider = getDataProvider();

function log(msg: string) {
  console.log(`[seed-wc] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  const t0 = Date.now();

  log('Syncing countries...');
  const countryStats = await syncCountries(provider, db);
  log(`Countries: ${countryStats.updated} upserted`);

  log(`Syncing ${TIER_1.length} Tier 1 competitions...`);
  const compResult = await syncCompetitionsWithSeasons(provider, db, TIER_1);
  log(
    `Competitions: ${compResult.competitions.updated} upserted, ` +
      `Seasons: ${compResult.seasons.updated} upserted, ` +
      `Coverage: ${compResult.coverage.updated} upserted`,
  );

  const currentSeasons = await getCurrentSeasons(db);
  const tier1Seasons = currentSeasons.filter((cs) => TIER_1.some((t) => t.id === cs.competitionId));
  log(`Found ${tier1Seasons.length} Tier 1 competitions with a current season`);

  const skipped = TIER_1.filter((vc) => !tier1Seasons.some((cs) => cs.competitionId === vc.id));
  for (const s of skipped) {
    log(`WARNING: competition ${s.id} (${s.slug}) has no current season — skipping`);
  }

  log('Syncing teams...');
  for (const cs of tier1Seasons) {
    const stats = await syncTeams(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
      isWomen: cs.isWomen,
    });
    log(`  Teams for competition ${cs.competitionId}: ${stats.updated} upserted`);
  }

  log('Syncing fixtures...');
  for (const cs of tier1Seasons) {
    const stats = await syncFixtures(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
    });
    log(`  Fixtures for competition ${cs.competitionId}: ${stats.updated} upserted`);
  }

  log('Syncing standings...');
  const withStandings = tier1Seasons.filter((cs) => cs.hasStandingsCoverage);
  for (const cs of withStandings) {
    const stats = await syncStandings(provider, db, {
      leagueId: cs.competitionId,
      season: cs.year,
    });
    log(`  Standings for competition ${cs.competitionId}: ${stats.updated} upserted`);
  }

  // Squads for all teams that were seeded by Tier 1 competitions
  log('Syncing squads for all teams in DB...');
  const allTeams = await db
    .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
    .from(schema.teams);
  log(`  ${allTeams.length} teams to sync squads for`);

  let squadCount = 0;
  for (const team of allTeams) {
    const stats = await syncSquad(provider, db, {
      teamId: team.id,
      isWomen: team.isWomen ?? false,
    });
    squadCount += stats.updated;
  }
  log(`Squads complete: ${squadCount} total players upserted`);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log(`WC seed complete in ${elapsed}s`);
}

main().catch((err) => {
  console.error('[seed-wc] Fatal error:', err);
  process.exit(1);
});
