import { eq, or, inArray } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';

/**
 * Sync transfers for one club. Callers should restrict this to league clubs
 * (not every FA Cup participant) to keep weekly quota in check.
 *
 * Rows whose from/to team is missing from `teams` are skipped (FK).
 * Existing rows for this club are replaced so the job is idempotent.
 */
export async function syncTransfersForTeam(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<SyncStats> {
  const records = await provider.getTransfers({ team: teamId });
  if (records.length === 0) return { inserted: 0, updated: 0 };

  const known = new Set(
    (
      await db
        .select({ id: schema.teams.id })
        .from(schema.teams)
        .where(
          inArray(schema.teams.id, [
            teamId,
            ...records.flatMap((t) => [t.teams.from.id, t.teams.to.id]),
          ]),
        )
    ).map((r) => r.id),
  );

  const knownPlayers = new Set(
    (
      await db
        .select({ id: schema.players.id })
        .from(schema.players)
        .where(inArray(schema.players.id, [...new Set(records.map((t) => t.player.id))]))
    ).map((r) => r.id),
  );

  const rows = records
    .map((t) => ({
      playerId: t.player.id,
      date: t.date,
      type: t.type,
      fromTeamId: t.teams.from.id,
      toTeamId: t.teams.to.id,
    }))
    .filter((r) => {
      if (!knownPlayers.has(r.playerId)) return false;
      const fromOk = r.fromTeamId == null || known.has(r.fromTeamId);
      const toOk = r.toTeamId == null || known.has(r.toTeamId);
      return fromOk && toOk;
    });

  // Dedupe inside this response (a player can appear once per team in a pair of clubs).
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    const key = `${r.playerId}|${r.date}|${r.fromTeamId}|${r.toTeamId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await runWrites(async (tx) => {
    await tx
      .delete(schema.transfers)
      .where(or(eq(schema.transfers.fromTeamId, teamId), eq(schema.transfers.toTeamId, teamId)));
    if (unique.length > 0) {
      await tx.insert(schema.transfers).values(unique);
    }
  });

  return { inserted: unique.length, updated: 0 };
}
