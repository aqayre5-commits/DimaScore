import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';

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

// ── Match detail ──

export interface MatchDetail {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
  round: string | null;
  referee: string | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScoreFt: number | null;
  awayScoreFt: number | null;
  homeScoreEt: number | null;
  awayScoreEt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  competition: {
    id: number;
    slug: string;
    name: Record<string, string>;
    countryCode: string | null;
    logoUrl: string | null;
  };
  venue: {
    id: number;
    name: string | null;
    city: string | null;
    capacity: number | null;
    imageUrl: string | null;
  } | null;
  seasonYear: number;
}

export async function getMatchDetail(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchDetail | null> {
  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      extraMinute: schema.fixtures.extraMinute,
      round: schema.fixtures.round,
      referee: schema.fixtures.referee,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      homeScoreHt: schema.fixtures.homeScoreHt,
      awayScoreHt: schema.fixtures.awayScoreHt,
      homeScoreFt: schema.fixtures.homeScoreFt,
      awayScoreFt: schema.fixtures.awayScoreFt,
      homeScoreEt: schema.fixtures.homeScoreEt,
      awayScoreEt: schema.fixtures.awayScoreEt,
      homeScorePen: schema.fixtures.homeScorePen,
      awayScorePen: schema.fixtures.awayScorePen,
      venueId: schema.fixtures.venueId,
      seasonYear: schema.fixtures.seasonYear,
      compId: schema.competitions.id,
      compSlug: schema.competitions.slug,
      compName: schema.competitions.name,
      compCountryCode: schema.competitions.countryCode,
      compLogoUrl: schema.competitions.logoUrl,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(eq(schema.fixtures.id, fixtureId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];

  // Hydrate teams
  const teamIds: number[] = [];
  if (row.homeTeamId != null) teamIds.push(row.homeTeamId);
  if (row.awayTeamId != null) teamIds.push(row.awayTeamId);

  const teamsMap = new Map<number, TeamSnapshot>();
  if (teamIds.length > 0) {
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

    for (const t of teams) {
      teamsMap.set(t.id, t);
    }
  }

  // Hydrate venue
  let venue: MatchDetail['venue'] = null;
  if (row.venueId != null) {
    const venueRows = await db
      .select({
        id: schema.venues.id,
        name: schema.venues.name,
        city: schema.venues.city,
        capacity: schema.venues.capacity,
        imageUrl: schema.venues.imageUrl,
      })
      .from(schema.venues)
      .where(eq(schema.venues.id, row.venueId))
      .limit(1);

    if (venueRows.length > 0) venue = venueRows[0];
  }

  return {
    id: row.id,
    kickoffAt: row.kickoffAt,
    statusCode: row.statusCode,
    minute: row.minute,
    extraMinute: row.extraMinute,
    round: row.round,
    referee: row.referee,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeScoreHt: row.homeScoreHt,
    awayScoreHt: row.awayScoreHt,
    homeScoreFt: row.homeScoreFt,
    awayScoreFt: row.awayScoreFt,
    homeScoreEt: row.homeScoreEt,
    awayScoreEt: row.awayScoreEt,
    homeScorePen: row.homeScorePen,
    awayScorePen: row.awayScorePen,
    homeTeam: row.homeTeamId ? (teamsMap.get(row.homeTeamId) ?? null) : null,
    awayTeam: row.awayTeamId ? (teamsMap.get(row.awayTeamId) ?? null) : null,
    competition: {
      id: row.compId,
      slug: row.compSlug,
      name: row.compName,
      countryCode: row.compCountryCode,
      logoUrl: row.compLogoUrl,
    },
    venue,
    seasonYear: row.seasonYear,
  };
}

// ── Match events ──

export interface MatchEvent {
  id: number;
  minute: number;
  extraMinute: number | null;
  type: string;
  detail: string | null;
  comments: string | null;
  teamId: number | null;
  player: { id: number; name: Record<string, string> } | null;
  assist: { id: number; name: Record<string, string> } | null;
}

export async function getMatchEvents(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchEvent[]> {
  // Use raw SQL for the double-join on players (Drizzle doesn't alias well for self-joins)
  const rows = await db.execute(sql`
    SELECT
      e.id,
      e.minute,
      e.extra_minute AS "extraMinute",
      e.type,
      e.detail,
      e.comments,
      e.team_id AS "teamId",
      e.player_id AS "playerId",
      p.name AS "playerName",
      e.assist_player_id AS "assistPlayerId",
      a.name AS "assistName"
    FROM fixture_events e
    LEFT JOIN players p ON p.id = e.player_id
    LEFT JOIN players a ON a.id = e.assist_player_id
    WHERE e.fixture_id = ${fixtureId}
    ORDER BY e.minute ASC, e.extra_minute ASC NULLS FIRST
  `);

  return (rows.rows as RawEventRow[]).map((r) => ({
    id: Number(r.id),
    minute: r.minute,
    extraMinute: r.extraMinute,
    type: r.type,
    detail: r.detail,
    comments: r.comments,
    teamId: r.teamId != null ? Number(r.teamId) : null,
    player:
      r.playerId != null
        ? { id: Number(r.playerId), name: r.playerName as Record<string, string> }
        : null,
    assist:
      r.assistPlayerId != null
        ? { id: Number(r.assistPlayerId), name: r.assistName as Record<string, string> }
        : null,
  }));
}

type RawEventRow = {
  id: number;
  minute: number;
  extraMinute: number | null;
  type: string;
  detail: string | null;
  comments: string | null;
  teamId: number | null;
  playerId: number | null;
  playerName: unknown;
  assistPlayerId: number | null;
  assistName: unknown;
};

// ── Match lineups ──

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  pos: string | null;
  grid: string | null;
}

export interface MatchLineup {
  teamId: number;
  formation: string | null;
  coach: { id: number; name: string } | null;
  starters: LineupPlayer[];
  substitutes: Omit<LineupPlayer, 'grid'>[];
}

export async function getMatchLineups(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchLineup[]> {
  const rows = await db
    .select({
      teamId: schema.fixtureLineups.teamId,
      formation: schema.fixtureLineups.formation,
      coachId: schema.fixtureLineups.coachId,
      starters: schema.fixtureLineups.starters,
      substitutes: schema.fixtureLineups.substitutes,
      coachName: schema.coaches.name,
    })
    .from(schema.fixtureLineups)
    .leftJoin(schema.coaches, eq(schema.fixtureLineups.coachId, schema.coaches.id))
    .where(eq(schema.fixtureLineups.fixtureId, fixtureId));

  return rows.map((r) => {
    const rawStarters = r.starters as Array<LineupPlayer | { player: LineupPlayer }>;
    const rawSubs = r.substitutes as Array<
      Omit<LineupPlayer, 'grid'> | { player: Omit<LineupPlayer, 'grid'> }
    >;

    return {
      teamId: r.teamId,
      formation: r.formation,
      coach: r.coachId != null && r.coachName != null ? { id: r.coachId, name: r.coachName } : null,
      starters: rawStarters.map((s) => ('player' in s ? s.player : s)),
      substitutes: rawSubs.map((s) => ('player' in s ? s.player : s)),
    };
  });
}

// ── Match statistics ──

export interface StatEntry {
  type: string;
  value: number | string | null;
}

export interface MatchTeamStats {
  teamId: number;
  stats: StatEntry[];
}

export async function getMatchStatistics(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchTeamStats[]> {
  const rows = await db
    .select({
      teamId: schema.fixtureStatistics.teamId,
      stats: schema.fixtureStatistics.stats,
    })
    .from(schema.fixtureStatistics)
    .where(eq(schema.fixtureStatistics.fixtureId, fixtureId));

  return rows.map((r) => ({
    teamId: r.teamId,
    stats: r.stats as StatEntry[],
  }));
}

// ── Match player stats ──

export interface MatchPlayerStat {
  playerId: number;
  teamId: number;
  playerName: Record<string, string>;
  playerPhoto: string | null;
  position: string | null;
  minutesPlayed: number | null;
  rating: string | null;
  captain: boolean | null;
  substitute: boolean | null;
  stats: Record<string, unknown>;
}

export async function getMatchPlayerStats(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchPlayerStat[]> {
  const rows = await db
    .select({
      playerId: schema.fixturePlayerStats.playerId,
      teamId: schema.fixturePlayerStats.teamId,
      position: schema.fixturePlayerStats.position,
      minutesPlayed: schema.fixturePlayerStats.minutesPlayed,
      rating: schema.fixturePlayerStats.rating,
      captain: schema.fixturePlayerStats.captain,
      substitute: schema.fixturePlayerStats.substitute,
      stats: schema.fixturePlayerStats.stats,
      playerName: schema.players.name,
      playerPhoto: schema.players.photoUrl,
    })
    .from(schema.fixturePlayerStats)
    .innerJoin(schema.players, eq(schema.fixturePlayerStats.playerId, schema.players.id))
    .where(eq(schema.fixturePlayerStats.fixtureId, fixtureId))
    .orderBy(
      asc(schema.fixturePlayerStats.teamId),
      asc(schema.fixturePlayerStats.substitute),
      asc(schema.fixturePlayerStats.position),
    );

  return rows.map((r) => ({
    playerId: r.playerId,
    teamId: r.teamId,
    playerName: r.playerName,
    playerPhoto: r.playerPhoto,
    position: r.position,
    minutesPlayed: r.minutesPlayed,
    rating: r.rating,
    captain: r.captain,
    substitute: r.substitute,
    stats: r.stats as Record<string, unknown>,
  }));
}

// ── Head to head ──

export interface H2HFixture {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  competitionName: Record<string, string>;
  competitionSlug: string;
}

export async function getHeadToHead(
  db: NeonHttpDatabase<typeof schema>,
  teamAId: number,
  teamBId: number,
  excludeFixtureId: number,
): Promise<H2HFixture[]> {
  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      compName: schema.competitions.name,
      compSlug: schema.competitions.slug,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      and(
        sql`${schema.fixtures.id} != ${excludeFixtureId}`,
        inArray(schema.fixtures.statusCode, ['FT', 'AET', 'PEN']),
        sql`(
          (${schema.fixtures.homeTeamId} = ${teamAId} AND ${schema.fixtures.awayTeamId} = ${teamBId})
          OR
          (${schema.fixtures.homeTeamId} = ${teamBId} AND ${schema.fixtures.awayTeamId} = ${teamAId})
        )`,
      ),
    )
    .orderBy(sql`${schema.fixtures.kickoffAt} DESC`)
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    kickoffAt: r.kickoffAt,
    statusCode: r.statusCode,
    homeTeamId: r.homeTeamId,
    awayTeamId: r.awayTeamId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    competitionName: r.compName,
    competitionSlug: r.compSlug,
  }));
}

// ── Match coverage ──

export interface MatchCoverage {
  events: boolean;
  lineups: boolean;
  statisticsFixtures: boolean;
  statisticsPlayers: boolean;
  predictions: boolean;
}

export async function getMatchCoverage(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number,
  season: number,
): Promise<MatchCoverage | null> {
  const rows = await db
    .select({
      events: schema.leagueCoverage.events,
      lineups: schema.leagueCoverage.lineups,
      statisticsFixtures: schema.leagueCoverage.statisticsFixtures,
      statisticsPlayers: schema.leagueCoverage.statisticsPlayers,
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

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    events: r.events ?? false,
    lineups: r.lineups ?? false,
    statisticsFixtures: r.statisticsFixtures ?? false,
    statisticsPlayers: r.statisticsPlayers ?? false,
    predictions: r.predictions ?? false,
  };
}
