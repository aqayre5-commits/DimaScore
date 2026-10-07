/**
 * One-time cleanup — UEFA Nations League (competition 5) accumulated three overlapping standings
 * labelings across ingestion runs (the provider relabeled groups over time, and syncStandings used
 * to upsert without deleting): the raw "Group 1-4" aggregate, the disambiguated "League A · Group 1"
 * set, and the current provider-native "League A - Group A" set — 32 tables where there should be 14.
 *
 * This deletes everything except the current "League X - Group Y" scheme. The ingestion fix
 * (delete-before-insert in syncStandings) prevents this from recurring for any competition.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/cleanup-unl-standings-dups.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/cleanup-unl-standings-dups.ts --apply   # delete
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const COMP = 5;
const KEEP_LIKE = 'League % - Group %';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  const stale = await q(
    `SELECT group_label, count(*)::int AS n FROM standings
      WHERE competition_id = $1 AND group_label NOT LIKE $2
      GROUP BY group_label ORDER BY group_label`,
    [COMP, KEEP_LIKE],
  );
  const keep = await q(
    `SELECT group_label, count(*)::int AS n FROM standings
      WHERE competition_id = $1 AND group_label LIKE $2
      GROUP BY group_label ORDER BY group_label`,
    [COMP, KEEP_LIKE],
  );

  console.log(`KEEP (${keep.length} tables):`);
  for (const r of keep) console.log(`  ${r.group_label} (${r.n})`);
  console.log(`\nDELETE (${stale.length} stale tables):`);
  for (const r of stale) console.log(`  ${r.group_label} (${r.n})`);

  if (apply) {
    const res = await q(
      `DELETE FROM standings WHERE competition_id = $1 AND group_label NOT LIKE $2`,
      [COMP, KEEP_LIKE],
    );
    void res;
    const [after] = await q(
      `SELECT count(DISTINCT group_label)::int AS n FROM standings WHERE competition_id = $1`,
      [COMP],
    );
    console.log(`\napplied. UNL standings tables now: ${Number(after.n)} (expect 14)`);
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
