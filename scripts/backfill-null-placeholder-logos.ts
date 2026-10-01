/**
 * Null the `logo_url` of teams whose API-Football logo is the 29,416-byte grey "image not available"
 * placeholder. With no real logo URL, the crest renderer (shared Flag component) falls back to the
 * initials monogram instead of the grey box. National teams are unaffected visually (they render the
 * country flag via isNational), so nulling their placeholder logo is harmless.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-null-placeholder-logos.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-null-placeholder-logos.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const PLACEHOLDER_BYTES = 29416;

async function size(id: number): Promise<number> {
  try {
    const r = await fetch(`https://media.api-sports.io/football/teams/${id}.png`);
    return (await r.arrayBuffer()).byteLength;
  } catch {
    return -1;
  }
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const teams = (await sql.query(
    `SELECT id, slug FROM teams WHERE logo_url IS NOT NULL ORDER BY id`,
  )) as { id: number; slug: string }[];

  const placeholders: { id: number; slug: string }[] = [];
  const BATCH = 25;
  for (let i = 0; i < teams.length; i += BATCH) {
    const chunk = teams.slice(i, i + BATCH);
    const sizes = await Promise.all(chunk.map((t) => size(t.id)));
    chunk.forEach((t, j) => sizes[j] === PLACEHOLDER_BYTES && placeholders.push(t));
  }

  console.log(`placeholder-logo teams: ${placeholders.length}${apply ? '' : '  (dry-run)'}`);
  placeholders
    .slice(0, apply ? placeholders.length : 50)
    .forEach((t) => console.log(`  ${t.slug}`));

  if (apply && placeholders.length) {
    await sql.query(`UPDATE teams SET logo_url = NULL WHERE id = ANY($1)`, [
      placeholders.map((t) => t.id),
    ]);
    console.log(`\napplied: nulled logo_url for ${placeholders.length} teams`);
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
