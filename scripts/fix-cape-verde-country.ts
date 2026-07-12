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
// 1533 = men's "Cape Verde Islands"; -7 = women's "Cape Verde W" (WAFCON placeholder).
const TEAM_IDS = [1533, -7];
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

  // 2. Point the Cape Verde teams (men's 1533 + women's -7) at it.
  for (const teamId of TEAM_IDS) {
    const [team] = await db
      .select({ countryCode: schema.teams.countryCode })
      .from(schema.teams)
      .where(eq(schema.teams.id, teamId));

    if (!team) {
      console.error(`[cv] team ${teamId} not found`);
      process.exit(1);
    }
    if (team.countryCode === CODE) {
      console.log(`[cv] team ${teamId} country_code already '${CODE}'`);
    } else {
      console.log(`[cv] team ${teamId} country_code: ${team.countryCode ?? 'null'} → ${CODE}`);
      if (!DRY) {
        await db.update(schema.teams).set({ countryCode: CODE }).where(eq(schema.teams.id, teamId));
      }
    }
  }

  console.log(`[cv] done${DRY ? ' (dry run)' : ''}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[cv] fatal:', err);
  process.exit(1);
});
