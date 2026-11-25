import { sql, inArray, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { escapeLikePattern } from '@/lib/utils/sql';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import { usableLogoUrl } from '@/lib/logos/status';

// ── Types ──

export interface SearchResultTeam {
  type: 'team';
  id: number;
  slug: string;
  name: Record<string, string>;
  code: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
  countryCode: string | null;
}

export interface SearchResultPlayer {
  type: 'player';
  id: number;
  slug: string;
  name: Record<string, string>;
  firstname: string | null;
  lastname: string | null;
  position: string | null;
  photoUrl: string | null;
  currentTeamName: Record<string, string> | null;
  currentTeamLogoUrl: string | null;
}

export interface SearchResultCompetition {
  type: 'competition';
  id: number;
  slug: string;
  name: Record<string, string>;
  logoUrl: string | null;
  countryCode: string | null;
}

export interface SearchResults {
  teams: SearchResultTeam[];
  players: SearchResultPlayer[];
  competitions: SearchResultCompetition[];
}

// ── Query ──

export async function searchAll(
  db: NeonHttpDatabase<typeof schema>,
  query: string,
  limit = 5,
): Promise<SearchResults> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return { teams: [], players: [], competitions: [] };

  const pattern = `%${escapeLikePattern(trimmed)}%`;
  const clampedLimit = Math.min(Math.max(limit, 1), 20);

  const teamParent = alias(schema.teams, 'team_parent');
  const [teams, players, competitions] = await Promise.all([
    // Teams: search name (en/fr/ar), shortName, code
    db
      .select({
        id: schema.teams.id,
        slug: schema.teams.slug,
        name: schema.teams.name,
        code: schema.teams.code,
        logoUrl: sql<string | null>`COALESCE(${schema.teams.logoUrl}, ${teamParent.logoUrl})`,
        logoStatus: sql<
          import('@/lib/logos/status').LogoStatus | null
        >`COALESCE(${schema.teams.logoStatus}, ${teamParent.logoStatus})`,
        isNational: schema.teams.isNational,
        countryCode: schema.teams.countryCode,
      })
      .from(schema.teams)
      .leftJoin(teamParent, eq(schema.teams.parentTeamId, teamParent.id))
      .where(
        sql`(
          ${schema.teams.name}->>'en' ILIKE ${pattern} OR
          ${schema.teams.name}->>'fr' ILIKE ${pattern} OR
          ${schema.teams.name}->>'ar' ILIKE ${pattern} OR
          ${schema.teams.shortName}->>'en' ILIKE ${pattern} OR
          ${schema.teams.shortName}->>'fr' ILIKE ${pattern} OR
          ${schema.teams.shortName}->>'ar' ILIKE ${pattern} OR
          ${schema.teams.code} ILIKE ${pattern}
        )`,
      )
      .limit(clampedLimit),

    // Players: search name (en/fr/ar), firstname, lastname
    db
      .select({
        id: schema.players.id,
        slug: schema.players.slug,
        name: schema.players.name,
        firstname: schema.players.firstname,
        lastname: schema.players.lastname,
        position: schema.players.position,
        photoUrl: schema.players.photoUrl,
        photoStatus: schema.players.photoStatus,
        currentTeamId: schema.players.currentTeamId,
      })
      .from(schema.players)
      .where(
        sql`(
          ${schema.players.name}->>'en' ILIKE ${pattern} OR
          ${schema.players.name}->>'fr' ILIKE ${pattern} OR
          ${schema.players.name}->>'ar' ILIKE ${pattern} OR
          ${schema.players.firstname} ILIKE ${pattern} OR
          ${schema.players.lastname} ILIKE ${pattern}
        )`,
      )
      .limit(clampedLimit),

    // Competitions: search name (en/fr/ar)
    db
      .select({
        id: schema.competitions.id,
        slug: schema.competitions.slug,
        name: schema.competitions.name,
        logoUrl: schema.competitions.logoUrl,
        countryCode: schema.competitions.countryCode,
      })
      .from(schema.competitions)
      .where(
        sql`(
          ${schema.competitions.name}->>'en' ILIKE ${pattern} OR
          ${schema.competitions.name}->>'fr' ILIKE ${pattern} OR
          ${schema.competitions.name}->>'ar' ILIKE ${pattern}
        )`,
      )
      .limit(clampedLimit),
  ]);

  // Hydrate player team names in batch
  const teamIds = [
    ...new Set(players.map((p) => p.currentTeamId).filter((id): id is number => id != null)),
  ];
  const teamMap = new Map<
    number,
    {
      name: Record<string, string>;
      logoUrl: string | null;
      logoStatus?: import('@/lib/logos/status').LogoStatus | null;
    }
  >();

  if (teamIds.length > 0) {
    const teamRows = await db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        logoUrl: sql<string | null>`COALESCE(${schema.teams.logoUrl}, ${teamParent.logoUrl})`,
        logoStatus: sql<
          import('@/lib/logos/status').LogoStatus | null
        >`COALESCE(${schema.teams.logoStatus}, ${teamParent.logoStatus})`,
      })
      .from(schema.teams)
      .leftJoin(teamParent, eq(schema.teams.parentTeamId, teamParent.id))
      .where(inArray(schema.teams.id, teamIds));

    for (const t of teamRows)
      teamMap.set(t.id, { name: t.name, logoUrl: t.logoUrl, logoStatus: t.logoStatus });
  }

  return {
    teams: teams.map((t) => ({
      type: 'team' as const,
      ...t,
      logoUrl: usableLogoUrl(t.logoUrl, t.logoStatus ?? null),
    })),
    players: players.map((p) => {
      const team = p.currentTeamId ? teamMap.get(p.currentTeamId) : null;
      return {
        type: 'player' as const,
        id: p.id,
        slug: p.slug,
        name: p.name,
        firstname: p.firstname,
        lastname: p.lastname,
        position: p.position,
        photoUrl: usableLogoUrl(p.photoUrl, p.photoStatus ?? null),
        currentTeamName: team?.name ?? null,
        currentTeamLogoUrl: usableLogoUrl(team?.logoUrl ?? null, team?.logoStatus ?? null),
      };
    }),
    competitions: competitions.map((c) => ({
      type: 'competition',
      ...c,
      logoUrl: resolveCompetitionLogo(c.id, c.logoUrl),
    })),
  };
}
