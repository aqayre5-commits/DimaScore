/**
 * Phase 16 · Task D (#3) — localized titles + clean slugs for women's teams.
 *
 * Women's teams arrive as "{X} W" (en only). This sets a localized, labelled title and regenerates
 * the stored slug to the clean "{x}-women-{id}" form (the route 301s the old "{x}-w-{id}" via its
 * id-anchored self-heal). Slugs stay id-anchored and English (the chosen "english single slug +
 * localized titles" path — no locale-specific URLs).
 *
 *   National women (country_code in map):  en "X Women" · fr "X (F)" · ar "X للسيدات"   (X localized)
 *   Club women (no AR source):             en "{base} Women" · fr "{base} (F)"           (ar → en fallback)
 *
 * Compact/match-row surfaces strip the marker via stripWomenSuffix; team page / search / favourites
 * / H2H render the full title, so the women's label shows there.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-women-team-names.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-women-team-names.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';
import { slugify } from '@/lib/ingestion/slug';
import { getCountryNames } from '@/lib/constants/country-names-i18n';

const apply = process.argv.includes('--apply');
const stripW = (s: string) => s.replace(/\s+\(?W\)?$/i, '').trim();

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  const rows = (await q(
    `SELECT id, slug, name, country_code, coalesce(is_national, false) AS is_national
       FROM teams WHERE is_women = true ORDER BY id`,
  )) as {
    id: number;
    slug: string;
    name: Record<string, string>;
    country_code: string | null;
    is_national: boolean;
  }[];

  let national = 0;
  let club = 0;
  const updates: { id: number; name: Record<string, string>; slug: string }[] = [];

  for (const t of rows) {
    const next = { ...t.name };
    const c = t.is_national && t.country_code ? getCountryNames(t.country_code) : null;

    if (c) {
      next.en = `${c.en} Women`;
      next.fr = `${c.fr} (F)`;
      next.ar = `${c.ar} للسيدات`;
      national++;
    } else {
      const base = stripW(t.name.en || '');
      next.en = `${base} Women`;
      next.fr = `${base} (F)`;
      club++;
    }

    const newSlug = `${slugify(next.en)}-${t.id}`;
    const nameChanged = JSON.stringify(next) !== JSON.stringify(t.name);
    if (nameChanged || newSlug !== t.slug) updates.push({ id: t.id, name: next, slug: newSlug });
  }

  console.log(`women teams: ${rows.length} (national ${national}, club ${club})`);
  console.log(`to update: ${updates.length}${apply ? '' : '  (dry-run)'}`);
  for (const u of updates.slice(0, apply ? 0 : 12)) {
    console.log(
      `  ${u.id}  "${u.name.en}" / "${u.name.fr}" / "${u.name.ar ?? '(en fallback)'}"  slug=${u.slug}`,
    );
  }

  if (apply) {
    for (const u of updates) {
      await q(`UPDATE teams SET name = $1::jsonb, slug = $2 WHERE id = $3`, [
        JSON.stringify(u.name),
        u.slug,
        u.id,
      ]);
    }
    console.log(`\napplied: ${updates.length} teams`);
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
