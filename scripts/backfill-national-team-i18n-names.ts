/**
 * Phase 16 · Task C (#4) — localize FR/AR names for national teams.
 *
 * National-team rows carry only name.en (e.g. "Albania U21"); FR/AR are null, so FR/AR pages fall
 * back to English via team-name.ts. This backfill fills name.fr / name.ar from the reviewed
 * country-name map (country-names-i18n.ts), keyed on country_code:
 *   senior  →  "{localized country}"
 *   youth   →  "{localized country} U21"  (FR)  /  "{localized country} تحت 21"  (AR)
 *
 * Non-destructive: only fills a locale that is currently empty (never clobbers a curated value).
 * Women's national teams (is_women = true) are skipped — Task D (#3) handles their titles/slugs.
 * name.en is never touched.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-team-i18n-names.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-team-i18n-names.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';
import { getCountryNames } from '@/lib/constants/country-names-i18n';

const apply = process.argv.includes('--apply');
const AGE = /\bU-?(1[5-9]|2[0-3])\b/;

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const q = (s: string, p: unknown[] = []) =>
    sql.query(s, p).then((r) => r as Record<string, unknown>[]);

  const rows = (await q(
    `SELECT id, name, country_code FROM teams
      WHERE is_national = true AND coalesce(is_women, false) = false AND country_code IS NOT NULL
      ORDER BY id`,
  )) as { id: number; name: Record<string, string>; country_code: string }[];

  let seniorFilled = 0;
  let youthFilled = 0;
  const noMap = new Set<string>();
  const updates: { id: number; name: Record<string, string> }[] = [];

  for (const t of rows) {
    const names = getCountryNames(t.country_code);
    if (!names) {
      noMap.add(t.country_code);
      continue;
    }
    const m = (t.name.en || '').match(AGE);
    const nn = m ? m[1] : null;
    const frVal = nn ? `${names.fr} U${nn}` : names.fr;
    const arVal = nn ? `${names.ar} تحت ${nn}` : names.ar;

    const next = { ...t.name };
    let changed = false;
    if (!next.fr) {
      next.fr = frVal;
      changed = true;
    }
    if (!next.ar) {
      next.ar = arVal;
      changed = true;
    }
    if (changed) {
      updates.push({ id: t.id, name: next });
      if (nn) youthFilled++;
      else seniorFilled++;
    }
  }

  console.log(`national (non-women) teams scanned: ${rows.length}`);
  console.log(
    `to fill: ${updates.length}  (senior ${seniorFilled}, youth ${youthFilled})${apply ? '' : '  (dry-run)'}`,
  );
  for (const u of updates.slice(0, apply ? 0 : 12)) {
    console.log(`  ${u.id}  en="${u.name.en}"  fr="${u.name.fr}"  ar="${u.name.ar}"`);
  }
  if (noMap.size)
    console.log(`country codes with no translation (skipped): ${[...noMap].sort().join(', ')}`);

  if (apply) {
    for (const u of updates) {
      await q(`UPDATE teams SET name = $1::jsonb WHERE id = $2`, [JSON.stringify(u.name), u.id]);
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
