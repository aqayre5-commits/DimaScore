/**
 * Backfill French and Arabic team names for WC 2026 national teams.
 *
 * Run:
 *   pnpm tsx scripts/backfill-team-names.ts          # dry-run (default)
 *   pnpm tsx scripts/backfill-team-names.ts --apply   # apply changes
 *
 * Requires: .env.local with DATABASE_URL
 *
 * Reads teams from DB and matches by team ID against WC_2026_TEAM_NAMES lookup.
 * Merges { fr, ar } into teams.name jsonb (preserves existing en key).
 * Same for shortName if frShort/arShort are provided in the lookup.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { WC_2026_TEAM_NAMES } from '@/lib/constants/wc2026-team-names';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const dryRun = !process.argv.includes('--apply');

async function main() {
  console.log(`[backfill] Mode: ${dryRun ? 'DRY-RUN (no writes)' : 'APPLY'}`);
  console.log(`[backfill] Lookup has ${Object.keys(WC_2026_TEAM_NAMES).length} entries`);

  // Fetch all teams that are national teams
  const teams = await db
    .select({
      id: schema.teams.id,
      code: schema.teams.code,
      name: schema.teams.name,
      shortName: schema.teams.shortName,
      isNational: schema.teams.isNational,
    })
    .from(schema.teams)
    .where(eq(schema.teams.isNational, true));

  console.log(`[backfill] Found ${teams.length} national teams in DB`);

  let matched = 0;
  let skipped = 0;
  let updated = 0;

  for (const team of teams) {
    const lookup = WC_2026_TEAM_NAMES[team.id];
    if (!lookup) {
      skipped++;
      continue;
    }

    matched++;

    const existingName = team.name as Record<string, string>;
    const existingShort = team.shortName as Record<string, string>;

    // Check if already populated
    const enMatch = !lookup.en || existingName.en === lookup.en;
    if (existingName.fr === lookup.fr && existingName.ar === lookup.ar && enMatch) {
      console.log(`  [skip] ${team.code ?? '??'} (id=${team.id}) — already has fr+ar`);
      continue;
    }

    const newName = { ...existingName, fr: lookup.fr, ar: lookup.ar };
    if (lookup.en) newName.en = lookup.en;
    const newShort = { ...existingShort };
    if (lookup.frShort) newShort.fr = lookup.frShort;
    if (lookup.arShort) newShort.ar = lookup.arShort;
    // If no frShort/arShort, use full name as short name too
    if (!newShort.fr) newShort.fr = lookup.fr;
    if (!newShort.ar) newShort.ar = lookup.ar;

    console.log(
      `  [${dryRun ? 'would update' : 'updating'}] ${team.code ?? '??'} (id=${team.id})` +
        `  name.en="${existingName.en}" → +fr="${lookup.fr}" +ar="${lookup.ar}"`,
    );

    if (!dryRun) {
      await db
        .update(schema.teams)
        .set({ name: newName, shortName: newShort })
        .where(eq(schema.teams.id, team.id));
    }

    updated++;
  }

  console.log(`\n[backfill] Summary:`);
  console.log(`  National teams in DB: ${teams.length}`);
  console.log(`  Matched lookup: ${matched}`);
  console.log(`  Skipped (not in lookup): ${skipped}`);
  console.log(`  ${dryRun ? 'Would update' : 'Updated'}: ${updated}`);

  if (dryRun && updated > 0) {
    console.log(`\nRe-run with --apply to commit changes.`);
  }
}

main().catch((err) => {
  console.error('[backfill] Fatal error:', err);
  process.exit(1);
});
