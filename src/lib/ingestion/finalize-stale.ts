import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import type { DataProvider } from '@/lib/data/provider';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from './fixtures';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

// Statuses a stuck-but-unresolved match can sit in after dropping off the live
// feed: every in-progress code the poller refreshes (canonical LIVE set, incl.
// INT) plus SUSP (suspended). A fixture in one of these with a stale `updated_at`
// has been abandoned by the poller and needs re-fetching. PST/CANC are
// schedule-managed (not in-play), so they're left to the schedule sync.
const STALE_LIVE_CODES = [...LIVE_CODES_ARRAY, 'SUSP'];

export interface FinalizeStaleResult {
  stale: number;
  updated: number;
  skipped: number;
  notFound: number;
  apiCalls: number;
  /** Fixture ids finalized this run — used to ping IndexNow with the freshly-completed matches. */
  finalizedIds: number[];
}

/**
 * Finalize fixtures the live poller lost track of.
 *
 * The poller only updates fixtures returned by the live feed; when a match ends
 * it drops off that feed, so it's never written to FT and freezes at its last
 * live snapshot ("2H 90'"). We detect this two ways and re-fetch by ID (the most
 * reliable lookup), writing whatever the API currently reports:
 *
 * - Live-status fixtures whose `updated_at` is older than `staleAfterMinutes`:
 *   the poller has stopped touching them, so they're finished. `updated_at` is a
 *   clean signal — only the poller (and this job) bump it; the schedule sync does
 *   not. A genuinely live match is refreshed every cycle, so it's never selected.
 * - `NS` fixtures past kickoff by `staleAfterHours`: these get no poller updates,
 *   so update-staleness can't apply; kickoff age is the right signal instead.
 *
 * Re-fetching is harmless even if a match is genuinely still live: we just write
 * its current live state back.
 */
export async function finalizeStaleFixtures(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  opts: { staleAfterHours?: number; staleAfterMinutes?: number; max?: number } = {},
): Promise<FinalizeStaleResult> {
  const staleAfterHours = opts.staleAfterHours ?? 3;
  const staleAfterMinutes = opts.staleAfterMinutes ?? 5;
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
      sql`(
            ${schema.fixtures.statusCode} IN (${sql.join(
              STALE_LIVE_CODES.map((c) => sql`${c}`),
              sql`, `,
            )})
            AND ${schema.fixtures.updatedAt} < NOW() - make_interval(mins => ${staleAfterMinutes})
          )
          OR (
            ${schema.fixtures.statusCode} = 'NS'
            AND ${schema.fixtures.kickoffAt} < NOW() - make_interval(hours => ${staleAfterHours})
          )`,
    )
    .limit(max);

  if (staleRows.length === 0) {
    return { stale: 0, updated: 0, skipped: 0, notFound: 0, apiCalls: 0, finalizedIds: [] };
  }

  const staleMap = new Map(staleRows.map((r) => [r.id, r]));
  const ids = staleRows.map((r) => r.id);
  const BATCH = 20; // API supports ?ids=id1-id2-... up to 20
  let updated = 0;
  let skipped = 0;
  let apiCalls = 0;
  const finalizedIds: number[] = [];

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
      finalizedIds.push(f.id);
      staleMap.delete(f.id);
    }
  }

  return {
    stale: staleRows.length,
    updated,
    skipped,
    notFound: staleMap.size,
    apiCalls,
    finalizedIds,
  };
}
