/**
 * Flag youth + women NATIONAL teams as `is_national=true` (and fix their country_code) so
 * getNationalFlagUrl resolves them to their country flag — same crest as the senior men's side —
 * instead of the grey placeholder.
 *
 * Rule (name-driven, safe): a team is national iff its base name — stripped of an age-group marker
 * (U15–U23) and/or a women's suffix (" W"/" (W)"/" Women") — matches a country name. This excludes
 * club academies (PSG U17, Rangers U17 — "PSG"/"Rangers" aren't countries) and women's club sides
 * (Racing W, Hearts W), and it lets us set the CORRECT country_code from the matched country (fixing
 * bad data like Singapore U19 → PH, Kosovo U21 → US).
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-flags.ts          # dry-run
 *   pnpm tsx --env-file=.env.local scripts/backfill-national-flags.ts --apply   # write
 */
import { neon } from '@neondatabase/serverless';

const apply = process.argv.includes('--apply');
const AGE = /\s*U-?(1[5-9]|2[0-3])\b/i;

function baseName(n: string): string {
  return n
    .replace(AGE, ' ')
    .replace(/\s*\(?W(omen)?\)?\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const code = new Map<string, string>();
  for (const r of (await sql.query(
    `SELECT code, name->>'en' AS n FROM countries WHERE name->>'en' IS NOT NULL`,
  )) as { code: string; n: string }[]) {
    code.set(r.n.toLowerCase(), r.code);
  }

  const cand = (await sql.query(
    `SELECT id, slug, name->>'en' AS en, is_women, country_code FROM teams WHERE is_national = false`,
  )) as { id: number; slug: string; en: string; is_women: boolean; country_code: string | null }[];

  const updates: { id: number; slug: string; en: string; cc: string; fixed: boolean }[] = [];
  for (const t of cand) {
    const name = t.en || '';
    if (!AGE.test(name) && !t.is_women) continue; // only youth or women candidates
    const cc = code.get(baseName(name).toLowerCase());
    if (!cc) continue; // base name isn't a country → club academy / club women → skip
    updates.push({ id: t.id, slug: t.slug, en: name, cc, fixed: t.country_code !== cc });
  }

  console.log(`national teams to flag: ${updates.length}${apply ? '' : '  (dry-run)'}`);
  for (const u of updates.slice(0, apply ? updates.length : 50)) {
    console.log(`  ${u.slug}  "${u.en}" -> ${u.cc}${u.fixed ? '  (code corrected)' : ''}`);
  }

  if (apply) {
    for (const u of updates) {
      await sql.query(`UPDATE teams SET is_national = true, country_code = $1 WHERE id = $2`, [
        u.cc,
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
