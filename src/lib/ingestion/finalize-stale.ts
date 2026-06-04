import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import type { DataProvider } from '@/lib/data/provider';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from './fixtures';

// Statuses that should have resolved once a match is well past kickoff.
const STALE_CODES = ['NS', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];

export interface FinalizeStaleResult {
  stale: number;
  updated: number;
  skipped: number;
  notFound: number;
  apiCalls: number;
}

/**
 * Finalize fixtures the live poller lost track of.
 *
 * The poller only updates fixtures returned by the live feed; when a match ends
 * it drops off that feed, so it's never written to FT and freezes at its last
 * live snapshot ("2H 90'"). This re-fetches fixtures stuck in a live/NS status
 * past kickoff (by ID — the most reliable lookup) and writes their real state.
 * Re-fetching is harmless even if a match is genuinely still live: we write
 * whatever the API currently reports.
 */
export async function finalizeStaleFixtures(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  opts: { staleAfterHours?: number; max?: number } = {},
): Promise<FinalizeStaleResult> {
  const staleAfterHours = opts.staleAfterHours ?? 3;
  const max = opts.max ?? 100;

  const staleRows = await db
    .select({
      id: schema.fixtures.id,
      statusCode: schema.fixtures.statusCode,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
    })
    .from(schema.fixtures)
    .where(
      sql`${schema.fixtures.statusCode} IN (${sql.join(
        STALE_CODES.map((c) => sql`${c}`),
        sql`, `,
      )})
          AND ${schema.fixtures.kickoffAt} < NOW() - make_interval(hours => ${staleAfterHours})`,
    )
    .limit(max);

  if (staleRows.length === 0) {
    return { stale: 0, updated: 0, skipped: 0, notFound: 0, apiCalls: 0 };
  }

  const staleMap = new Map(staleRows.map((r) => [r.id, r]));
  const ids = staleRows.map((r) => r.id);
  const BATCH = 20; // API supports ?ids=id1-id2-... up to 20
  let updated = 0;
  let skipped = 0;
  let apiCalls = 0;

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const fixtures = await provider.getFixtures({ ids: batch });
    apiCalls++;

    for (const f of fixtures) {
      const stale = staleMap.get(f.id);
      if (!stale) continue;

      // No-op if nothing actually changed
      if (
        stale.statusCode === f.status.short &&
        stale.homeScore === f.goals.home &&
        stale.awayScore === f.goals.away
      ) {
        skipped++;
        staleMap.delete(f.id);
        continue;
      }

      const row = mapFixtureToInsert(f);
      await db
        .insert(schema.fixtures)
        .values(row)
        .onConflictDoUpdate({
          target: schema.fixtures.id,
          set: {
            statusCode: row.statusCode,
            minute: row.minute,
            homeScore: row.homeScore,
            awayScore: row.awayScore,
            homeScoreHt: row.homeScoreHt,
            awayScoreHt: row.awayScoreHt,
            homeScoreFt: row.homeScoreFt,
            awayScoreFt: row.awayScoreFt,
            homeScoreEt: row.homeScoreEt,
            awayScoreEt: row.awayScoreEt,
            homeScorePen: row.homeScorePen,
            awayScorePen: row.awayScorePen,
            updatedAt: new Date(),
          },
        });
      updated++;
      staleMap.delete(f.id);
    }
  }

  return { stale: staleRows.length, updated, skipped, notFound: staleMap.size, apiCalls };
}
