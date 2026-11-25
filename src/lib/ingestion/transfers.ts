import { eq, or, and, inArray } from 'drizzle-orm';
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

export const TRANSFER_CRON_WALL_MS = 15 * 60 * 1000;
export const TRANSFER_CRON_MARGIN_MS = 60 * 1000;

/**
 * Weekly club-transfer pass used by `/api/cron/transfers` and chained from
 * the Sunday squads-refresh job. Stops starting new teams when `deadline`
 * is reached so the parent cron can respect its wall clock.
 */
export async function runLeagueTransfers(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  opts: { deadline?: number } = {},
): Promise<{
  synced: number;
  failed: number;
  skippedForDeadline: number;
  results: { teamId: number; inserted: number; error?: string }[];
}> {
  const { getCurrentSeasons } = await import('@/lib/db/queries');
  const currentSeasons = await getCurrentSeasons(db);
  if (currentSeasons.length === 0) {
    return { synced: 0, failed: 0, skippedForDeadline: 0, results: [] };
  }

  const leagueRows = await db
    .select({ id: schema.competitions.id })
    .from(schema.competitions)
    .where(
      and(
        inArray(
          schema.competitions.id,
          currentSeasons.map((s) => s.competitionId),
        ),
        eq(schema.competitions.type, 'League'),
      ),
    );
  const leagueIds = new Set(leagueRows.map((r) => r.id));
  const seasons = currentSeasons.filter((s) => leagueIds.has(s.competitionId));

  const teamIdRows =
    seasons.length === 0
      ? []
      : await db
          .selectDistinct({ teamId: schema.standings.teamId })
          .from(schema.standings)
          .innerJoin(schema.teams, eq(schema.standings.teamId, schema.teams.id))
          .where(
            and(
              inArray(
                schema.standings.competitionId,
                seasons.map((s) => s.competitionId),
              ),
              inArray(schema.standings.seasonYear, [...new Set(seasons.map((s) => s.year))]),
              eq(schema.teams.isNational, false),
            ),
          );

  const teamIds = [
    ...new Set(teamIdRows.map((r) => r.teamId).filter((id): id is number => id != null)),
  ];

  const results: { teamId: number; inserted: number; error?: string }[] = [];
  let skippedForDeadline = 0;

  for (const teamId of teamIds) {
    if (opts.deadline != null && Date.now() >= opts.deadline) {
      skippedForDeadline = teamIds.length - results.length;
      break;
    }
    try {
      const stats = await syncTransfersForTeam(provider, db, teamId);
      results.push({ teamId, inserted: stats.inserted });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Transfers: team ${teamId} failed:`, error);
      results.push({ teamId, inserted: 0, error: message });
    }
  }

  return {
    synced: results.filter((r) => !r.error).length,
    failed: results.filter((r) => r.error).length,
    skippedForDeadline,
    results,
  };
}
