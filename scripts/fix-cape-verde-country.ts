/**
 * Fix Cape Verde's missing flag (audit P1-4).
 *
 * teams.country_code is an FK to countries.code, and there was no 'CV' row, so Cape
 * Verde (team 1533) had a null country_code and codeToFlag() emitted nothing — the only
 * WC2026 national without a flag. This inserts the missing ISO-2 country row, then links
 * the team to it. Idempotent — safe to re-run.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/fix-cape-verde-country.ts [--dry-run]
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const DRY = process.argv.includes('--dry-run');
const TEAM_ID = 1533;
const CODE = 'CV';

async function main(): Promise<void> {
  // 1. Ensure the countries row exists — it's the FK target for teams.country_code.
  const [country] = await db
    .select({ code: schema.countries.code })
    .from(schema.countries)
    .where(eq(schema.countries.code, CODE));

  if (country) {
    console.log(`[cv] countries '${CODE}' already present`);
  } else {
    console.log(`[cv] inserting countries row '${CODE}' (Cape Verde)`);
    if (!DRY) {
      await db
        .insert(schema.countries)
        .values({
          code: CODE,
          name: { en: 'Cape Verde' },
          flagUrl: 'https://media.api-sports.io/flags/cv.svg',
        })
        .onConflictDoNothing();
    }
  }

  // 2. Point Cape Verde (team 1533) at it.
  const [team] = await db
    .select({ countryCode: schema.teams.countryCode })
    .from(schema.teams)
    .where(eq(schema.teams.id, TEAM_ID));

  if (!team) {
    console.error(`[cv] team ${TEAM_ID} not found`);
    process.exit(1);
  }
  if (team.countryCode === CODE) {
    console.log(`[cv] team ${TEAM_ID} country_code already '${CODE}'`);
  } else {
    console.log(`[cv] team ${TEAM_ID} country_code: ${team.countryCode ?? 'null'} → ${CODE}`);
    if (!DRY) {
      await db.update(schema.teams).set({ countryCode: CODE }).where(eq(schema.teams.id, TEAM_ID));
    }
  }

  console.log(`[cv] done${DRY ? ' (dry run)' : ''}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[cv] fatal:', err);
  process.exit(1);
});
