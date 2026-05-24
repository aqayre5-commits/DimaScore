/**
 * Backfill French and Arabic team names for club teams across 6 tracked leagues.
 *
 * Run:
 *   pnpm tsx scripts/backfill-club-team-names.ts          # dry-run (default)
 *   pnpm tsx scripts/backfill-club-team-names.ts --apply   # apply changes
 *
 * Requires: .env.local with DATABASE_URL
 *
 * Reads teams from DB, matches by team ID against CLUB_TEAM_NAMES lookup.
 * Merges { fr, ar } into teams.name jsonb (preserves existing en key).
 * Also sets shortName { en, fr, ar } from lookup.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { CLUB_TEAM_NAMES } from '@/lib/constants/club-team-names';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const dryRun = !process.argv.includes('--apply');

async function main() {
  console.log(`[backfill-clubs] Mode: ${dryRun ? 'DRY-RUN (no writes)' : 'APPLY'}`);
  console.log(`[backfill-clubs] Lookup has ${Object.keys(CLUB_TEAM_NAMES).length} entries`);

  const lookupIds = Object.keys(CLUB_TEAM_NAMES).map(Number);

  // Fetch all teams that match our lookup IDs
  const teams = await db
    .select({
      id: schema.teams.id,
      code: schema.teams.code,
      name: schema.teams.name,
      shortName: schema.teams.shortName,
    })
    .from(schema.teams);

  console.log(`[backfill-clubs] Total teams in DB: ${teams.length}`);

  let matched = 0;
  let skipped = 0;
  let updated = 0;
  let alreadyDone = 0;

  for (const team of teams) {
    const lookup = CLUB_TEAM_NAMES[team.id];
    if (!lookup) {
      skipped++;
      continue;
    }

    matched++;

    const existingName = team.name as Record<string, string>;
    const existingShort = team.shortName as Record<string, string>;

    // Check if already populated with correct values
    if (
      existingName.fr === lookup.fr &&
      existingName.ar === lookup.ar &&
      existingShort.en === lookup.enShort &&
      existingShort.fr === (lookup.frShort ?? lookup.fr) &&
      existingShort.ar === (lookup.arShort ?? lookup.ar)
    ) {
      alreadyDone++;
      continue;
    }

    const newName: Record<string, string> = {
      ...existingName,
      fr: lookup.fr,
      ar: lookup.ar,
    };

    const newShort: Record<string, string> = {
      ...existingShort,
      en: lookup.enShort,
      fr: lookup.frShort ?? lookup.fr,
      ar: lookup.arShort ?? lookup.ar,
    };

    console.log(
      `  [${dryRun ? 'would update' : 'updating'}] ${team.code ?? '??'} (id=${team.id})` +
        `  name.en="${existingName.en}" → +fr="${lookup.fr}" +ar="${lookup.ar}"` +
        `  short.en="${existingShort.en}" → "${lookup.enShort}"`,
    );

    if (!dryRun) {
      await db
        .update(schema.teams)
        .set({ name: newName, shortName: newShort })
        .where(eq(schema.teams.id, team.id));
    }

    updated++;
  }

  console.log(`\n[backfill-clubs] Summary:`);
  console.log(`  Teams in DB: ${teams.length}`);
  console.log(`  Matched lookup: ${matched}`);
  console.log(`  Already up-to-date: ${alreadyDone}`);
  console.log(`  Not in lookup: ${skipped}`);
  console.log(`  ${dryRun ? 'Would update' : 'Updated'}: ${updated}`);

  if (matched < lookupIds.length) {
    const foundIds = new Set(teams.map((t) => t.id));
    const missing = lookupIds.filter((id) => !foundIds.has(id));
    console.log(`\n  WARNING: ${missing.length} lookup IDs not found in DB: ${missing.join(', ')}`);
  }

  if (dryRun && updated > 0) {
    console.log(`\nRe-run with --apply to commit changes.`);
  }
}

main().catch((err) => {
  console.error('[backfill-clubs] Fatal error:', err);
  process.exit(1);
});
