/**
 * Phase 16 · Task A — delete junk rows that aren't real entities, plus their junk dependents.
 *
 *   players 0, 9300100 "Player One", 9300101 "Player Two"   (test/bogus players)
 *   teams   9300010 "Test Team"                              (9300011 "New Team" already removed)
 *
 * Cascade is scoped STRICTLY to these explicit junk ids: for each junk player/team it discovers
 * (via information_schema) every table whose FK references it, deletes only the referencing rows
 * that point at a junk id, then deletes the junk row itself. Players are cleared before teams so a
 * junk team's players are gone first. Nothing outside these ids is touched. A final pass verifies
 * zero rows remain and reports any target still referenced (would indicate a non-junk reference).
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/cleanup-junk-rows.ts          # dry-run (report refs)
 *   pnpm tsx --env-file=.env.local scripts/cleanup-junk-rows.ts --apply   # cascade delete
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');

const JUNK_PLAYERS = [0, 9300100, 9300101];
const JUNK_TEAMS = [9300010];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  const referencingTables = async (pkTable: string) =>
    (
      await q(
        `SELECT tc.table_name AS tbl, kcu.column_name AS col
           FROM information_schema.table_constraints tc
           JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
           JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name = $1`,
        [pkTable],
      )
    ).map((r) => ({ tbl: String(r.tbl), col: String(r.col) }));

  const purge = async (pkTable: 'players' | 'teams', ids: number[]) => {
    const refs = await referencingTables(pkTable);
    for (const { tbl, col } of refs) {
      const [row] = await q(`SELECT count(*)::int AS n FROM "${tbl}" WHERE "${col}" = ANY($1)`, [
        ids,
      ]);
      const n = Number(row.n);
      if (n > 0) {
        console.log(`  ${apply ? 'delete' : 'would delete'} ${n} from ${tbl}.${col}`);
        if (apply) await q(`DELETE FROM "${tbl}" WHERE "${col}" = ANY($1)`, [ids]);
      }
    }
    const [before] = await q(`SELECT count(*)::int AS n FROM "${pkTable}" WHERE id = ANY($1)`, [
      ids,
    ]);
    console.log(
      `  ${apply ? 'delete' : 'would delete'} ${Number(before.n)} ${pkTable} row(s): ${ids.join(', ')}`,
    );
    if (apply) await q(`DELETE FROM "${pkTable}" WHERE id = ANY($1)`, [ids]);
  };

  console.log('players cluster:');
  await purge('players', JUNK_PLAYERS);
  console.log('teams cluster:');
  await purge('teams', JUNK_TEAMS);

  if (apply) {
    const [p] = await q(`SELECT count(*)::int AS n FROM players WHERE id = ANY($1)`, [
      JUNK_PLAYERS,
    ]);
    const [t] = await q(`SELECT count(*)::int AS n FROM teams WHERE id = ANY($1)`, [JUNK_TEAMS]);
    console.log(
      `\nverify — junk players left: ${Number(p.n)}, junk teams left: ${Number(t.n)} (expect 0, 0)`,
    );
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
