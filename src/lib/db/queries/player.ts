import { eq, and, or, asc, desc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { FixtureWithTeams } from '../queries';

// ── Types ──

export interface PlayerDetail {
  id: number;
  slug: string;
  name: Record<string, string>;
  firstname: string | null;
  lastname: string | null;
  position: string | null;
  shirtNumber: number | null;
  photoUrl: string | null;
  birthDate: string | null;
  birthPlace: string | null;
  nationalityCode: string | null;
  height: string | null;
  weight: string | null;
  injured: boolean | null;
  currentTeam: {
    id: number;
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
    logoUrl: string | null;
    countryCode: string | null;
  } | null;
}

export interface PlayerSeasonStat {
  teamId: number;
  competitionId: number;
  seasonYear: number;
  stats: Record<string, unknown>;
  teamName: Record<string, string>;
  competitionName: Record<string, string>;
}

export interface PlayerTransfer {
  id: number;
  date: string | null;
  type: string | null;
  fee: string | null;
  fromTeam: { id: number; name: Record<string, string>; logoUrl: string | null } | null;
  toTeam: { id: number; name: Record<string, string>; logoUrl: string | null } | null;
}

// ── Q1: Player by slug ──

export async function getPlayerBySlug(
  db: NeonHttpDatabase<typeof schema>,
  slug: string,
): Promise<PlayerDetail | null> {
  const rows = await db
    .select({
      id: schema.players.id,
      slug: schema.players.slug,
      name: schema.players.name,
      firstname: schema.players.firstname,
      lastname: schema.players.lastname,
      position: schema.players.position,
      shirtNumber: schema.players.shirtNumber,
      photoUrl: schema.players.photoUrl,
      birthDate: schema.players.birthDate,
      birthPlace: schema.players.birthPlace,
      nationalityCode: schema.players.nationalityCode,
      height: schema.players.height,
      weight: schema.players.weight,
      injured: schema.players.injured,
      currentTeamId: schema.players.currentTeamId,
    })
    .from(schema.players)
    .where(eq(schema.players.slug, slug))
    .limit(1);

  if (rows.length === 0) return null;
  const player = rows[0];

  const currentTeam = player.currentTeamId
    ? await db
        .select({
          id: schema.teams.id,
          name: schema.teams.name,
          shortName: schema.teams.shortName,
          code: schema.teams.code,
          logoUrl: schema.teams.logoUrl,
          countryCode: schema.teams.countryCode,
        })
        .from(schema.teams)
        .where(eq(schema.teams.id, player.currentTeamId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  return {
    id: player.id,
    slug: player.slug,
    name: player.name,
    firstname: player.firstname,
    lastname: player.lastname,
    position: player.position,
    shirtNumber: player.shirtNumber,
    photoUrl: player.photoUrl,
    birthDate: player.birthDate,
    birthPlace: player.birthPlace,
    nationalityCode: player.nationalityCode,
    height: player.height,
    weight: player.weight,
    injured: player.injured,
    currentTeam,
  };
}

// ── Q2: Player's team fixtures ──

export async function getPlayerTeamFixtures(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  limit = 10,
): Promise<FixtureWithTeams[]> {
  const rows = await db
    .select()
    .from(schema.fixtures)
    .where(or(eq(schema.fixtures.homeTeamId, teamId), eq(schema.fixtures.awayTeamId, teamId)))
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(limit);

  return hydrateFixtures(db, rows);
}

// ── Q3: Player season stats ──

export async function getPlayerSeasonStats(
  db: NeonHttpDatabase<typeof schema>,
  playerId: number,
): Promise<PlayerSeasonStat[]> {
  const rows = await db
    .select({
      teamId: schema.playerSeasonStats.teamId,
      competitionId: schema.playerSeasonStats.competitionId,
      seasonYear: schema.playerSeasonStats.seasonYear,
      stats: schema.playerSeasonStats.stats,
    })
    .from(schema.playerSeasonStats)
    .where(eq(schema.playerSeasonStats.playerId, playerId))
    .orderBy(desc(schema.playerSeasonStats.seasonYear));

  if (rows.length === 0) return [];

  // Hydrate team + competition names
  const teamIds = [...new Set(rows.map((r) => r.teamId))];
  const compIds = [...new Set(rows.map((r) => r.competitionId))];

  const [teams, comps] = await Promise.all([
    teamIds.length > 0
      ? db
          .select({ id: schema.teams.id, name: schema.teams.name })
          .from(schema.teams)
          .where(inArray(schema.teams.id, teamIds))
      : [],
    compIds.length > 0
      ? db
          .select({ id: schema.competitions.id, name: schema.competitions.name })
          .from(schema.competitions)
          .where(inArray(schema.competitions.id, compIds))
      : [],
  ]);

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));
  const compMap = new Map(comps.map((c) => [c.id, c.name]));

  return rows.map((r) => ({
    teamId: r.teamId,
    competitionId: r.competitionId,
    seasonYear: r.seasonYear,
    stats: r.stats as Record<string, unknown>,
    teamName: teamMap.get(r.teamId) ?? {},
    competitionName: compMap.get(r.competitionId) ?? {},
  }));
}

// ── Q4: Player transfers ──

export async function getPlayerTransfers(
  db: NeonHttpDatabase<typeof schema>,
  playerId: number,
): Promise<PlayerTransfer[]> {
  const rows = await db
    .select()
    .from(schema.transfers)
    .where(eq(schema.transfers.playerId, playerId))
    .orderBy(desc(schema.transfers.date));

  if (rows.length === 0) return [];

  // Hydrate from/to team names
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.fromTeamId != null) teamIds.add(r.fromTeamId);
    if (r.toTeamId != null) teamIds.add(r.toTeamId);
  }

  const teams =
    teamIds.size > 0
      ? await db
          .select({
            id: schema.teams.id,
            name: schema.teams.name,
            logoUrl: schema.teams.logoUrl,
          })
          .from(schema.teams)
          .where(inArray(schema.teams.id, [...teamIds]))
      : [];

  const teamMap = new Map(teams.map((t) => [t.id, t]));

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    type: r.type,
    fee: r.fee,
    fromTeam: r.fromTeamId ? (teamMap.get(r.fromTeamId) ?? null) : null,
    toTeam: r.toTeamId ? (teamMap.get(r.toTeamId) ?? null) : null,
  }));
}

// ── Q5: Player trophies ──

export interface PlayerTrophy {
  id: number;
  league: string;
  country: string | null;
  season: string | null;
  place: string | null;
}

export async function getPlayerTrophies(
  db: NeonHttpDatabase<typeof schema>,
  playerId: number,
): Promise<PlayerTrophy[]> {
  const rows = await db
    .select({
      id: schema.playerTrophies.id,
      league: schema.playerTrophies.league,
      country: schema.playerTrophies.country,
      season: schema.playerTrophies.season,
      place: schema.playerTrophies.place,
    })
    .from(schema.playerTrophies)
    .where(eq(schema.playerTrophies.playerId, playerId))
    .orderBy(desc(schema.playerTrophies.season));

  return rows;
}

// ── Hydration helpers ──

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

async function hydrateFixtures(
  db: NeonHttpDatabase<typeof schema>,
  fixtures: (typeof schema.fixtures.$inferSelect)[],
): Promise<FixtureWithTeams[]> {
  if (fixtures.length === 0) return [];

  const teamIdSet = new Set<number>();
  const venueIdSet = new Set<number>();
  for (const f of fixtures) {
    if (f.homeTeamId != null) teamIdSet.add(f.homeTeamId);
    if (f.awayTeamId != null) teamIdSet.add(f.awayTeamId);
    if (f.venueId != null) venueIdSet.add(f.venueId);
  }

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
  for (const t of teams) map.set(t.id, t);
  return map;
}

async function getVenuesMap(
  db: NeonHttpDatabase<typeof schema>,
  venueIds: number[],
): Promise<Map<number, { id: number; name: string | null; city: string | null }>> {
  if (venueIds.length === 0) return new Map();
  const venues = await db
    .select({ id: schema.venues.id, name: schema.venues.name, city: schema.venues.city })
    .from(schema.venues)
    .where(inArray(schema.venues.id, venueIds));

  const map = new Map<number, { id: number; name: string | null; city: string | null }>();
  for (const v of venues) map.set(v.id, v);
  return map;
}

// ── Last N ratings for sparkline ──

export async function getPlayerLastRatings(
  db: NeonHttpDatabase<typeof schema>,
  playerId: number,
  n = 5,
): Promise<number[]> {
  const rows = await db
    .select({
      rating: schema.fixturePlayerStats.rating,
      kickoffAt: schema.fixtures.kickoffAt,
    })
    .from(schema.fixturePlayerStats)
    .innerJoin(schema.fixtures, eq(schema.fixturePlayerStats.fixtureId, schema.fixtures.id))
    .where(
      and(
        eq(schema.fixturePlayerStats.playerId, playerId),
        sql`${schema.fixturePlayerStats.rating} IS NOT NULL`,
      ),
    )
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(n);

  // Return oldest-first for chart rendering
  return rows.reverse().map((r) => Number(r.rating));
}
