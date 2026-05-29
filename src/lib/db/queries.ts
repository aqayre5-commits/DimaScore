import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// ── Shared types ──

type TeamSnapshot = {
  id: number;
  slug: string;
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
};

type VenueSnapshot = {
  id: number;
  name: string | null;
  city: string | null;
};

export interface FixtureWithTeams {
  id: number;
  round: string | null;
  roundNumber: number | null;
  kickoffAt: Date;
  statusCode: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  venueId: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  venue: VenueSnapshot | null;
}

export interface StandingRow {
  groupLabel: string;
  teamId: number | null;
  rank: number;
  points: number;
  played: number;
  won: number | null;
  drawn: number | null;
  lost: number | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  goalDiff: number | null;
  form: string | null;
  description: string | null;
  team: TeamSnapshot | null;
}

// ── Q1: Featured match ──

/**
 * Get the featured match for a competition.
 * Algorithm (WC 2026 pre-tournament): first Morocco fixture by kickoff.
 * Returns null if no fixtures found.
 *
 * NOTE: This function takes a specific team ID (moroccoTeamId) which couples
 * it to a Morocco-first selection strategy. When competition-league.md is
 * instantiated for Botola Pro, the featured match algorithm will need
 * different logic (e.g. Wydad/Raja next match, or stakes-weighted selection).
 * Generalize in Phase 6 league sub-task — see BACKLOG.
 */
export async function getFeaturedMatch(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  moroccoTeamId: number,
): Promise<FixtureWithTeams | null> {
  // Find first upcoming Morocco fixture
  const moroccoFixtures = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        sql`(${schema.fixtures.homeTeamId} = ${moroccoTeamId} OR ${schema.fixtures.awayTeamId} = ${moroccoTeamId})`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(1);

  if (moroccoFixtures.length === 0) {
    // Fallback: first fixture overall
    const firstFixture = await db
      .select()
      .from(schema.fixtures)
      .where(
        and(
          eq(schema.fixtures.competitionId, competitionId),
          eq(schema.fixtures.seasonYear, seasonYear),
        ),
      )
      .orderBy(asc(schema.fixtures.kickoffAt))
      .limit(1);

    if (firstFixture.length === 0) return null;
    return hydrateFixtures(db, firstFixture).then((r) => r[0] ?? null);
  }

  return hydrateFixtures(db, moroccoFixtures).then((r) => r[0] ?? null);
}

// ── Q2: Fixtures by round ──

/**
 * Get all fixtures for a competition round, hydrated with team + venue data.
 * Batched: 3 queries total (fixtures + teams + venues), not N+1.
 */
export async function getFixturesByRound(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
  roundNumber: number,
): Promise<FixtureWithTeams[]> {
  const rows = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
        eq(schema.fixtures.roundNumber, roundNumber),
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt));

  return hydrateFixtures(db, rows);
}

// ── Q2b: Knockout fixtures (whitelisted rounds only) ──

const KNOCKOUT_ROUNDS = [
  'Round of 128',
  'Round of 64',
  'Round of 32',
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  'Semi-Finals',
  '3rd Place Final',
  '3rd place',
  'Final',
];

/**
 * Get all knockout-stage fixtures for a competition season.
 * Uses a whitelist of known knockout round names to exclude qualifying,
 * preliminary, regular season, and group-stage rounds.
 */
export async function getKnockoutFixtures(
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
        inArray(schema.fixtures.round, KNOCKOUT_ROUNDS),
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt));

  return hydrateFixtures(db, rows);
}

// ── Q3: Standings by competition ──

/**
 * Get all standings rows for a competition season, ordered by group then rank.
 */
export async function getStandings(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  seasonYear: number,
): Promise<StandingRow[]> {
  const rows = await db
    .select()
    .from(schema.standings)
    .where(
      and(
        eq(schema.standings.competitionId, competitionId),
        eq(schema.standings.seasonYear, seasonYear),
      ),
    )
    .orderBy(asc(schema.standings.groupLabel), asc(schema.standings.rank));

  // Filter out "Ranking of third-placed teams" pseudo-group from API-Football
  const filtered = rows.filter((r) => !r.groupLabel.toLowerCase().includes('ranking'));

  const teamIds = [
    ...new Set(filtered.map((r) => r.teamId).filter((id): id is number => id != null)),
  ];
  const teamsMap = await getTeamsMap(db, teamIds);

  return filtered.map((r) => ({
    groupLabel: r.groupLabel.replace(/^Group\s+/i, ''),
    teamId: r.teamId,
    rank: r.rank,
    points: r.points,
    played: r.played,
    won: r.won,
    drawn: r.drawn,
    lost: r.lost,
    goalsFor: r.goalsFor,
    goalsAgainst: r.goalsAgainst,
    goalDiff: r.goalDiff,
    form: r.form,
    description: r.description,
    team: r.teamId ? (teamsMap.get(r.teamId) ?? null) : null,
  }));
}

// ── Q4: Morocco team lookup ──

/**
 * Find Morocco's team ID for national team tournaments.
 * Returns null if not found.
 */
export async function getMoroccoTeamId(
  db: NeonHttpDatabase<typeof schema>,
): Promise<number | null> {
  const rows = await db
    .select({ id: schema.teams.id })
    .from(schema.teams)
    .where(and(eq(schema.teams.code, 'MA'), eq(schema.teams.isNational, true)))
    .limit(1);

  return rows.length > 0 ? rows[0].id : null;
}

// ── Batch hydration helpers ──

/**
 * Hydrate an array of raw fixture rows with team + venue data in batch.
 * Collects all distinct team IDs and venue IDs, runs ONE team query and
 * ONE venue query, then assembles in memory. Total: fixtures query + 2.
 */
async function hydrateFixtures(
  db: NeonHttpDatabase<typeof schema>,
  fixtures: (typeof schema.fixtures.$inferSelect)[],
): Promise<FixtureWithTeams[]> {
  if (fixtures.length === 0) return [];

  // Collect distinct IDs
  const teamIdSet = new Set<number>();
  const venueIdSet = new Set<number>();
  for (const f of fixtures) {
    if (f.homeTeamId != null) teamIdSet.add(f.homeTeamId);
    if (f.awayTeamId != null) teamIdSet.add(f.awayTeamId);
    if (f.venueId != null) venueIdSet.add(f.venueId);
  }

  // Batch fetch teams and venues in parallel
  const [teamsMap, venuesMap] = await Promise.all([
    getTeamsMap(db, [...teamIdSet]),
    getVenuesMap(db, [...venueIdSet]),
  ]);

  return fixtures.map((f) => ({
    id: f.id,
    round: f.round,
    roundNumber: f.roundNumber,
    kickoffAt: f.kickoffAt,
    statusCode: f.statusCode,
    homeTeamId: f.homeTeamId,
    awayTeamId: f.awayTeamId,
    homeScore: f.homeScore,
    awayScore: f.awayScore,
    homeScoreHt: f.homeScoreHt,
    awayScoreHt: f.awayScoreHt,
    venueId: f.venueId,
    homeTeam: f.homeTeamId ? (teamsMap.get(f.homeTeamId) ?? null) : null,
    awayTeam: f.awayTeamId ? (teamsMap.get(f.awayTeamId) ?? null) : null,
    venue: f.venueId ? (venuesMap.get(f.venueId) ?? null) : null,
  }));
}

async function getTeamsMap(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: number[],
): Promise<Map<number, TeamSnapshot>> {
  if (teamIds.length === 0) return new Map();

  const teams = await db
    .select({
      id: schema.teams.id,
      slug: schema.teams.slug,
      name: schema.teams.name,
      shortName: schema.teams.shortName,
      code: schema.teams.code,
      countryCode: schema.teams.countryCode,
      logoUrl: schema.teams.logoUrl,
      isNational: schema.teams.isNational,
    })
    .from(schema.teams)
    .where(inArray(schema.teams.id, teamIds));

  const map = new Map<number, TeamSnapshot>();
  for (const t of teams) {
    map.set(t.id, t);
  }
  return map;
}

async function getVenuesMap(
  db: NeonHttpDatabase<typeof schema>,
  venueIds: number[],
): Promise<Map<number, VenueSnapshot>> {
  if (venueIds.length === 0) return new Map();

  const venues = await db
    .select({
      id: schema.venues.id,
      name: schema.venues.name,
      city: schema.venues.city,
    })
    .from(schema.venues)
    .where(inArray(schema.venues.id, venueIds));

  const map = new Map<number, VenueSnapshot>();
  for (const v of venues) {
    map.set(v.id, v);
  }
  return map;
}

// ── Q5: Ticker fixtures (live or upcoming across all competitions) ──

type CompetitionSnapshot = {
  id: number;
  name: Record<string, string>;
  logoUrl: string | null;
  slug: string;
};

export interface TickerFixture {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  competition: CompetitionSnapshot;
}

export type TickerResult = { mode: 'fixtures'; fixtures: TickerFixture[] } | { mode: 'empty' };

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];

const TICKER_SELECT = {
  id: schema.fixtures.id,
  kickoffAt: schema.fixtures.kickoffAt,
  statusCode: schema.fixtures.statusCode,
  minute: schema.fixtures.minute,
  homeTeamId: schema.fixtures.homeTeamId,
  awayTeamId: schema.fixtures.awayTeamId,
  homeScore: schema.fixtures.homeScore,
  awayScore: schema.fixtures.awayScore,
  compId: schema.competitions.id,
  compName: schema.competitions.name,
  compLogo: schema.competitions.logoUrl,
  compSlug: schema.competitions.slug,
} as const;

/**
 * Get fixtures for the global ticker strip.
 * Runs live + upcoming queries in parallel, concatenates (live first),
 * caps at max(15, liveCount). Hydrates teams in one batch. 3 queries total.
 */
export async function getTickerFixtures(
  db: NeonHttpDatabase<typeof schema>,
): Promise<TickerResult> {
  const [liveRows, upcomingRows] = await Promise.all([
    db
      .select(TICKER_SELECT)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .where(
        and(
          inArray(schema.fixtures.statusCode, LIVE_STATUSES),
          sql`${schema.fixtures.updatedAt} > NOW() - INTERVAL '6 hours'`,
        ),
      )
      .orderBy(asc(schema.fixtures.kickoffAt)),
    db
      .select(TICKER_SELECT)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .where(and(eq(schema.fixtures.statusCode, 'NS'), sql`${schema.fixtures.kickoffAt} > NOW()`))
      .orderBy(asc(schema.fixtures.kickoffAt))
      .limit(15),
  ]);

  const upcomingSlack = Math.max(0, 15 - liveRows.length);
  const combined = [...liveRows, ...upcomingRows.slice(0, upcomingSlack)];

  if (combined.length === 0) return { mode: 'empty' };

  const fixtures = await hydrateTickerRows(db, combined);
  return { mode: 'fixtures', fixtures };
}

type TickerRow = {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  compId: number;
  compName: Record<string, string>;
  compLogo: string | null;
  compSlug: string;
};

async function hydrateTickerRows(
  db: NeonHttpDatabase<typeof schema>,
  rows: TickerRow[],
): Promise<TickerFixture[]> {
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }
  const teamsMap = await getTeamsMap(db, [...teamIds]);

  return rows.map((r) => ({
    id: r.id,
    kickoffAt: r.kickoffAt,
    statusCode: r.statusCode,
    minute: r.minute,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    homeTeam: r.homeTeamId ? (teamsMap.get(r.homeTeamId) ?? null) : null,
    awayTeam: r.awayTeamId ? (teamsMap.get(r.awayTeamId) ?? null) : null,
    competition: {
      id: r.compId,
      name: r.compName,
      logoUrl: r.compLogo,
      slug: r.compSlug,
    },
  }));
}

// ── Original query ──

export async function getCurrentSeasons(db: NeonHttpDatabase<typeof schema>): Promise<
  {
    competitionId: number;
    year: number;
    isWomen: boolean;
    hasStandingsCoverage: boolean;
  }[]
> {
  const rows = await db
    .select({
      competitionId: schema.seasons.competitionId,
      year: schema.seasons.year,
      isWomen: schema.competitions.isWomen,
      hasStandingsCoverage: schema.leagueCoverage.standings,
    })
    .from(schema.seasons)
    .innerJoin(schema.competitions, eq(schema.seasons.competitionId, schema.competitions.id))
    .leftJoin(
      schema.leagueCoverage,
      and(
        eq(schema.leagueCoverage.leagueId, schema.seasons.competitionId),
        eq(schema.leagueCoverage.season, schema.seasons.year),
      ),
    )
    .where(eq(schema.seasons.isCurrent, true));

  return rows.map((r) => ({
    competitionId: r.competitionId,
    year: r.year,
    isWomen: r.isWomen ?? false,
    hasStandingsCoverage: r.hasStandingsCoverage ?? false,
  }));
}
