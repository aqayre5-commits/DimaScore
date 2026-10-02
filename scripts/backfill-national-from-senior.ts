/**
 * Catch youth/women NATIONAL teams that the country-name pass (backfill-national-flags) missed due to
 * name variants (e.g. "Ivory Coast W" vs the countries table's "Côte d'Ivoire"). Rule: a youth/women
 * team is national if a SENIOR national team (is_national=true) exists with the same base name
 * (stripped of age/W) and the same country_code. Flags it is_national=true so it renders the flag.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-from-senior.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-from-senior.ts --apply
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const AGE = /\s*U-?(1[5-9]|2[0-3])\b/i;
const base = (n: string) =>
  n
    .replace(AGE, ' ')
    .replace(/\s*\(?W(omen)?\)?\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const seniors = new Set(
    (
      (await sql.query(
        `SELECT name->>'en' AS en, country_code FROM teams WHERE is_national = true AND country_code IS NOT NULL`,
      )) as { en: string; country_code: string }[]
    ).map((r) => `${(r.en || '').toLowerCase()}|${r.country_code}`),
  );
  const cand = (await sql.query(
    `SELECT id, slug, name->>'en' AS en, country_code, is_women FROM teams
     WHERE is_national = false AND country_code IS NOT NULL`,
  )) as { id: number; slug: string; en: string; country_code: string; is_women: boolean }[];

  const hits = cand.filter((t) => {
    const name = t.en || '';
    if (!AGE.test(name) && !t.is_women) return false;
    return seniors.has(`${base(name)}|${t.country_code}`);
  });

  console.log(
    `youth/women national teams missed before: ${hits.length}${apply ? '' : '  (dry-run)'}`,
  );
  hits.forEach((t) => console.log(`  ${t.slug}  "${t.en}" (${t.country_code})`));

  if (apply && hits.length) {
    await sql.query(`UPDATE teams SET is_national = true WHERE id = ANY($1)`, [
      hits.map((t) => t.id),
    ]);
    console.log(`\napplied: ${hits.length} teams`);
  } else if (!apply) {
    console.log('\n(dry-run — re-run with --apply)');
  }
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
