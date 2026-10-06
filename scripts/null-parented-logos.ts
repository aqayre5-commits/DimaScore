/**
 * Phase 16 · Task G (#5) — null the own logo_url of club reserve/youth/women teams that have a
 * parent_team_id whose parent has a logo, so crest resolution (own ?? parent ?? initials, wired into
 * the team selects) sources the crest from the parent. Only nulls where the parent actually has a
 * logo — a team whose parent has no logo keeps its own, so there is no regression to initials.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/null-parented-logos.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/null-parented-logos.ts --apply   # null
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string) => sql.query(s).then((r) => r as Record<string, unknown>[]);

  const candidates = await q(`
    SELECT c.id, c.name->>'en' AS en
      FROM teams c JOIN teams p ON c.parent_team_id = p.id
     WHERE c.logo_url IS NOT NULL AND p.logo_url IS NOT NULL`);

  console.log(`teams whose own logo will be nulled (parent has a logo): ${candidates.length}`);
  for (const c of candidates.slice(0, apply ? 0 : 15)) console.log(`  ${c.id}  "${c.en}"`);

  if (apply) {
    await q(`
      UPDATE teams c SET logo_url = NULL
        FROM teams p
       WHERE c.parent_team_id = p.id AND c.logo_url IS NOT NULL AND p.logo_url IS NOT NULL`);
    const [after] = await q(
      `SELECT count(*)::int AS n FROM teams c JOIN teams p ON c.parent_team_id = p.id WHERE c.logo_url IS NOT NULL AND p.logo_url IS NOT NULL`,
    );
    console.log(`\napplied. remaining own-logo parented teams (expect 0): ${Number(after.n)}`);
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
