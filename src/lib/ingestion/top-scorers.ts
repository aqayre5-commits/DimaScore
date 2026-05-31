import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedTopPlayer } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
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

  for (const p of players) {
    const row = mapTopPlayerToInsert(p, params.leagueId, params.season);
    if (!row) continue;

    await db
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
  }

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

  for (const p of players) {
    const row = mapTopPlayerToInsert(p, params.leagueId, params.season);
    if (!row) continue;

    // Merge with existing stats if player already has a row (e.g., from topScorers)
    await db
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
  }

  return { inserted: 0, updated };
}
