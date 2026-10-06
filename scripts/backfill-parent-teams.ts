/**
 * Phase 16 · Task G (#5) — link club reserve/youth/women teams to their senior parent club.
 *
 * Target: club teams (is_national = false) that are women or an age group (U15–U23). Parent = a
 * senior club (is_national = false, is_women = false, no age token) whose base name matches, same
 * country_code. Match is heuristic (name-based), so dry-run first and review the rate — unmatched
 * teams simply keep no parent (and keep their current logo).
 *
 * National youth sides are NOT touched: they have no club parent and group by country_code.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-parent-teams.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-parent-teams.ts --apply   # set parent_team_id
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const AGE = /\s*U-?\d{1,2}\b/i;

/** Strip age group + women's marker (W/(W)/Women/(F)/F) → the senior club base name. */
function baseName(n: string): string {
  return (n || '')
    .replace(AGE, ' ')
    .replace(/\s+\(?Women\)?\s*$/i, ' ')
    .replace(/\s+\(?W\)?\s*$/i, ' ')
    .replace(/\s+\(?F\)?\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const key = (cc: string | null, name: string) => `${cc ?? ''}::${baseName(name).toLowerCase()}`;

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  const all = (await q(
    `SELECT id, name->>'en' AS en, country_code, coalesce(is_national,false) AS is_national,
            coalesce(is_women,false) AS is_women, (name->>'en' ~ 'U-?[0-9]{1,2}') AS is_youth
       FROM teams`,
  )) as {
    id: number;
    en: string;
    country_code: string | null;
    is_national: boolean;
    is_women: boolean;
    is_youth: boolean;
  }[];

  // Senior clubs: real parents. Keyed by country_code + base name.
  const seniors = new Map<string, { id: number; en: string }>();
  for (const t of all) {
    if (t.is_national || t.is_women || t.is_youth) continue;
    seniors.set(key(t.country_code, t.en), { id: t.id, en: t.en });
  }

  const matched: { id: number; en: string; parentId: number; parentEn: string }[] = [];
  const unmatched: string[] = [];
  for (const t of all) {
    if (t.is_national) continue; // national youth/women group by country, no club parent
    if (!t.is_women && !t.is_youth) continue; // only reserve/youth/women
    const parent = seniors.get(key(t.country_code, t.en));
    if (parent && parent.id !== t.id)
      matched.push({ id: t.id, en: t.en, parentId: parent.id, parentEn: parent.en });
    else unmatched.push(`${t.id} "${t.en}" [${t.country_code ?? '—'}]`);
  }

  const targets = matched.length + unmatched.length;
  console.log(`club women/youth teams: ${targets}`);
  console.log(
    `matched to a senior parent: ${matched.length}  |  unmatched (keep own logo): ${unmatched.length}`,
  );
  console.log(`match rate: ${targets ? Math.round((matched.length / targets) * 100) : 0}%`);
  console.log('\n--- matched sample ---');
  for (const m of matched.slice(0, 15))
    console.log(`  ${m.id} "${m.en}" -> ${m.parentId} "${m.parentEn}"`);
  console.log('\n--- unmatched sample ---');
  for (const u of unmatched.slice(0, 15)) console.log(`  ${u}`);

  if (apply) {
    for (const m of matched) {
      await q(`UPDATE teams SET parent_team_id = $1 WHERE id = $2`, [m.parentId, m.id]);
    }
    console.log(`\napplied: linked ${matched.length} teams to a parent`);
  } else {
    console.log('\n(dry-run — re-run with --apply)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
