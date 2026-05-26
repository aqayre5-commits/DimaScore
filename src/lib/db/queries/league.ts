import { eq, and, asc, desc, sql, inArray } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { FixtureWithTeams } from '../queries';
import { hydrateFixtures } from '../queries-hydrate';
import { LIVE_CODES_ARRAY, FINISHED_CODES_ARRAY } from '@/lib/match-status';

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
  topCards: boolean | null;
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
      topCards: schema.leagueCoverage.topCards,
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

export async function getAvailableSeasons(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
): Promise<{ year: number; isCurrent: boolean }[]> {
  const rows = await db
    .select({
      year: schema.seasons.year,
      isCurrent: schema.seasons.isCurrent,
    })
    .from(schema.seasons)
    .where(eq(schema.seasons.competitionId, competitionId))
    .orderBy(desc(schema.seasons.year));

  return rows.map((r) => ({
    year: r.year,
    isCurrent: r.isCurrent ?? false,
  }));
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
 * Determine the "current" round.
 * Priority: round with live matches > most recent round with finished matches > first round.
 * Uses full status code sets + kickoff-time fallback for stale statuses.
 */
export async function getCurrentRound(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<number | null> {
  const base = and(
    eq(schema.fixtures.competitionId, competitionId),
    eq(schema.fixtures.seasonYear, seasonYear),
    sql`${schema.fixtures.roundNumber} IS NOT NULL`,
  );

  // 1. Round with any live match — that's THE current round
  const live = await db
    .select({ roundNumber: schema.fixtures.roundNumber })
    .from(schema.fixtures)
    .where(and(base, inArray(schema.fixtures.statusCode, [...LIVE_CODES_ARRAY])))
    .orderBy(desc(schema.fixtures.roundNumber))
    .limit(1);

  if (live[0]?.roundNumber != null) return live[0].roundNumber;

  // 2. Most recent round with a finished match (explicit codes OR stale status with past kickoff)
  const finished = await db
    .select({ roundNumber: schema.fixtures.roundNumber })
    .from(schema.fixtures)
    .where(
      and(
        base,
        sql`(${schema.fixtures.statusCode} IN (${sql.join(
          FINISHED_CODES_ARRAY.map((c) => sql`${c}`),
          sql`, `,
        )}) OR (${schema.fixtures.kickoffAt} <= NOW() AND ${schema.fixtures.statusCode} NOT IN (${sql.join(
          LIVE_CODES_ARRAY.map((c) => sql`${c}`),
          sql`, `,
        )})))`,
      ),
    )
    .orderBy(desc(schema.fixtures.roundNumber))
    .limit(1);

  if (finished[0]?.roundNumber != null) return finished[0].roundNumber;

  // 3. Fallback: first round with any match
  const first = await db
    .select({ roundNumber: schema.fixtures.roundNumber })
    .from(schema.fixtures)
    .where(base)
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
  const matches = await getLeagueFeaturedMatches(db, competitionId, seasonYear, 1);
  return matches[0] ?? null;
}

/**
 * Best N matches for the current/next matchweek.
 * Priority: live > upcoming > most recent finished.
 * Uses full status code sets + kickoff-time fallback for stale statuses.
 */
export async function getLeagueFeaturedMatches(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  limit = 2,
): Promise<FixtureWithTeams[]> {
  const base = and(
    eq(schema.fixtures.competitionId, competitionId),
    eq(schema.fixtures.seasonYear, seasonYear),
  );

  // 1. Live matches first
  const live = await db
    .select()
    .from(schema.fixtures)
    .where(and(base, inArray(schema.fixtures.statusCode, [...LIVE_CODES_ARRAY])))
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(limit);

  if (live.length >= limit) {
    return hydrateFixtures(db, live.slice(0, limit));
  }

  const collected = [...live];

  // 2. Fill with upcoming (future kickoff, not live, not finished)
  if (collected.length < limit) {
    const upcoming = await db
      .select()
      .from(schema.fixtures)
      .where(
        and(
          base,
          sql`${schema.fixtures.kickoffAt} > NOW()`,
          sql`${schema.fixtures.statusCode} NOT IN (${sql.join(
            [...LIVE_CODES_ARRAY, ...FINISHED_CODES_ARRAY].map((c) => sql`${c}`),
            sql`, `,
          )})`,
        ),
      )
      .orderBy(asc(schema.fixtures.kickoffAt))
      .limit(limit - collected.length);

    collected.push(...upcoming);
  }

  // 3. Fill remaining with most recent finished
  if (collected.length < limit) {
    const recent = await db
      .select()
      .from(schema.fixtures)
      .where(
        and(
          base,
          sql`(${schema.fixtures.statusCode} IN (${sql.join(
            FINISHED_CODES_ARRAY.map((c) => sql`${c}`),
            sql`, `,
          )}) OR (${schema.fixtures.kickoffAt} <= NOW() AND ${schema.fixtures.statusCode} NOT IN (${sql.join(
            LIVE_CODES_ARRAY.map((c) => sql`${c}`),
            sql`, `,
          )})))`,
        ),
      )
      .orderBy(desc(schema.fixtures.kickoffAt))
      .limit(limit - collected.length);

    collected.push(...recent);
  }

  if (collected.length === 0) return [];
  return hydrateFixtures(db, collected);
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
  playerSlug: string;
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
      playerSlug: schema.players.slug,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .innerJoin(schema.players, eq(schema.playerSeasonStats.playerId, schema.players.id))
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
      playerSlug: r.playerSlug,
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
      playerSlug: schema.players.slug,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .innerJoin(schema.players, eq(schema.playerSeasonStats.playerId, schema.players.id))
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
      playerSlug: r.playerSlug,
      playerName: (s.playerName as string) ?? '',
      playerPhoto: (s.playerPhoto as string) ?? null,
      teamName: (s.teamName as string) ?? '',
      teamLogo: (s.teamLogo as string) ?? null,
      goals: Number(s.goals) || 0,
      assists: Number(s.assists) || 0,
    };
  });
}

// ── Top cards ──

export interface TopCardRow {
  playerId: number;
  playerSlug: string;
  playerName: string;
  playerPhoto: string | null;
  teamName: string;
  teamLogo: string | null;
  yellowCards: number;
  redCards: number;
}

export async function getTopCardsForLeague(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  limit = 10,
): Promise<TopCardRow[]> {
  const rows = await db
    .select({
      playerId: schema.playerSeasonStats.playerId,
      playerSlug: schema.players.slug,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .innerJoin(schema.players, eq(schema.playerSeasonStats.playerId, schema.players.id))
    .where(
      and(
        eq(schema.playerSeasonStats.competitionId, competitionId),
        eq(schema.playerSeasonStats.seasonYear, seasonYear),
      ),
    )
    .orderBy(sql`(${schema.playerSeasonStats.stats}->>'yellowCards')::int DESC NULLS LAST`)
    .limit(limit);

  return rows.map((r) => {
    const s = r.stats as Record<string, unknown>;
    return {
      playerId: r.playerId,
      playerSlug: r.playerSlug,
      playerName: (s.playerName as string) ?? '',
      playerPhoto: (s.playerPhoto as string) ?? null,
      teamName: (s.teamName as string) ?? '',
      teamLogo: (s.teamLogo as string) ?? null,
      yellowCards: Number(s.yellowCards) || 0,
      redCards: Number(s.redCards) || 0,
    };
  });
}
