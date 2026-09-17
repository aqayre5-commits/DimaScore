/**
 * Backfill Arabic team names (teams.name.ar) from Wikipedia langlinks.
 *
 * Run:
 *   pnpm tsx scripts/backfill-team-ar-names.ts           # dry-run (default) — prints proposed names
 *   pnpm tsx scripts/backfill-team-ar-names.ts --apply    # write to DB
 *
 * Requires: .env.local with DATABASE_URL
 *
 * Source: TEAM_SAMEAS (curated, curl-verified en.wikipedia.org URLs). For each team, resolves the
 * Arabic Wikipedia article title via the langlinks API and writes it to name.ar. Only fills teams
 * that are MISSING name.ar — never overwrites the hand-curated seed (scripts/seed-team-ar-names.sql).
 *
 * Review the dry-run output before --apply: for national teams the Arabic article title can be the
 * verbose "منتخب … لكرة القدم" form (clubs resolve cleanly, e.g. "ريال مدريد"); the important
 * national teams are already covered by the hand seed, so those are skipped here.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, inArray } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { TEAM_SAMEAS } from '@/lib/constants/entity-links';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');

const UA = 'DimaScore-ar-backfill/1.0 (https://dimascore.ma)';

interface WikiResponse {
  query?: { pages?: Record<string, { langlinks?: Array<{ '*': string }> }> };
}

function titleFromWikiUrl(url: string): string | null {
  const m = url.match(/\/wiki\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchArabicTitle(enTitle: string): Promise<string | null> {
  const u = new URL('https://en.wikipedia.org/w/api.php');
  u.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'langlinks',
    lllang: 'ar',
    lllimit: '1',
    redirects: '1',
    titles: enTitle,
  }).toString();
  const res = await fetch(u, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as WikiResponse;
  const pages = data.query?.pages ?? {};
  for (const key of Object.keys(pages)) {
    const ar = pages[key]?.langlinks?.[0]?.['*'];
    if (ar) return ar;
  }
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const ids = Object.keys(TEAM_SAMEAS).map(Number);
  const rows = await db
    .select({ id: schema.teams.id, name: schema.teams.name, isNational: schema.teams.isNational })
    .from(schema.teams)
    .where(inArray(schema.teams.id, ids));

  let filled = 0;
  let skipped = 0;
  let noAr = 0;

  for (const row of rows) {
    const name = (row.name ?? {}) as Record<string, string>;
    if (name.ar && name.ar.trim()) {
      skipped++;
      continue;
    }
    const enTitle = titleFromWikiUrl(TEAM_SAMEAS[row.id] ?? '');
    if (!enTitle) {
      noAr++;
      continue;
    }
    const ar = await fetchArabicTitle(enTitle);
    await sleep(300); // Wikipedia API etiquette
    if (!ar) {
      noAr++;
      console.log(`  no ar langlink: ${row.id} ${enTitle}`);
      continue;
    }
    // National-team articles are titled "منتخب X لكرة القدم" — strip to the clean country name.
    let value = ar;
    if (row.isNational) {
      const m = ar.match(/^منتخب\s+(.+?)(?:\s+الوطني)?\s+لكرة القدم$/);
      if (m) value = m[1];
    }
    console.log(`${apply ? 'SET ' : 'DRY '} ${row.id}: ${enTitle} -> ${value}`);
    if (apply) {
      await db
        .update(schema.teams)
        .set({ name: { ...name, ar: value } })
        .where(eq(schema.teams.id, row.id));
    }
    filled++;
  }

  console.log(
    `\n${apply ? 'Applied' : 'Would fill'}: ${filled} · already-set skipped: ${skipped} · no ar: ${noAr}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
