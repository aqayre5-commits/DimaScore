import { eq, and, desc, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

export interface InjuryRow {
  id: number;
  playerName: string;
  playerPhoto: string | null;
  teamName: string;
  teamLogo: string | null;
  type: string | null;
  reason: string | null;
  date: string | null;
}

/**
 * Get injuries for a competition season.
 * Joins injuries → fixtures (to scope by competition/season),
 * then hydrates player + team names.
 */
export async function getInjuriesForCompetition(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  limit = 30,
): Promise<InjuryRow[]> {
  const rows = await db
    .select({
      id: schema.injuries.id,
      type: schema.injuries.type,
      reason: schema.injuries.reason,
      date: schema.injuries.date,
      playerName: schema.players.name,
      playerPhoto: schema.players.photoUrl,
      teamName: schema.teams.name,
      teamLogo: schema.teams.logoUrl,
    })
    .from(schema.injuries)
    .innerJoin(schema.fixtures, eq(schema.injuries.fixtureId, schema.fixtures.id))
    .leftJoin(schema.players, eq(schema.injuries.playerId, schema.players.id))
    .leftJoin(schema.teams, eq(schema.injuries.teamId, schema.teams.id))
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
      ),
    )
    .orderBy(desc(sql`${schema.injuries.date}`))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    playerName: (r.playerName as Record<string, string> | null)?.en ?? '—',
    playerPhoto: r.playerPhoto,
    teamName: (r.teamName as Record<string, string> | null)?.en ?? '—',
    teamLogo: r.teamLogo,
    type: r.type,
    reason: r.reason,
    date: r.date,
  }));
}
