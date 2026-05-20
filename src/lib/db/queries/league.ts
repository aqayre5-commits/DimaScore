import { eq, and, asc, desc, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { FixtureWithTeams } from '../queries';
import { hydrateFixtures } from '../queries-hydrate';

// ── Types ──

export interface CompetitionRecord {
  id: number;
  slug: string;
  name: Record<string, string>;
  countryCode: string | null;
  type: string;
  logoUrl: string | null;
}

export interface LeagueCoverageRecord {
  standings: boolean | null;
  topScorers: boolean | null;
  topAssists: boolean | null;
  events: boolean | null;
  lineups: boolean | null;
  statisticsFixtures: boolean | null;
  statisticsPlayers: boolean | null;
  injuries: boolean | null;
  predictions: boolean | null;
}

export interface RoundInfo {
  roundNumber: number;
  round: string;
}

// ── Queries ──

export async function getCompetitionById(
  db: NeonHttpDatabase<typeof schema>,
  id: number,
): Promise<CompetitionRecord | null> {
  const rows = await db
    .select({
      id: schema.competitions.id,
      slug: schema.competitions.slug,
      name: schema.competitions.name,
      countryCode: schema.competitions.countryCode,
      type: schema.competitions.type,
      logoUrl: schema.competitions.logoUrl,
    })
    .from(schema.competitions)
    .where(eq(schema.competitions.id, id))
    .limit(1);

  return rows[0] ?? null;
}

export async function getLeagueCoverage(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  season: number,
): Promise<LeagueCoverageRecord | null> {
  const rows = await db
    .select({
      standings: schema.leagueCoverage.standings,
      topScorers: schema.leagueCoverage.topScorers,
      topAssists: schema.leagueCoverage.topAssists,
      events: schema.leagueCoverage.events,
      lineups: schema.leagueCoverage.lineups,
      statisticsFixtures: schema.leagueCoverage.statisticsFixtures,
      statisticsPlayers: schema.leagueCoverage.statisticsPlayers,
      injuries: schema.leagueCoverage.injuries,
      predictions: schema.leagueCoverage.predictions,
    })
    .from(schema.leagueCoverage)
    .where(
      and(
        eq(schema.leagueCoverage.leagueId, competitionId),
        eq(schema.leagueCoverage.season, season),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function getCurrentSeasonYear(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
): Promise<number | null> {
  const rows = await db
    .select({ year: schema.seasons.year })
    .from(schema.seasons)
    .where(and(eq(schema.seasons.competitionId, competitionId), eq(schema.seasons.isCurrent, true)))
    .limit(1);

  return rows[0]?.year ?? null;
}

export async function getLeagueRounds(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<RoundInfo[]> {
  const rows = await db
    .selectDistinctOn([schema.fixtures.roundNumber], {
      roundNumber: schema.fixtures.roundNumber,
      round: schema.fixtures.round,
    })
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        sql`${schema.fixtures.roundNumber} IS NOT NULL`,
      ),
    )
    .orderBy(asc(schema.fixtures.roundNumber));

  return rows
    .filter((r): r is { roundNumber: number; round: string | null } => r.roundNumber != null)
    .map((r) => ({
      roundNumber: r.roundNumber,
      round: r.round ?? `Round ${r.roundNumber}`,
    }));
}

/**
 * Determine the "current" round: the most recent round that has at least one
 * finished match, or the first round with upcoming matches if none are finished.
 */
export async function getCurrentRound(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<number | null> {
  // Most recent round with a finished match
  const finished = await db
    .select({ roundNumber: schema.fixtures.roundNumber })
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        eq(schema.fixtures.statusCode, 'FT'),
        sql`${schema.fixtures.roundNumber} IS NOT NULL`,
      ),
    )
    .orderBy(desc(schema.fixtures.roundNumber))
    .limit(1);

  if (finished[0]?.roundNumber != null) return finished[0].roundNumber;

  // Fallback: first round with any match
  const first = await db
    .select({ roundNumber: schema.fixtures.roundNumber })
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        sql`${schema.fixtures.roundNumber} IS NOT NULL`,
      ),
    )
    .orderBy(asc(schema.fixtures.roundNumber))
    .limit(1);

  return first[0]?.roundNumber ?? null;
}

/**
 * Featured match for a league: next upcoming fixture, or most recent finished.
 */
export async function getLeagueFeaturedMatch(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<FixtureWithTeams | null> {
  // Dynamic import to avoid circular dependency with queries.ts
  const now = new Date();

  // Next upcoming
  const upcoming = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        sql`${schema.fixtures.kickoffAt} > ${now.toISOString()}`,
        eq(schema.fixtures.statusCode, 'NS'),
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(1);

  if (upcoming.length > 0) {
    const hydrated = await hydrateFixtures(db, upcoming);
    return hydrated[0] ?? null;
  }

  // Fallback: most recent finished
  const recent = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        eq(schema.fixtures.statusCode, 'FT'),
      ),
    )
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(1);

  if (recent.length > 0) {
    const hydrated = await hydrateFixtures(db, recent);
    return hydrated[0] ?? null;
  }

  return null;
}

/**
 * All fixtures for a league season, ordered by kickoff.
 * Used by LeagueFixturesCard which handles client-side round filtering.
 */
export async function getLeagueFixtures(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<FixtureWithTeams[]> {
  const rows = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
      ),
    )
    .orderBy(asc(schema.fixtures.roundNumber), asc(schema.fixtures.kickoffAt));

  return hydrateFixtures(db, rows);
}

// ── Top scorers / assists ──

export interface TopPlayerRow {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  teamName: string;
  teamLogo: string | null;
  goals: number;
  assists: number;
}

export async function getTopScorersForLeague(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  limit = 10,
): Promise<TopPlayerRow[]> {
  const rows = await db
    .select({
      playerId: schema.playerSeasonStats.playerId,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .where(
      and(
        eq(schema.playerSeasonStats.competitionId, competitionId),
        eq(schema.playerSeasonStats.seasonYear, seasonYear),
      ),
    )
    .orderBy(sql`(${schema.playerSeasonStats.stats}->>'goals')::int DESC NULLS LAST`)
    .limit(limit);

  return rows.map((r) => {
    const s = r.stats as Record<string, unknown>;
    return {
      playerId: r.playerId,
      playerName: (s.playerName as string) ?? '',
      playerPhoto: (s.playerPhoto as string) ?? null,
      teamName: (s.teamName as string) ?? '',
      teamLogo: (s.teamLogo as string) ?? null,
      goals: Number(s.goals) || 0,
      assists: Number(s.assists) || 0,
    };
  });
}

export async function getTopAssistsForLeague(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  limit = 10,
): Promise<TopPlayerRow[]> {
  const rows = await db
    .select({
      playerId: schema.playerSeasonStats.playerId,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .where(
      and(
        eq(schema.playerSeasonStats.competitionId, competitionId),
        eq(schema.playerSeasonStats.seasonYear, seasonYear),
      ),
    )
    .orderBy(sql`(${schema.playerSeasonStats.stats}->>'assists')::int DESC NULLS LAST`)
    .limit(limit);

  return rows.map((r) => {
    const s = r.stats as Record<string, unknown>;
    return {
      playerId: r.playerId,
      playerName: (s.playerName as string) ?? '',
      playerPhoto: (s.playerPhoto as string) ?? null,
      teamName: (s.teamName as string) ?? '',
      teamLogo: (s.teamLogo as string) ?? null,
      goals: Number(s.goals) || 0,
      assists: Number(s.assists) || 0,
    };
  });
}
