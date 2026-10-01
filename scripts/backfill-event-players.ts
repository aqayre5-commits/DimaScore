/**
 * Insert player records for IDs referenced by fixture_events (scorers, assisters, bookings, subs)
 * that aren't in `players` — the remaining "—" placeholders after the squad backfill (departed /
 * not-currently-called-up / errored-team players). Fetches each from API-Football `/players/profiles`
 * and inserts id, name, slug, firstname/lastname, photo. Names + photos always arrive together.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-event-players.ts          # dry-run (previews ~10)
 *   pnpm tsx --env-file=.env.local scripts/backfill-event-players.ts --apply   # fetch all + insert
 * Throttled via BACKFILL_DELAY_MS (default 250).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { slugify } from '@/lib/ingestion/slug';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');
const DELAY = Number(process.env.BACKFILL_DELAY_MS ?? '250');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRealName(n: string | null | undefined): n is string {
  if (!n) return false;
  const s = n.trim().toLowerCase();
  return s !== '' && s !== 'unknown' && s !== 'unknown player';
}

async function main() {
  const res = await db.execute(sql`
    SELECT DISTINCT pid FROM (
      SELECT player_id AS pid FROM fixture_events WHERE player_id IS NOT NULL
      UNION
      SELECT assist_player_id AS pid FROM fixture_events WHERE assist_player_id IS NOT NULL
    ) x
    WHERE NOT EXISTS (SELECT 1 FROM players p WHERE p.id = x.pid)
    ORDER BY pid
  `);
  const ids = (res.rows as { pid: number | string }[]).map((r) => Number(r.pid));
  const work = apply ? ids : ids.slice(0, 10);
  console.log(
    `missing event player ids: ${ids.length}${apply ? '' : `  (dry-run — previewing ${work.length})`}`,
  );

  const provider = getDataProvider();
  let inserted = 0,
    unresolved = 0,
    errors = 0;

  for (const id of work) {
    try {
      const profiles = await provider.getPlayerProfiles({ player: id });
      const p = profiles[0];
      if (!isRealName(p?.name)) {
        unresolved++;
        await sleep(DELAY);
        continue;
      }
      inserted++;
      if (inserted <= 15 || inserted % 200 === 0) {
        console.log(`  ${apply ? 'insert' : 'would insert'} ${id}: "${p.name}"`);
      }
      if (apply) {
        await db
          .insert(schema.players)
          .values({
            id,
            slug: `${slugify(p.name)}-${id}`,
            name: { en: p.name },
            firstname: p.firstname,
            lastname: p.lastname,
            photoUrl: p.photo,
          })
          .onConflictDoNothing({ target: schema.players.id });
      }
    } catch {
      errors++;
    }
    await sleep(DELAY);
  }

  console.log(
    `\ninserted=${inserted} unresolved=${unresolved} errors=${errors}${apply ? '' : '  (dry-run — re-run with --apply)'}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
