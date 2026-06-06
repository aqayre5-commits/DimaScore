/**
 * Seed FIFA-official tri-codes for the 48 WC2026 national teams.
 *
 * API-Football's `teams.code` is often a non-standard 3-letter slice of the name
 * (South Africa → "SOU", Cape Verde → "CAP", Morocco → "MOR") and some even collide
 * (Australia/Austria both "AUS", Iran/Iraq both "IRA"). The compact team label and the
 * standings / hero render this code directly, so this overwrites it with the correct
 * FIFA tri-code per team.
 *
 * Idempotent — only rows whose code actually differs are written, each scoped by team
 * id (never a bulk unfiltered UPDATE). Safe to re-run.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-fifa-tricodes.ts [--dry-run]
 */
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const DRY = process.argv.includes('--dry-run');

// team id → FIFA-official tri-code, for the 48 WC2026 participants.
const FIFA_CODES: { id: number; name: string; code: string }[] = [
  { id: 1532, name: 'Algeria', code: 'ALG' },
  { id: 26, name: 'Argentina', code: 'ARG' },
  { id: 20, name: 'Australia', code: 'AUS' },
  { id: 775, name: 'Austria', code: 'AUT' },
  { id: 1, name: 'Belgium', code: 'BEL' },
  { id: 1113, name: 'Bosnia & Herzegovina', code: 'BIH' },
  { id: 6, name: 'Brazil', code: 'BRA' },
  { id: 5529, name: 'Canada', code: 'CAN' },
  { id: 1533, name: 'Cape Verde', code: 'CPV' },
  { id: 8, name: 'Colombia', code: 'COL' },
  { id: 1508, name: 'Congo DR', code: 'COD' },
  { id: 3, name: 'Croatia', code: 'CRO' },
  { id: 5530, name: 'Curaçao', code: 'CUW' },
  { id: 770, name: 'Czech Republic', code: 'CZE' },
  { id: 2382, name: 'Ecuador', code: 'ECU' },
  { id: 32, name: 'Egypt', code: 'EGY' },
  { id: 10, name: 'England', code: 'ENG' },
  { id: 2, name: 'France', code: 'FRA' },
  { id: 25, name: 'Germany', code: 'GER' },
  { id: 1504, name: 'Ghana', code: 'GHA' },
  { id: 2386, name: 'Haiti', code: 'HAI' },
  { id: 22, name: 'Iran', code: 'IRN' },
  { id: 1567, name: 'Iraq', code: 'IRQ' },
  { id: 1501, name: 'Ivory Coast', code: 'CIV' },
  { id: 12, name: 'Japan', code: 'JPN' },
  { id: 1548, name: 'Jordan', code: 'JOR' },
  { id: 16, name: 'Mexico', code: 'MEX' },
  { id: 31, name: 'Morocco', code: 'MAR' },
  { id: 1118, name: 'Netherlands', code: 'NED' },
  { id: 4673, name: 'New Zealand', code: 'NZL' },
  { id: 1090, name: 'Norway', code: 'NOR' },
  { id: 11, name: 'Panama', code: 'PAN' },
  { id: 2380, name: 'Paraguay', code: 'PAR' },
  { id: 27, name: 'Portugal', code: 'POR' },
  { id: 1569, name: 'Qatar', code: 'QAT' },
  { id: 23, name: 'Saudi Arabia', code: 'KSA' },
  { id: 1108, name: 'Scotland', code: 'SCO' },
  { id: 13, name: 'Senegal', code: 'SEN' },
  { id: 1531, name: 'South Africa', code: 'RSA' },
  { id: 17, name: 'South Korea', code: 'KOR' },
  { id: 9, name: 'Spain', code: 'ESP' },
  { id: 5, name: 'Sweden', code: 'SWE' },
  { id: 15, name: 'Switzerland', code: 'SUI' },
  { id: 28, name: 'Tunisia', code: 'TUN' },
  { id: 777, name: 'Türkiye', code: 'TUR' },
  { id: 2384, name: 'USA', code: 'USA' },
  { id: 7, name: 'Uruguay', code: 'URU' },
  { id: 1568, name: 'Uzbekistan', code: 'UZB' },
];

async function main(): Promise<void> {
  console.log(`[fifa] checking ${FIFA_CODES.length} WC2026 teams${DRY ? ' (dry run)' : ''}`);
  let changed = 0;
  let missing = 0;

  for (const t of FIFA_CODES) {
    const [row] = await db
      .select({ code: schema.teams.code })
      .from(schema.teams)
      .where(eq(schema.teams.id, t.id));

    if (!row) {
      console.warn(`[fifa] team ${t.id} (${t.name}) not found — skipped`);
      missing++;
      continue;
    }
    if (row.code === t.code) continue;

    console.log(`[fifa] ${t.name} (${t.id}): ${row.code ?? 'null'} → ${t.code}`);
    if (!DRY) {
      await db.update(schema.teams).set({ code: t.code }).where(eq(schema.teams.id, t.id));
    }
    changed++;
  }

  console.log(
    `[fifa] done${DRY ? ' (dry run)' : ''} — ${changed} updated, ${FIFA_CODES.length - changed - missing} already correct, ${missing} missing`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[fifa] fatal:', err);
  process.exit(1);
});
