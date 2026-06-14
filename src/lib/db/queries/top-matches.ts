import { eq, and, asc, desc, inArray, gte, lt, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { hydrateTeams, type TeamSnapshot } from '../queries-hydrate';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

export interface TopMatch {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  competition: {
    id: number;
    name: Record<string, string>;
    slug: string;
    countryCode: string | null;
    logoUrl: string | null;
  };
}

const LIVE_CODES: string[] = [...LIVE_CODES_ARRAY];
const FINISHED_CODES = ['FT', 'AET', 'PEN'];

/**
 * Get top matches for the homepage center column.
 * Priority: live (by competition priority) → upcoming next 48h (by priority then kickoff)
 *         → recently finished within 3h (by priority then kickoff desc).
 * Returns up to `limit` matches.
 */
export async function getTopMatches(
  db: NeonHttpDatabase<typeof schema>,
  limit = 10,
): Promise<TopMatch[]> {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const twoDaysOut = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Single query: live + upcoming (next 48h) + recently finished (3h)
  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      homeScorePen: schema.fixtures.homeScorePen,
      awayScorePen: schema.fixtures.awayScorePen,
      compId: schema.competitions.id,
      compName: schema.competitions.name,
      compSlug: schema.competitions.slug,
      compCountryCode: schema.competitions.countryCode,
      compLogoUrl: schema.competitions.logoUrl,
      compPriority: schema.competitions.displayPriority,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      or(
        // Live
        inArray(schema.fixtures.statusCode, LIVE_CODES),
        // Upcoming next 48h
        and(
          eq(schema.fixtures.statusCode, 'NS'),
          gte(schema.fixtures.kickoffAt, now),
          lt(schema.fixtures.kickoffAt, twoDaysOut),
        ),
        // Recently finished (within 3h)
        and(
          inArray(schema.fixtures.statusCode, FINISHED_CODES),
          gte(schema.fixtures.kickoffAt, threeHoursAgo),
          lt(schema.fixtures.kickoffAt, now),
        ),
      ),
    )
    .orderBy(asc(schema.competitions.displayPriority), asc(schema.fixtures.kickoffAt));

  if (rows.length === 0) return [];

  // Sort: live first, then upcoming, then finished — within each bucket by priority
  const live = rows.filter((r) => LIVE_CODES.includes(r.statusCode));
  const upcoming = rows.filter((r) => r.statusCode === 'NS');
  const finished = rows
    .filter((r) => FINISHED_CODES.includes(r.statusCode))
    .sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime()); // most recent first

  const sorted = [...live, ...upcoming, ...finished].slice(0, limit);

  // Batch hydrate teams
  const teamIds = new Set<number>();
  for (const r of sorted) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }

  const teamsMap = await hydrateTeams(db, teamIds);

  return sorted.map((r) => ({
    id: r.id,
    kickoffAt: r.kickoffAt,
    statusCode: r.statusCode,
    minute: r.minute,
    homeTeamId: r.homeTeamId,
    awayTeamId: r.awayTeamId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    homeScorePen: r.homeScorePen,
    awayScorePen: r.awayScorePen,
    homeTeam: r.homeTeamId ? (teamsMap.get(r.homeTeamId) ?? null) : null,
    awayTeam: r.awayTeamId ? (teamsMap.get(r.awayTeamId) ?? null) : null,
    competition: {
      id: r.compId,
      name: r.compName,
      slug: r.compSlug,
      countryCode: r.compCountryCode,
      logoUrl: resolveCompetitionLogo(r.compId, r.compLogoUrl),
    },
  }));
}
