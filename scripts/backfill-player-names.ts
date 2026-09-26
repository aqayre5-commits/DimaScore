/**
 * Backfill real names for players stuck on the placeholder "Unknown Player" (slug `unknown-{id}`).
 *
 * For each such player, fetch the profile from API-Football (`/players/profiles`) and, when a real
 * name comes back, update name.en + regenerate slug (`slugify(name)-id`) + photo. The player route
 * resolves by trailing id and 301s to the stored slug, so old `unknown-{id}` URLs self-heal; and
 * once the slug no longer starts with `unknown-`, the page becomes indexable + re-enters the sitemap.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-player-names.ts           # dry-run (previews ~10)
 *   pnpm tsx --env-file=.env.local scripts/backfill-player-names.ts --apply    # fetch all + write
 * Requires .env.local with DATABASE_URL + API-Football creds. Throttled (BACKFILL_DELAY_MS, def 250).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { slugify } from '@/lib/ingestion/slug';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');
const DELAY = Number(process.env.BACKFILL_DELAY_MS ?? '250');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRealName(name: string | null | undefined): name is string {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return n !== '' && n !== 'unknown' && n !== 'unknown player';
}

async function main() {
  const res = await db.execute(sql`
    SELECT id, name, slug FROM players WHERE slug LIKE 'unknown-%' ORDER BY id
  `);
  const rows = res.rows as {
    id: number | string;
    name: Record<string, string> | null;
    slug: string;
  }[];
  const work = apply ? rows : rows.slice(0, 10);
  console.log(
    `unknown-slug players: ${rows.length}${apply ? '' : `  (dry-run — previewing ${work.length})`}`,
  );

  const provider = getDataProvider();
  let resolved = 0,
    unresolved = 0,
    errors = 0;

  for (const r of work) {
    const id = Number(r.id);
    try {
      const profiles = await provider.getPlayerProfiles({ player: id });
      const p = profiles[0];
      const base = isRealName(p?.name) ? slugify(p.name) : '';
      if (!base || base === 'unknown') {
        unresolved++;
        await sleep(DELAY);
        continue;
      }
      const newSlug = `${base}-${id}`;
      resolved++;
      if (resolved <= 15 || resolved % 100 === 0) {
        console.log(`  ${apply ? 'set' : 'would set'} ${id}: "${p.name}" -> ${newSlug}`);
      }
      if (apply) {
        await db
          .update(schema.players)
          .set({
            name: { ...(r.name ?? {}), en: p.name },
            slug: newSlug,
            ...(p.photo ? { photoUrl: p.photo } : {}),
          })
          .where(eq(schema.players.id, id));
      }
    } catch {
      errors++;
    }
    await sleep(DELAY);
  }

  console.log(
    `\nresolved=${resolved} unresolved=${unresolved} errors=${errors}${apply ? '' : '  (dry-run — re-run with --apply for all)'}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
