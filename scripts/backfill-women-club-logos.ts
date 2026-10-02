/**
 * Women's CLUB teams share their parent club's crest (per the "all layers share the club logo" rule).
 * For each logo-less women's club team (is_women, NOT national, logo_url null), find a parent — a
 * non-women team in the same country whose name matches the base name (stripped of the women's
 * suffix) and that has a REAL (non-placeholder) API-Football logo — and point the women's team's
 * logo_url at the parent's crest. Teams with no matchable parent keep the initials monogram.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-women-club-logos.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-women-club-logos.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const PLACEHOLDER = 29416;

async function bytes(id: number): Promise<number> {
  try {
    return (
      await (await fetch(`https://media.api-sports.io/football/teams/${id}.png`)).arrayBuffer()
    ).byteLength;
  } catch {
    return -1;
  }
}

function baseName(n: string): string {
  return n.replace(/\s*\(?W(omen)?\)?\s*$/i, '').trim();
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const womens = (await sql.query(
    `SELECT id, slug, name->>'en' AS en, country_code FROM teams
     WHERE is_women = true AND is_national = false AND logo_url IS NULL AND country_code IS NOT NULL`,
  )) as { id: number; slug: string; en: string; country_code: string }[];

  const updates: { id: number; slug: string; parentId: number; parentName: string }[] = [];
  for (const w of womens) {
    const base = baseName(w.en || '');
    if (!base) continue;
    const cands = (await sql.query(
      `SELECT id, name->>'en' AS en FROM teams
       WHERE country_code = $1 AND is_women = false AND is_national = false AND id <> $2
         AND name->>'en' ILIKE $3
       ORDER BY id LIMIT 8`,
      [w.country_code, w.id, `${base}%`],
    )) as { id: number; en: string }[];
    for (const c of cands) {
      if ((await bytes(Number(c.id))) !== PLACEHOLDER && (await bytes(Number(c.id))) > 0) {
        updates.push({ id: w.id, slug: w.slug, parentId: Number(c.id), parentName: c.en });
        break;
      }
    }
  }

  console.log(
    `women's club teams with a parent logo: ${updates.length} / ${womens.length}${apply ? '' : '  (dry-run)'}`,
  );
  for (const u of updates) console.log(`  ${u.slug} -> parent ${u.parentId} "${u.parentName}"`);

  if (apply) {
    for (const u of updates) {
      await sql.query(`UPDATE teams SET logo_url = $1 WHERE id = $2`, [
        `https://media.api-sports.io/football/teams/${u.parentId}.png`,
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
