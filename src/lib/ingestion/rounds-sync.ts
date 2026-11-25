import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import { parseRoundNumber } from './round';

/**
 * Fill fixtures.round_number from fixtures.round where it is still null,
 * using the expanded knockout / qualifying parser. Does not call the API
 * and does not rewrite numbers that are already set.
 *
 * `/fixtures/rounds?dates=true` storage is deferred until the response shape
 * is confirmed with a free call ([U]).
 */
export async function syncRoundNumbers(
  db: NeonHttpDatabase<typeof schema>,
): Promise<{ examined: number; updated: number }> {
  const rows = await db
    .select({
      id: schema.fixtures.id,
      round: schema.fixtures.round,
    })
    .from(schema.fixtures)
    .where(and(isNotNull(schema.fixtures.round), isNull(schema.fixtures.roundNumber)));

  const updates = rows
    .map((r) => ({ id: r.id, roundNumber: r.round ? parseRoundNumber(r.round) : null }))
    .filter((r): r is { id: number; roundNumber: number } => r.roundNumber != null);

  if (updates.length > 0) {
    await runWrites(async (tx) => {
      for (const u of updates) {
        await tx
          .update(schema.fixtures)
          .set({ roundNumber: u.roundNumber })
          .where(eq(schema.fixtures.id, u.id));
      }
    });
  }

  return { examined: rows.length, updated: updates.length };
}
