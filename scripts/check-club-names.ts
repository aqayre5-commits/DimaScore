/**
 * Check that every CLUB_NAMES id (src/lib/constants/team-names-i18n.ts) is the club its
 * Arabic/French name belongs to, by comparing the pinned English name with teams.name.en.
 *
 * Run (read-only):
 *   pnpm tsx scripts/check-club-names.ts             # exits 1 on any missing or mismatched id
 *   pnpm tsx scripts/check-club-names.ts --snapshot  # also rewrites the unit-test fixture
 *
 * Requires: .env.local with DATABASE_URL
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { CLUB_NAMES } from '@/lib/constants/team-names-i18n';

const FIXTURE = 'tests/unit/fixtures/moroccan-club-teams.json';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const ids = Object.keys(CLUB_NAMES).map(Number);
  const rows =
    (await sql`SELECT id, slug, name->>'en' AS en FROM teams WHERE id = ANY(${ids}::int[]) ORDER BY id`) as {
      id: number | string;
      slug: string;
      en: string;
    }[];
  const byId = new Map(rows.map((r) => [Number(r.id), r]));
  let bad = 0;
  for (const id of ids) {
    const row = byId.get(id);
    const want = CLUB_NAMES[id];
    const ok = row?.en === want.en;
    if (!ok) bad++;
    console.log(
      `${ok ? 'ok  ' : 'FAIL'} ${id}\t${row?.en ?? '(no row)'}\t→ fr ${want.fr ?? '(stored)'} | ar ${want.ar ?? '(stored)'}`,
    );
  }
  if (process.argv.includes('--snapshot')) {
    const teams = Object.fromEntries(rows.map((r) => [String(r.id), { slug: r.slug, en: r.en }]));
    const json = {
      _source: `teams rows (id, slug, name.en) read by scripts/check-club-names.ts on ${new Date().toISOString().slice(0, 10)}.`,
      teams,
    };
    writeFileSync(FIXTURE, JSON.stringify(json, null, 2) + '\n');
  }
  console.log(`${ids.length - bad}/${ids.length} ids match`);
  process.exit(bad ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
