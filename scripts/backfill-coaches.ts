/**
 * Backfill coaches table from API-Football.
 *
 * Run:
 *   pnpm tsx scripts/backfill-coaches.ts          # dry-run (default)
 *   pnpm tsx scripts/backfill-coaches.ts --apply   # apply changes
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 *
 * Reads all distinct coach_id from fixture_lineups, fetches each from
 * API-Football /coachs?id={id}, inserts into coaches table.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql as dsql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { apiGet } from '@/lib/data/adapters/api-football/client';
import { buildCountryLookup } from '@/lib/ingestion/country-lookup';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');

interface ApiCoach {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  age: number | null;
  birth: { date: string | null; place: string | null; country: string | null } | null;
  nationality: string | null;
  height: string | null;
  weight: string | null;
  photo: string | null;
  team: { id: number | null; name: string | null; logo: string | null } | null;
  career: Array<{
    team: { id: number | null; name: string | null; logo: string | null };
    start: string | null;
    end: string | null;
  }>;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log(`[backfill-coaches] Mode: ${dryRun ? 'DRY-RUN (no writes)' : 'APPLY'}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('[backfill-coaches] API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // Get all distinct coach IDs from fixture_lineups
  const coachRows = await db
    .selectDistinct({ coachId: schema.fixtureLineups.coachId })
    .from(schema.fixtureLineups)
    .where(dsql`${schema.fixtureLineups.coachId} IS NOT NULL`);

  const coachIds = coachRows.map((r) => r.coachId).filter((id): id is number => id != null);

  console.log(`[backfill-coaches] Found ${coachIds.length} unique coach IDs in fixture_lineups`);

  // Check which coaches already exist
  const existingRows = await db.select({ id: schema.coaches.id }).from(schema.coaches);
  const existingIds = new Set(existingRows.map((r) => r.id));

  const toFetch = coachIds.filter((id) => !existingIds.has(id));
  console.log(
    `[backfill-coaches] ${existingIds.size} already in coaches table, ${toFetch.length} to fetch`,
  );

  if (toFetch.length === 0) {
    console.log('[backfill-coaches] Nothing to do.');
    return;
  }

  // Build country lookup for nationality resolution
  const countryLookup = await buildCountryLookup(db);

  // Build set of existing team IDs for FK validation
  const teamRows = await db.select({ id: schema.teams.id }).from(schema.teams);
  const teamIdSet = new Set(teamRows.map((r) => r.id));
  console.log(`[backfill-coaches] ${teamIdSet.size} teams in DB for FK validation`);

  let fetched = 0;
  let inserted = 0;
  let failed = 0;

  for (const coachId of toFetch) {
    try {
      const res = await apiGet<ApiCoach>('/coachs', { id: coachId });
      const coach = res.response?.[0];

      if (!coach) {
        console.log(`  [SKIP] Coach ${coachId}: not found in API`);
        failed++;
        continue;
      }

      const nationalityCode = coach.nationality
        ? (countryLookup.get(coach.nationality.toLowerCase()) ?? null)
        : null;

      const rawTeamId = coach.team?.id ?? null;
      // Only set currentTeamId if the team exists in our DB (FK constraint)
      const teamId = rawTeamId != null && teamIdSet.has(rawTeamId) ? rawTeamId : null;

      if (rawTeamId != null && teamId == null) {
        console.log(
          `  [WARN] Coach ${coachId}: team ${rawTeamId} not in DB, setting currentTeamId=null`,
        );
      }

      console.log(
        `  [${dryRun ? 'DRY' : 'INSERT'}] #${coachId} ${coach.name} (${coach.nationality ?? '?'} → ${nationalityCode ?? '?'})`,
      );

      if (!dryRun) {
        await db
          .insert(schema.coaches)
          .values({
            id: coach.id,
            name: coach.name,
            firstname: coach.firstname,
            lastname: coach.lastname,
            birthDate: coach.birth?.date ?? null,
            nationalityCode,
            photoUrl: coach.photo,
            currentTeamId: teamId,
            career: coach.career ?? null,
          })
          .onConflictDoNothing();
        inserted++;
      }

      fetched++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] Coach ${coachId}: ${msg}`);
      failed++;
    }

    // Rate limit: 300ms between calls
    await sleep(300);

    // Progress every 50
    if ((fetched + failed) % 50 === 0) {
      console.log(
        `  ... progress: ${fetched + failed}/${toFetch.length} (${inserted} inserted, ${failed} failed)`,
      );
    }
  }

  console.log(`\n[backfill-coaches] Done.`);
  console.log(`  Fetched: ${fetched}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  API calls: ${fetched + failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
