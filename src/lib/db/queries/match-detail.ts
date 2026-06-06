import { cache } from 'react';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { TeamSnapshot } from '../queries-hydrate';

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

export const getMatchDetail = cache(async function getMatchDetail(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<MatchDetail | null> {
  // Single query: fixture + competition + venue (LEFT JOIN)
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
      seasonYear: schema.fixtures.seasonYear,
      compId: schema.competitions.id,
      compSlug: schema.competitions.slug,
      compName: schema.competitions.name,
      compCountryCode: schema.competitions.countryCode,
      compLogoUrl: schema.competitions.logoUrl,
      venueId: schema.venues.id,
      venueName: schema.venues.name,
      venueCity: schema.venues.city,
      venueCapacity: schema.venues.capacity,
      venueImageUrl: schema.venues.imageUrl,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .leftJoin(schema.venues, eq(schema.fixtures.venueId, schema.venues.id))
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

  const venue: MatchDetail['venue'] = row.venueId
    ? {
        id: row.venueId,
        name: row.venueName,
        city: row.venueCity,
        capacity: row.venueCapacity,
        imageUrl: row.venueImageUrl,
      }
    : null;

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
});

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
  photoUrl: string | null;
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

  // Collect all player IDs from starters to hydrate photos
  type RawPlayer = {
    id: number;
    name: string;
    number: number;
    pos: string | null;
    grid?: string | null;
  };
  const allPlayerIds = new Set<number>();
  const parsed = rows.map((r) => {
    const rawStarters = (r.starters as Array<RawPlayer | { player: RawPlayer }>).map((s) =>
      'player' in s ? s.player : s,
    );
    const rawSubs = (r.substitutes as Array<RawPlayer | { player: RawPlayer }>).map((s) =>
      'player' in s ? s.player : s,
    );
    for (const p of [...rawStarters, ...rawSubs]) allPlayerIds.add(p.id);
    return {
      teamId: r.teamId,
      formation: r.formation,
      coachId: r.coachId,
      coachName: r.coachName,
      rawStarters,
      rawSubs,
    };
  });

  // Batch-fetch photos from players table
  const photoMap = new Map<number, string | null>();
  if (allPlayerIds.size > 0) {
    const playerRows = await db
      .select({ id: schema.players.id, photoUrl: schema.players.photoUrl })
      .from(schema.players)
      .where(inArray(schema.players.id, [...allPlayerIds]));
    for (const pr of playerRows) photoMap.set(pr.id, pr.photoUrl);
  }

  return parsed.map((r) => ({
    teamId: r.teamId,
    formation: r.formation,
    coach: r.coachId != null && r.coachName != null ? { id: r.coachId, name: r.coachName } : null,
    starters: r.rawStarters.map((s) => ({
      id: s.id,
      name: s.name,
      number: s.number,
      pos: s.pos,
      grid: s.grid ?? null,
      photoUrl: photoMap.get(s.id) ?? null,
    })),
    substitutes: r.rawSubs.map((s) => ({
      id: s.id,
      name: s.name,
      number: s.number,
      pos: s.pos,
      photoUrl: photoMap.get(s.id) ?? null,
    })),
  }));
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

  return rows.map((r) => {
    const raw = r.stats;
    // Handle both object { "Fouls": 9, ... } and array [{ type, value }] formats
    const stats: StatEntry[] = Array.isArray(raw)
      ? raw
      : raw && typeof raw === 'object'
        ? Object.entries(raw as Record<string, unknown>).map(([type, value]) => ({
            type,
            value: value as number | string | null,
          }))
        : [];
    return { teamId: r.teamId, stats };
  });
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

// ── Next fixtures for teams ──

export interface NextFixture {
  id: number;
  kickoffAt: Date;
  teamId: number;
  opponentName: Record<string, string>;
  opponentLogoUrl: string | null;
  competitionName: Record<string, string>;
  competitionLogoUrl: string | null;
  isHome: boolean;
}

export async function getNextFixtures(
  db: NeonHttpDatabase<typeof schema>,
  homeTeamId: number,
  awayTeamId: number,
  excludeFixtureId: number,
): Promise<NextFixture[]> {
  // Two simple queries in parallel instead of one expensive window function
  const nextForTeam = (teamId: number) =>
    db.execute(sql`
      SELECT f.id, f.kickoff_at, f.home_team_id, f.away_team_id,
             c.name AS comp_name, c.logo_url AS comp_logo
      FROM fixtures f
      INNER JOIN competitions c ON c.id = f.competition_id
      WHERE f.status_code = 'NS'
        AND f.kickoff_at > NOW()
        AND f.id != ${excludeFixtureId}
        AND (f.home_team_id = ${teamId} OR f.away_team_id = ${teamId})
        -- Skip fixtures with an undetermined slot (e.g. unclinched knockout brackets),
        -- so the "next match" widget never renders a "TBD" opponent. Prefers the next
        -- fully-determined fixture (the upcoming group game) instead.
        AND f.home_team_id IS NOT NULL
        AND f.away_team_id IS NOT NULL
      ORDER BY f.kickoff_at ASC
      LIMIT 1
    `);

  const [homeRes, awayRes] = await Promise.all([nextForTeam(homeTeamId), nextForTeam(awayTeamId)]);

  type RawRow = {
    id: number;
    kickoff_at: string;
    home_team_id: number;
    away_team_id: number;
    comp_name: Record<string, string>;
    comp_logo: string | null;
  };
  const raw: { row: RawRow; ourTeamId: number }[] = [];
  if (homeRes.rows.length > 0) raw.push({ row: homeRes.rows[0] as RawRow, ourTeamId: homeTeamId });
  if (awayRes.rows.length > 0) raw.push({ row: awayRes.rows[0] as RawRow, ourTeamId: awayTeamId });

  if (raw.length === 0) return [];

  // Hydrate opponent teams
  const teamIds = new Set<number>();
  for (const { row } of raw) {
    teamIds.add(row.home_team_id);
    teamIds.add(row.away_team_id);
  }

  const teamsMap = new Map<number, { name: Record<string, string>; logoUrl: string | null }>();
  if (teamIds.size > 0) {
    const teams = await db
      .select({ id: schema.teams.id, name: schema.teams.name, logoUrl: schema.teams.logoUrl })
      .from(schema.teams)
      .where(inArray(schema.teams.id, [...teamIds]));
    for (const t of teams) teamsMap.set(t.id, { name: t.name, logoUrl: t.logoUrl });
  }

  return raw.map(({ row: r, ourTeamId }) => {
    const isOurTeamHome = r.home_team_id === ourTeamId;
    const opponentId = isOurTeamHome ? r.away_team_id : r.home_team_id;
    const opponent = teamsMap.get(opponentId);
    return {
      id: r.id,
      kickoffAt: new Date(r.kickoff_at),
      teamId: ourTeamId,
      opponentName: opponent?.name ?? { en: 'TBD' },
      opponentLogoUrl: opponent?.logoUrl ?? null,
      competitionName: r.comp_name,
      competitionLogoUrl: r.comp_logo,
      isHome: isOurTeamHome,
    };
  });
}
