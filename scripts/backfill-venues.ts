/**
 * Backfill missing venues for finished fixtures.
 *
 * ~4,900 finished (FT/AET/PEN) fixtures have a null venue_id even though a
 * played match has a venue — the ingestion missed it. Re-fetch those by id
 * (batched) and write the venue. NS/future null venues are genuinely TBD and
 * are skipped.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-venues.ts [--dry-run]
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';

const DRY = process.argv.includes('--dry-run');
const BATCH = 20; // API supports ?ids=id1-id2-... up to 20

async function main(): Promise<void> {
  const rows = await db.execute(
    sql`SELECT id FROM fixtures WHERE venue_id IS NULL AND status_code IN ('FT','AET','PEN')`,
  );
  const ids = (rows.rows as { id: string }[]).map((r) => Number(r.id));
  console.log(`[venues] ${ids.length} finished fixtures missing venue${DRY ? ' (dry run)' : ''}`);

  const provider = getDataProvider();
  let set = 0;
  let stillNone = 0;
  let apiCalls = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const fixtures = await provider.getFixtures({ ids: batch });
    apiCalls++;

    for (const f of fixtures) {
      if (!f.venue.id) {
        stillNone++;
        continue;
      }
      if (!DRY) {
        await db
          .insert(schema.venues)
          .values({ id: f.venue.id, name: f.venue.name, city: f.venue.city })
          .onConflictDoUpdate({
            target: schema.venues.id,
            set: { name: f.venue.name, city: f.venue.city },
          });
        await db
          .update(schema.fixtures)
          .set({ venueId: f.venue.id })
          .where(eq(schema.fixtures.id, f.id));
      }
      set++;
    }

    if (i % (BATCH * 10) === 0 || i + BATCH >= ids.length) {
      console.log(
        `[venues] ${Math.min(i + BATCH, ids.length)}/${ids.length} — set=${set} api_calls=${apiCalls}`,
      );
    }
  }

  console.log(`[venues] done — set=${set}, still_no_venue=${stillNone}, api_calls=${apiCalls}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[venues] fatal:', err);
  process.exit(1);
});
