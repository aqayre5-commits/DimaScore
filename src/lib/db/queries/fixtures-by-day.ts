import { eq, and, asc, inArray, gte, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

// ── Types ──

type TeamSnapshot = {
  id: number;
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
};

export interface DayFixture {
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
}

export interface CompetitionGroup {
  competition: {
    id: number;
    slug: string;
    name: Record<string, string>;
    countryCode: string | null;
    logoUrl: string | null;
    displayPriority: number;
  };
  fixtures: DayFixture[];
}

// ── Query ──

/**
 * Get all fixtures for a calendar day, grouped by competition.
 * Sorted by competition displayPriority (lower = higher priority = Morocco-first).
 * Within each group, fixtures sorted by kickoff time.
 * Hydrates teams in one batch query. Total: 2 queries.
 */
export async function getFixturesByDay(
  db: NeonHttpDatabase<typeof schema>,
  date: Date,
): Promise<CompetitionGroup[]> {
  // Day boundaries (UTC)
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // Query fixtures + competition metadata
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
      compSlug: schema.competitions.slug,
      compName: schema.competitions.name,
      compCountryCode: schema.competitions.countryCode,
      compLogoUrl: schema.competitions.logoUrl,
      compDisplayPriority: schema.competitions.displayPriority,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(and(gte(schema.fixtures.kickoffAt, dayStart), lt(schema.fixtures.kickoffAt, dayEnd)))
    .orderBy(asc(schema.competitions.displayPriority), asc(schema.fixtures.kickoffAt));

  if (rows.length === 0) return [];

  // Collect team IDs for batch hydration
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }

  const teamsMap = new Map<number, TeamSnapshot>();
  if (teamIds.size > 0) {
    const teams = await db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        shortName: schema.teams.shortName,
        code: schema.teams.code,
        countryCode: schema.teams.countryCode,
        logoUrl: schema.teams.logoUrl,
        isNational: schema.teams.isNational,
      })
      .from(schema.teams)
      .where(inArray(schema.teams.id, [...teamIds]));

    for (const t of teams) {
      teamsMap.set(t.id, t);
    }
  }

  // Group by competition
  const groupsMap = new Map<number, CompetitionGroup>();

  for (const r of rows) {
    let group = groupsMap.get(r.compId);
    if (!group) {
      group = {
        competition: {
          id: r.compId,
          slug: r.compSlug,
          name: r.compName,
          countryCode: r.compCountryCode,
          logoUrl: r.compLogoUrl,
          displayPriority: r.compDisplayPriority ?? 100,
        },
        fixtures: [],
      };
      groupsMap.set(r.compId, group);
    }

    group.fixtures.push({
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
    });
  }

  // Return sorted by displayPriority (already sorted from query, Map preserves insertion order)
  return [...groupsMap.values()];
}

// ── Multi-day query ──

export interface DaySection {
  date: string; // ISO date string YYYY-MM-DD
  groups: CompetitionGroup[];
}

/**
 * Get fixtures for multiple consecutive days, each day grouped by competition.
 * Returns only days that have fixtures (empty days are skipped).
 */
export async function getFixturesMultiDay(
  db: NeonHttpDatabase<typeof schema>,
  startDate: Date,
  days: number,
): Promise<DaySection[]> {
  const rangeStart = new Date(startDate);
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + days);

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
      compSlug: schema.competitions.slug,
      compName: schema.competitions.name,
      compCountryCode: schema.competitions.countryCode,
      compLogoUrl: schema.competitions.logoUrl,
      compDisplayPriority: schema.competitions.displayPriority,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(and(gte(schema.fixtures.kickoffAt, rangeStart), lt(schema.fixtures.kickoffAt, rangeEnd)))
    .orderBy(asc(schema.fixtures.kickoffAt), asc(schema.competitions.displayPriority));

  if (rows.length === 0) return [];

  // Batch hydrate teams
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }

  const teamsMap = new Map<number, TeamSnapshot>();
  if (teamIds.size > 0) {
    const teams = await db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        shortName: schema.teams.shortName,
        code: schema.teams.code,
        countryCode: schema.teams.countryCode,
        logoUrl: schema.teams.logoUrl,
        isNational: schema.teams.isNational,
      })
      .from(schema.teams)
      .where(inArray(schema.teams.id, [...teamIds]));

    for (const t of teams) {
      teamsMap.set(t.id, t);
    }
  }

  // Group by day, then by competition within each day
  const dayMap = new Map<string, Map<number, CompetitionGroup>>();

  for (const r of rows) {
    const dateKey = r.kickoffAt.toISOString().slice(0, 10);

    let compMap = dayMap.get(dateKey);
    if (!compMap) {
      compMap = new Map();
      dayMap.set(dateKey, compMap);
    }

    let group = compMap.get(r.compId);
    if (!group) {
      group = {
        competition: {
          id: r.compId,
          slug: r.compSlug,
          name: r.compName,
          countryCode: r.compCountryCode,
          logoUrl: r.compLogoUrl,
          displayPriority: r.compDisplayPriority ?? 100,
        },
        fixtures: [],
      };
      compMap.set(r.compId, group);
    }

    group.fixtures.push({
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
    });
  }

  // Build sorted result — days in chronological order, competitions by priority within each day
  const sections: DaySection[] = [];
  for (const [dateKey, compMap] of dayMap) {
    const groups = [...compMap.values()].sort(
      (a, b) => a.competition.displayPriority - b.competition.displayPriority,
    );
    sections.push({ date: dateKey, groups });
  }

  return sections;
}
