import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedTopPlayer } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';

function mapTopPlayerToInsert(p: NormalizedTopPlayer, competitionId: number, seasonYear: number) {
  const stat = p.statistics[0];
  if (!stat) return null;

  return {
    playerId: p.player.id,
    teamId: stat.team.id,
    competitionId,
    seasonYear,
    stats: {
      goals: stat.goals ?? 0,
      assists: stat.assists ?? 0,
      yellowCards: stat.yellowCards ?? 0,
      redCards: stat.redCards ?? 0,
      playerName: p.player.name,
      playerPhoto: p.player.photo,
      teamName: stat.team.name,
      teamLogo: stat.team.logo,
    },
  };
}

export async function syncTopScorers(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number },
): Promise<SyncStats> {
  const players = await provider.getTopScorers({
    league: params.leagueId,
    season: params.season,
  });

  let updated = 0;

  await runWrites(async (tx) => {
    for (const p of players) {
      const row = mapTopPlayerToInsert(p, params.leagueId, params.season);
      if (!row) continue;

      try {
        await tx
          .insert(schema.playerSeasonStats)
          .values(row)
          .onConflictDoUpdate({
            target: [
              schema.playerSeasonStats.playerId,
              schema.playerSeasonStats.teamId,
              schema.playerSeasonStats.competitionId,
              schema.playerSeasonStats.seasonYear,
            ],
            set: {
              stats: sql`COALESCE(${schema.playerSeasonStats.stats}, '{}'::jsonb) || ${JSON.stringify(row.stats)}::jsonb`,
            },
          });
        updated++;
      } catch (err) {
        // A player/team the API reports but we haven't ingested yet FK-violates; skip it so one
        // bad row can't abort the rest of the league (and the whole cron run).
        console.warn(
          `[top-scorers] skipped player ${row.playerId} (league ${params.leagueId}/${params.season}):`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  });

  return { inserted: 0, updated };
}

export async function syncTopAssists(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number },
): Promise<SyncStats> {
  const players = await provider.getTopAssists({
    league: params.leagueId,
    season: params.season,
  });

  let updated = 0;

  await runWrites(async (tx) => {
    for (const p of players) {
      const row = mapTopPlayerToInsert(p, params.leagueId, params.season);
      if (!row) continue;

      // Merge with existing stats if player already has a row (e.g., from topScorers)
      try {
        await tx
          .insert(schema.playerSeasonStats)
          .values(row)
          .onConflictDoUpdate({
            target: [
              schema.playerSeasonStats.playerId,
              schema.playerSeasonStats.teamId,
              schema.playerSeasonStats.competitionId,
              schema.playerSeasonStats.seasonYear,
            ],
            set: {
              stats: sql`COALESCE(${schema.playerSeasonStats.stats}, '{}'::jsonb) || ${JSON.stringify(row.stats)}::jsonb`,
            },
          });
        updated++;
      } catch (err) {
        // Skip a player/team we haven't ingested yet so one FK failure can't abort the league.
        console.warn(
          `[top-assists] skipped player ${row.playerId} (league ${params.leagueId}/${params.season}):`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  });

  return { inserted: 0, updated };
}
