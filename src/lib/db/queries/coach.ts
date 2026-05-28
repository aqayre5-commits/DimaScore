import { eq } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

export interface CareerEntry {
  team: { id: number; name: string; logo: string | null };
  start: string | null;
  end: string | null;
}

export interface CoachDetail {
  id: number;
  name: string;
  firstname: string | null;
  lastname: string | null;
  birthDate: string | null;
  nationalityCode: string | null;
  photoUrl: string | null;
  currentTeamId: number | null;
  career: CareerEntry[];
  currentTeam: {
    id: number;
    name: Record<string, string>;
    logoUrl: string | null;
  } | null;
}

export async function getCoachById(
  db: NeonHttpDatabase<typeof schema>,
  id: number,
): Promise<CoachDetail | null> {
  const rows = await db
    .select({
      id: schema.coaches.id,
      name: schema.coaches.name,
      firstname: schema.coaches.firstname,
      lastname: schema.coaches.lastname,
      birthDate: schema.coaches.birthDate,
      nationalityCode: schema.coaches.nationalityCode,
      photoUrl: schema.coaches.photoUrl,
      currentTeamId: schema.coaches.currentTeamId,
      career: schema.coaches.career,
      teamId: schema.teams.id,
      teamName: schema.teams.name,
      teamLogoUrl: schema.teams.logoUrl,
    })
    .from(schema.coaches)
    .leftJoin(schema.teams, eq(schema.coaches.currentTeamId, schema.teams.id))
    .where(eq(schema.coaches.id, id))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  const rawCareer = (row.career ?? []) as CareerEntry[];

  return {
    id: row.id,
    name: row.name,
    firstname: row.firstname,
    lastname: row.lastname,
    birthDate: row.birthDate,
    nationalityCode: row.nationalityCode,
    photoUrl: row.photoUrl,
    currentTeamId: row.currentTeamId,
    career: rawCareer,
    currentTeam: row.teamId
      ? {
          id: row.teamId,
          name: row.teamName as Record<string, string>,
          logoUrl: row.teamLogoUrl,
        }
      : null,
  };
}
