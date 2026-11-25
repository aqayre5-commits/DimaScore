/**
 * 1. Catch youth/women NATIONAL teams that the country-name pass missed due to
 *    name variants (e.g. "Ivory Coast W" vs "Côte d'Ivoire"): flag is_national.
 * 2. Fill teams.national_category and teams.age_group for every national side
 *    so category pages can be linked as a crawlable family (migration 0008).
 *
 * Dry-run by default. Pass --apply to write.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-from-senior.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-from-senior.ts --apply
 */
import { neon } from '@neondatabase/serverless';
import {
  classifyNationalTeamName,
  nationalFamilyBaseName,
} from '../src/lib/competitions/national-category';

const apply = process.argv.includes('--apply');

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  const sql = neon(url);

  const seniors = new Set(
    (
      (await sql.query(
        `SELECT name->>'en' AS en, country_code FROM teams WHERE is_national = true AND country_code IS NOT NULL`,
      )) as { en: string; country_code: string }[]
    ).map((r) => `${nationalFamilyBaseName(r.en || '')}|${r.country_code}`),
  );
  const cand = (await sql.query(
    `SELECT id, slug, name->>'en' AS en, country_code, is_women FROM teams
     WHERE is_national = false AND country_code IS NOT NULL`,
  )) as { id: number; slug: string; en: string; country_code: string; is_women: boolean }[];

  const hits = cand.filter((t) => {
    const name = t.en || '';
    const classified = classifyNationalTeamName(name, t.is_women);
    if (classified.ageGroup == null && classified.category === 'men') return false;
    return seniors.has(`${nationalFamilyBaseName(name)}|${t.country_code}`);
  });

  console.log(
    `youth/women national teams missed before: ${hits.length}${apply ? '' : '  (dry-run)'}`,
  );
  hits.forEach((t) => console.log(`  ${t.slug}  "${t.en}" (${t.country_code})`));

  if (apply && hits.length) {
    await sql.query(`UPDATE teams SET is_national = true WHERE id = ANY($1)`, [
      hits.map((t) => t.id),
    ]);
    console.log(`\napplied is_national: ${hits.length} teams`);
  }

  const nationals = (await sql.query(
    `SELECT id, slug, name->>'en' AS en, is_women, national_category, age_group
     FROM teams WHERE is_national = true`,
  )) as {
    id: number;
    slug: string;
    en: string;
    is_women: boolean;
    national_category: string | null;
    age_group: number | null;
  }[];

  const updates = nationals
    .map((t) => {
      const { category, ageGroup } = classifyNationalTeamName(t.en || '', t.is_women);
      const changed = t.national_category !== category || t.age_group !== ageGroup;
      return { ...t, category, ageGroup, changed };
    })
    .filter((t) => t.changed);

  console.log(
    `\nnational_category/age_group to write: ${updates.length}${apply ? '' : '  (dry-run)'}`,
  );
  updates.slice(0, 40).forEach((t) => {
    console.log(`  ${t.slug}  "${t.en}" → ${t.category}${t.ageGroup != null ? ` U${t.ageGroup}` : ''}`);
  });
  if (updates.length > 40) console.log(`  … and ${updates.length - 40} more`);

  if (apply && updates.length) {
    for (const t of updates) {
      await sql.query(`UPDATE teams SET national_category = $2, age_group = $3 WHERE id = $1`, [
        t.id,
        t.category,
        t.ageGroup,
      ]);
    }
    console.log(`\napplied categories: ${updates.length} teams`);
  } else if (!apply) {
    console.log('\n(dry-run — re-run with --apply to write)');
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
