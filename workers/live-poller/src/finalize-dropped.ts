import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedFixture } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

/** API-Football's `ids=` filter accepts up to 20 fixture ids per call. */
export const MAX_IDS_PER_CALL = 20;
/** Give up re-checking a dropped fixture after this many ticks; finalize-stale cron is the backstop. */
export const MAX_FINALIZE_ATTEMPTS = 6;

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);

/**
 * Remembers which tracked fixtures were on the live feed last tick so that, the moment one drops
 * off (i.e. the match just ended), the poller can fetch it by id and write the final result —
 * instead of waiting up to ~15+ min for the finalize-stale cron.
 */
export class DroppedFixtureTracker {
  private lastLive = new Set<number>();
  private pending = new Map<number, number>(); // fixtureId → attempts so far

  /** Feed the ids currently on the (tracked) live feed; returns ids to fetch now (≤ 20). */
  update(currentLiveIds: Iterable<number>): number[] {
    const current = new Set(currentLiveIds);
    for (const id of this.lastLive) {
      if (!current.has(id) && !this.pending.has(id)) this.pending.set(id, 0);
    }
    // Back on the live feed (feed glitch) → the normal delta path handles it again.
    for (const id of current) this.pending.delete(id);
    this.lastLive = current;
    return [...this.pending.keys()].slice(0, MAX_IDS_PER_CALL);
  }

  /** Record the outcome of a fetch: settled ids are forgotten, others retried next tick (bounded). */
  settle(checkedIds: number[], settledIds: Iterable<number>): void {
    const settled = new Set(settledIds);
    for (const id of checkedIds) {
      const attempts = (this.pending.get(id) ?? 0) + 1;
      if (settled.has(id) || attempts >= MAX_FINALIZE_ATTEMPTS) this.pending.delete(id);
      else this.pending.set(id, attempts);
    }
  }

  get pendingCount(): number {
    return this.pending.size;
  }
}

export interface FinalizeDroppedResult {
  /** Fixtures whose fetched status is no longer live (FT/AET/PEN/CANC/ABD/…) — written and settled. */
  settled: NormalizedFixture[];
  /** Fixtures the API still reports as live (feed lag) — written, will be re-checked. */
  stillLive: NormalizedFixture[];
}

/**
 * One API call: fetch the dropped fixtures by id and write whatever the API now reports
 * (final score + status). Goes through the shared apiGet path like every other call.
 */
export async function finalizeDroppedFixtures(
  provider: Pick<DataProvider, 'getFixtures'>,
  db: NeonHttpDatabase<typeof schema>,
  ids: number[],
): Promise<FinalizeDroppedResult> {
  if (ids.length === 0) return { settled: [], stillLive: [] };
  const fixtures =
    ids.length === 1
      ? await provider.getFixtures({ id: ids[0] })
      : await provider.getFixtures({ ids });

  const settled: NormalizedFixture[] = [];
  const stillLive: NormalizedFixture[] = [];

  for (const f of fixtures) {
    if (!ids.includes(f.id)) continue;
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
    (LIVE_CODES.has(f.status.short) ? stillLive : settled).push(f);
  }

  return { settled, stillLive };
}
