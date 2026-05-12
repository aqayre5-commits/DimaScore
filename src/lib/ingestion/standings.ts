import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedStandingEntry } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import type { SyncStats } from './types';

// ─── Mapper (exported for testing) ───

export function mapStandingToInsert(
  entry: NormalizedStandingEntry,
  competitionId: number,
  seasonYear: number,
) {
  return {
    competitionId,
    seasonYear,
    groupLabel: entry.group,
    teamId: entry.team.id,
    rank: entry.rank,
    points: entry.points,
    played: entry.all.played,
    won: entry.all.win,
    drawn: entry.all.draw,
    lost: entry.all.lose,
    goalsFor: entry.all.goalsFor,
    goalsAgainst: entry.all.goalsAgainst,
    goalDiff: entry.goalsDiff,
    form: entry.form,
    description: entry.description,
  };
}

// ─── Sync ───

export async function syncStandings(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number },
): Promise<SyncStats> {
  const groups = await provider.getStandings({
    league: params.leagueId,
    season: params.season,
  });
  const inserted = 0;
  let updated = 0;

  for (const group of groups) {
    for (const entry of group) {
      const row = mapStandingToInsert(entry, params.leagueId, params.season);
      await db
        .insert(schema.standings)
        .values(row)
        .onConflictDoUpdate({
          target: [
            schema.standings.competitionId,
            schema.standings.seasonYear,
            schema.standings.groupLabel,
            schema.standings.teamId,
          ],
          set: {
            rank: row.rank,
            points: row.points,
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            goalDiff: row.goalDiff,
            form: row.form,
            description: row.description,
          },
        });
      updated++;
    }
  }

  return { inserted, updated };
}
