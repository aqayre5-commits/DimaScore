import { eq, and, or, asc, desc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { FixtureWithTeams, StandingRow } from '../queries';
import { hydrateFixtures, getTeamsMap } from '../queries-hydrate';

// ── Types ──

export interface TeamDetail {
  id: number;
  slug: string;
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  founded: number | null;
  logoUrl: string | null;
  isNational: boolean | null;
  isWomen: boolean | null;
  venue: { id: number; name: string | null; city: string | null; capacity: number | null } | null;
  coach: { id: number; name: string; photoUrl: string | null } | null;
}

export interface SquadPlayer {
  id: number;
  slug: string;
  name: Record<string, string>;
  firstname: string | null;
  lastname: string | null;
  position: string | null;
  shirtNumber: number | null;
  photoUrl: string | null;
  birthDate: string | null;
  nationalityCode: string | null;
  injured: boolean | null;
}

// ── Q1: Team by slug ──

export async function getTeamBySlug(
  db: NeonHttpDatabase<typeof schema>,
  slug: string,
): Promise<TeamDetail | null> {
  const rows = await db
    .select({
      id: schema.teams.id,
      slug: schema.teams.slug,
      name: schema.teams.name,
      shortName: schema.teams.shortName,
      code: schema.teams.code,
      countryCode: schema.teams.countryCode,
      founded: schema.teams.founded,
      logoUrl: schema.teams.logoUrl,
      isNational: schema.teams.isNational,
      isWomen: schema.teams.isWomen,
      venueId: schema.teams.venueId,
    })
    .from(schema.teams)
    .where(eq(schema.teams.slug, slug))
    .limit(1);

  if (rows.length === 0) return null;
  const team = rows[0];

  // Batch: fetch venue + coach in parallel
  const [venue, coach] = await Promise.all([
    team.venueId
      ? db
          .select({
            id: schema.venues.id,
            name: schema.venues.name,
            city: schema.venues.city,
            capacity: schema.venues.capacity,
          })
          .from(schema.venues)
          .where(eq(schema.venues.id, team.venueId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null,
    db
      .select({
        id: schema.coaches.id,
        name: schema.coaches.name,
        photoUrl: schema.coaches.photoUrl,
      })
      .from(schema.coaches)
      .where(eq(schema.coaches.currentTeamId, team.id))
      .limit(1)
      .then((r) => r[0] ?? null),
  ]);

  return {
    id: team.id,
    slug: team.slug,
    name: team.name,
    shortName: team.shortName,
    code: team.code,
    countryCode: team.countryCode,
    founded: team.founded,
    logoUrl: team.logoUrl,
    isNational: team.isNational,
    isWomen: team.isWomen,
    venue,
    coach,
  };
}

// ── Q2: Team fixtures (upcoming + recent) ──

export async function getTeamFixtures(
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

// ── Q2b: Team fixtures with competition info (for grouped match list) ──

export interface CompetitionSnapshot {
  id: number;
  name: Record<string, string>;
  logoUrl: string | null;
}

export interface FixtureWithCompetition extends FixtureWithTeams {
  competition: CompetitionSnapshot | null;
}

export async function getTeamFixturesWithCompetition(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  limit = 40,
): Promise<FixtureWithCompetition[]> {
  const rows = await db
    .select()
    .from(schema.fixtures)
    .where(or(eq(schema.fixtures.homeTeamId, teamId), eq(schema.fixtures.awayTeamId, teamId)))
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(limit);

  const hydrated = await hydrateFixtures(db, rows);

  // Hydrate competition names
  const compIds = [
    ...new Set(rows.map((r) => r.competitionId).filter((id): id is number => id != null)),
  ];
  const compsMap = await getCompetitionsMap(db, compIds);

  return hydrated.map((f, i) => ({
    ...f,
    competition: rows[i].competitionId ? (compsMap.get(rows[i].competitionId!) ?? null) : null,
  }));
}

async function getCompetitionsMap(
  db: NeonHttpDatabase<typeof schema>,
  compIds: number[],
): Promise<Map<number, CompetitionSnapshot>> {
  if (compIds.length === 0) return new Map();
  const comps = await db
    .select({
      id: schema.competitions.id,
      name: schema.competitions.name,
      logoUrl: schema.competitions.logoUrl,
    })
    .from(schema.competitions)
    .where(inArray(schema.competitions.id, compIds));

  const map = new Map<number, CompetitionSnapshot>();
  for (const c of comps) map.set(c.id, c);
  return map;
}

// ── Q3: Team squad ──

export async function getTeamSquad(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<SquadPlayer[]> {
  // Use squad_members junction table (supports players in multiple squads)
  // Fall back to currentTeamId if no squad_members rows exist
  const memberRows = await db
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
      nationalityCode: schema.players.nationalityCode,
      injured: schema.players.injured,
    })
    .from(schema.squadMembers)
    .innerJoin(schema.players, eq(schema.squadMembers.playerId, schema.players.id))
    .where(eq(schema.squadMembers.teamId, teamId))
    .orderBy(
      sql`CASE ${schema.players.position}
        WHEN 'Goalkeeper' THEN 1
        WHEN 'Defender' THEN 2
        WHEN 'Midfielder' THEN 3
        WHEN 'Attacker' THEN 4
        ELSE 5
      END`,
      asc(schema.players.shirtNumber),
    );

  if (memberRows.length > 0) return memberRows;

  // Fallback for teams not yet synced to squad_members
  return db
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
      nationalityCode: schema.players.nationalityCode,
      injured: schema.players.injured,
    })
    .from(schema.players)
    .where(eq(schema.players.currentTeamId, teamId))
    .orderBy(
      sql`CASE position
        WHEN 'Goalkeeper' THEN 1
        WHEN 'Defender' THEN 2
        WHEN 'Midfielder' THEN 3
        WHEN 'Attacker' THEN 4
        ELSE 5
      END`,
      asc(schema.players.shirtNumber),
    );
}

// ── Curated tournament squad (e.g. official World Cup 2026 roster) ──

export interface TeamTournamentSquad {
  players: SquadPlayer[];
  competitionName: Record<string, string>;
  seasonYear: number;
}

export async function getTeamTournamentSquad(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<TeamTournamentSquad | null> {
  // Most recent curated roster for this team (e.g. World Cup 2026).
  const latest = await db
    .select({
      competitionId: schema.tournamentSquads.competitionId,
      seasonYear: schema.tournamentSquads.seasonYear,
    })
    .from(schema.tournamentSquads)
    .where(eq(schema.tournamentSquads.teamId, teamId))
    .orderBy(desc(schema.tournamentSquads.seasonYear))
    .limit(1);

  if (latest.length === 0) return null;
  const { competitionId, seasonYear } = latest[0];

  const players = await db
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
      nationalityCode: schema.players.nationalityCode,
      injured: schema.players.injured,
    })
    .from(schema.tournamentSquads)
    .innerJoin(schema.players, eq(schema.tournamentSquads.playerId, schema.players.id))
    .where(
      and(
        eq(schema.tournamentSquads.teamId, teamId),
        eq(schema.tournamentSquads.competitionId, competitionId),
        eq(schema.tournamentSquads.seasonYear, seasonYear),
      ),
    )
    .orderBy(
      sql`CASE ${schema.players.position}
        WHEN 'Goalkeeper' THEN 1
        WHEN 'Defender' THEN 2
        WHEN 'Midfielder' THEN 3
        WHEN 'Attacker' THEN 4
        ELSE 5
      END`,
      asc(schema.players.shirtNumber),
    );

  if (players.length === 0) return null;

  const comp = await db
    .select({ name: schema.competitions.name })
    .from(schema.competitions)
    .where(eq(schema.competitions.id, competitionId))
    .limit(1);

  return {
    players,
    competitionName: comp[0]?.name ?? { en: '' },
    seasonYear,
  };
}

// ── Key players (top contributors by goals+assists, recent seasons) ──

export interface KeyPlayer {
  id: number;
  name: Record<string, string>;
  position: string | null;
  photoUrl: string | null;
  clubName: Record<string, string> | null;
  clubLogoUrl: string | null;
  goals: number;
  assists: number;
}

export async function getTeamKeyPlayers(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  limit = 4,
): Promise<KeyPlayer[]> {
  // Recent window = the two most recent seasons we have stats for this team.
  const maxRow = await db.execute(
    sql`SELECT max(season_year) AS m FROM player_season_stats WHERE team_id = ${teamId}`,
  );
  const maxSeason = Number((maxRow.rows[0] as { m: string | null })?.m ?? 0);
  if (!maxSeason) return [];
  const cutoff = maxSeason - 1;

  const rows = await db.execute(
    sql`SELECT p.id, p.name, p.position, p.photo_url AS "photoUrl",
               ct.name AS "clubName", ct.logo_url AS "clubLogoUrl",
               SUM(COALESCE((pss.stats->>'goals')::int, 0)) AS goals,
               SUM(COALESCE((pss.stats->>'assists')::int, 0)) AS assists
        FROM player_season_stats pss
        JOIN players p ON p.id = pss.player_id
        JOIN squad_members sm ON sm.team_id = ${teamId} AND sm.player_id = p.id
        LEFT JOIN teams ct ON ct.id = p.current_team_id
        WHERE pss.team_id = ${teamId} AND pss.season_year >= ${cutoff}
        GROUP BY p.id, p.name, p.position, p.photo_url, ct.name, ct.logo_url
        HAVING SUM(COALESCE((pss.stats->>'goals')::int, 0))
             + SUM(COALESCE((pss.stats->>'assists')::int, 0)) > 0
        ORDER BY (SUM(COALESCE((pss.stats->>'goals')::int, 0))
                + SUM(COALESCE((pss.stats->>'assists')::int, 0))) DESC,
                 SUM(COALESCE((pss.stats->>'goals')::int, 0)) DESC
        LIMIT ${limit}`,
  );

  return (
    rows.rows as {
      id: string;
      name: Record<string, string>;
      position: string | null;
      photoUrl: string | null;
      clubName: Record<string, string> | null;
      clubLogoUrl: string | null;
      goals: string;
      assists: string;
    }[]
  ).map((r) => ({
    id: Number(r.id),
    name: r.name,
    position: r.position,
    photoUrl: r.photoUrl,
    clubName: r.clubName,
    clubLogoUrl: r.clubLogoUrl,
    goals: Number(r.goals),
    assists: Number(r.assists),
  }));
}

// ── Tournament top scorers & assists (team's current/upcoming tournament) ──

export interface TournamentScorerRow {
  playerId: number | null;
  name: string;
  photo: string | null;
  teamName: string | null;
  teamLogo: string | null;
  value: number;
}

export interface TournamentScorers {
  competitionName: Record<string, string>;
  scorers: TournamentScorerRow[];
  assisters: TournamentScorerRow[];
}

function mapScorerRows(
  rows: {
    player_id: string | null;
    name: string | null;
    photo: string | null;
    team_name: string | null;
    team_logo: string | null;
    value: string;
  }[],
): TournamentScorerRow[] {
  return rows.map((r) => ({
    playerId: r.player_id != null ? Number(r.player_id) : null,
    name: r.name ?? '—',
    photo: r.photo,
    teamName: r.team_name,
    teamLogo: r.team_logo,
    value: Number(r.value),
  }));
}

export async function getTeamTournamentScorers(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  limit = 5,
): Promise<TournamentScorers | null> {
  // Competition + season of the team's nearest upcoming/live fixture.
  const fx = await db.execute(
    sql`SELECT competition_id, season_year FROM fixtures
        WHERE (home_team_id = ${teamId} OR away_team_id = ${teamId})
          AND status_code NOT IN ('FT','AET','PEN','PST','CANC','ABD','AWD','WO')
          AND kickoff_at >= NOW() - interval '3 hours'
        ORDER BY kickoff_at ASC LIMIT 1`,
  );
  if (fx.rows.length === 0) return null;
  const fxRow = fx.rows[0] as { competition_id: string | null; season_year: string | null };
  if (fxRow.competition_id == null || fxRow.season_year == null) return null;
  const compId = Number(fxRow.competition_id);
  const season = Number(fxRow.season_year);

  const nameRow = await db.execute(sql`SELECT name FROM competitions WHERE id = ${compId} LIMIT 1`);
  if (nameRow.rows.length === 0) return null;
  const competitionName = (nameRow.rows[0] as { name: Record<string, string> }).name;

  const scorerRows = await db.execute(
    sql`SELECT player_id, stats->>'playerName' AS name, stats->>'playerPhoto' AS photo,
               stats->>'teamName' AS team_name, stats->>'teamLogo' AS team_logo,
               (stats->>'goals')::int AS value
        FROM player_season_stats
        WHERE competition_id = ${compId} AND season_year = ${season} AND team_id = ${teamId}
          AND COALESCE((stats->>'goals')::int, 0) > 0
        ORDER BY (stats->>'goals')::int DESC LIMIT ${limit}`,
  );
  const assistRows = await db.execute(
    sql`SELECT player_id, stats->>'playerName' AS name, stats->>'playerPhoto' AS photo,
               stats->>'teamName' AS team_name, stats->>'teamLogo' AS team_logo,
               (stats->>'assists')::int AS value
        FROM player_season_stats
        WHERE competition_id = ${compId} AND season_year = ${season} AND team_id = ${teamId}
          AND COALESCE((stats->>'assists')::int, 0) > 0
        ORDER BY (stats->>'assists')::int DESC LIMIT ${limit}`,
  );

  return {
    competitionName,
    scorers: mapScorerRows(scorerRows.rows as Parameters<typeof mapScorerRows>[0]),
    assisters: mapScorerRows(assistRows.rows as Parameters<typeof mapScorerRows>[0]),
  };
}

// ── Q4: Team standings (find team's primary competition, fetch standings) ──

export async function getTeamStandings(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<{ competitionId: number; seasonYear: number; standings: StandingRow[] } | null> {
  // Find the team's most recent standings entry
  const standingRow = await db
    .select({
      competitionId: schema.standings.competitionId,
      seasonYear: schema.standings.seasonYear,
    })
    .from(schema.standings)
    .where(eq(schema.standings.teamId, teamId))
    .orderBy(desc(schema.standings.seasonYear))
    .limit(1);

  if (standingRow.length === 0) return null;

  const { competitionId, seasonYear } = standingRow[0];
  if (competitionId == null) return null;

  // Fetch full standings for that competition/season
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

  // Hydrate team snapshots
  const teamIds = [...new Set(rows.map((r) => r.teamId).filter((id): id is number => id != null))];
  const teamsMap = await getTeamsMap(db, teamIds);

  const standings: StandingRow[] = rows.map((r) => ({
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

  return { competitionId, seasonYear, standings };
}

// ── Q4b: Teams in same competition (for team tiles) ──

export interface CompetitionTeamTile {
  id: number;
  slug: string;
  name: Record<string, string>;
  shortName: Record<string, string>;
  logoUrl: string | null;
}

export async function getTeamsInSameCompetition(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<{ competitionName: Record<string, string> | null; teams: CompetitionTeamTile[] }> {
  // Find the team's primary competition — prefer domestic league over cup/continental
  const standingRow = await db
    .select({
      competitionId: schema.standings.competitionId,
      seasonYear: schema.standings.seasonYear,
    })
    .from(schema.standings)
    .innerJoin(schema.competitions, eq(schema.standings.competitionId, schema.competitions.id))
    .where(eq(schema.standings.teamId, teamId))
    .orderBy(
      sql`CASE WHEN ${schema.competitions.type} = 'League' THEN 0 ELSE 1 END`,
      desc(schema.standings.seasonYear),
    )
    .limit(1);

  if (standingRow.length === 0 || standingRow[0].competitionId == null) {
    return { competitionName: null, teams: [] };
  }

  const { competitionId, seasonYear } = standingRow[0];

  // Get competition name
  const compRow = await db
    .select({ name: schema.competitions.name })
    .from(schema.competitions)
    .where(eq(schema.competitions.id, competitionId))
    .limit(1);
  const competitionName = compRow[0]?.name ?? null;

  // Get all team IDs from standings in this comp/season
  const standingsRows = await db
    .select({ teamId: schema.standings.teamId })
    .from(schema.standings)
    .where(
      and(
        eq(schema.standings.competitionId, competitionId),
        eq(schema.standings.seasonYear, seasonYear),
      ),
    )
    .orderBy(asc(schema.standings.rank));

  const teamIds = standingsRows.map((r) => r.teamId).filter((id): id is number => id != null);

  if (teamIds.length === 0) return { competitionName, teams: [] };

  // Fetch team details
  const tMap = await getTeamsMap(db, teamIds);

  // Preserve rank order
  const teams: CompetitionTeamTile[] = teamIds
    .map((id) => {
      const t = tMap.get(id);
      if (!t) return null;
      return {
        id: t.id,
        slug: t.slug,
        name: t.name,
        shortName: t.shortName,
        logoUrl: t.logoUrl,
      };
    })
    .filter((t): t is CompetitionTeamTile => t != null);

  return { competitionName, teams };
}

// ── Q5: All standings for team (grouped by competition) ──

export interface TeamCompetitionStandings {
  competitions: CompetitionSnapshot[];
  seasons: number[];
  standingsByCompSeason: Record<string, StandingRow[]>; // key: `${compId}-${season}`
}

export async function getTeamAllStandings(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<TeamCompetitionStandings> {
  // Find ALL competition/season pairs this team has standings in
  const compSeasons = await db
    .select({
      competitionId: schema.standings.competitionId,
      seasonYear: schema.standings.seasonYear,
    })
    .from(schema.standings)
    .where(eq(schema.standings.teamId, teamId))
    .groupBy(schema.standings.competitionId, schema.standings.seasonYear)
    .orderBy(desc(schema.standings.seasonYear));

  if (compSeasons.length === 0) return { competitions: [], seasons: [], standingsByCompSeason: {} };

  const compIds = [
    ...new Set(compSeasons.map((c) => c.competitionId).filter((id): id is number => id != null)),
  ];
  const seasons = [...new Set(compSeasons.map((c) => c.seasonYear))].sort((a, b) => b - a);
  const compsMap = await getCompetitionsMap(db, compIds);

  const competitions: CompetitionSnapshot[] = compIds
    .map((id) => compsMap.get(id))
    .filter((c): c is CompetitionSnapshot => c != null);

  // Fetch all standings in one query using OR conditions for each pair
  const pairs = compSeasons.filter((c) => c.competitionId != null);
  if (pairs.length === 0) return { competitions, seasons, standingsByCompSeason: {} };

  const allRows = await db
    .select()
    .from(schema.standings)
    .where(
      sql`(${schema.standings.competitionId}, ${schema.standings.seasonYear}) IN (${sql.join(
        pairs.map((p) => sql`(${p.competitionId}, ${p.seasonYear})`),
        sql`, `,
      )})`,
    )
    .orderBy(
      asc(schema.standings.competitionId),
      asc(schema.standings.seasonYear),
      asc(schema.standings.groupLabel),
      asc(schema.standings.rank),
    );

  // Hydrate all teams in one batch
  const allTeamIds = [
    ...new Set(allRows.map((r) => r.teamId).filter((id): id is number => id != null)),
  ];
  const tMap = await getTeamsMap(db, allTeamIds);

  // Group by comp-season key
  const standingsByCompSeason: Record<string, StandingRow[]> = {};
  for (const r of allRows) {
    const key = `${r.competitionId}-${r.seasonYear}`;
    if (!standingsByCompSeason[key]) standingsByCompSeason[key] = [];
    standingsByCompSeason[key].push({
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
      team: r.teamId ? (tMap.get(r.teamId) ?? null) : null,
    });
  }

  return { competitions, seasons, standingsByCompSeason };
}

// ── Q6: Team season statistics from team_season_stats ──

export interface TeamSeasonStatsEntry {
  competitionId: number;
  seasonYear: number;
  stats: Record<string, unknown>;
}

export interface TeamSeasonStatsResult {
  competitions: CompetitionSnapshot[];
  seasons: number[];
  statsByCompSeason: Record<string, TeamSeasonStatsEntry>; // key: `${compId}-${season}`
}

export async function getTeamSeasonStats(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<TeamSeasonStatsResult> {
  const rows = await db
    .select({
      competitionId: schema.teamSeasonStats.competitionId,
      seasonYear: schema.teamSeasonStats.seasonYear,
      stats: schema.teamSeasonStats.stats,
    })
    .from(schema.teamSeasonStats)
    .where(eq(schema.teamSeasonStats.teamId, teamId))
    .orderBy(desc(schema.teamSeasonStats.seasonYear));

  if (rows.length === 0) return { competitions: [], seasons: [], statsByCompSeason: {} };

  const compIds = [...new Set(rows.map((r) => r.competitionId))];
  const seasons = [...new Set(rows.map((r) => r.seasonYear))].sort((a, b) => b - a);
  const compsMap = await getCompetitionsMap(db, compIds);

  const competitions = compIds
    .map((id) => compsMap.get(id))
    .filter((c): c is CompetitionSnapshot => c != null);

  const statsByCompSeason: Record<string, TeamSeasonStatsEntry> = {};
  for (const row of rows) {
    const key = `${row.competitionId}-${row.seasonYear}`;
    statsByCompSeason[key] = {
      competitionId: row.competitionId,
      seasonYear: row.seasonYear,
      stats: row.stats as Record<string, unknown>,
    };
  }

  return { competitions, seasons, statsByCompSeason };
}

// ── Q8: Team's primary competition (for breadcrumb) ──

export interface TeamPrimaryCompetition {
  id: number;
  name: Record<string, string>;
  slug: string;
  countryCode: string | null;
}

export async function getTeamPrimaryCompetition(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<TeamPrimaryCompetition | null> {
  // Find the league (not cup) where this team has the most fixtures
  const rows = await db.execute(
    sql`SELECT c.id, c.name, c.slug, c.country_code,
               COUNT(*) AS fixture_count
        FROM fixtures f
        JOIN competitions c ON c.id = f.competition_id
        WHERE (f.home_team_id = ${teamId} OR f.away_team_id = ${teamId})
          AND c.type = 'League'
        GROUP BY c.id, c.name, c.slug, c.country_code
        ORDER BY fixture_count DESC
        LIMIT 1`,
  );

  if (rows.rows.length === 0) return null;

  const r = rows.rows[0] as {
    id: string;
    name: Record<string, string>;
    slug: string;
    country_code: string | null;
  };

  return {
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    countryCode: r.country_code,
  };
}

// ── Q9: All competitions this team participates in (for left rail nav) ──

export interface TeamCompetitionEntry {
  id: number;
  name: Record<string, string>;
  slug: string;
  type: string;
  countryCode: string | null;
  logoUrl: string | null;
  fixtureCount: number;
}

export async function getTeamCompetitions(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
): Promise<TeamCompetitionEntry[]> {
  const rows = await db.execute(
    sql`SELECT c.id, c.name, c.slug, c.type, c.country_code, c.logo_url,
               COUNT(*) AS fixture_count
        FROM fixtures f
        JOIN competitions c ON c.id = f.competition_id
        WHERE (f.home_team_id = ${teamId} OR f.away_team_id = ${teamId})
        GROUP BY c.id, c.name, c.slug, c.type, c.country_code, c.logo_url
        ORDER BY fixture_count DESC`,
  );

  return rows.rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    name: r.name as Record<string, string>,
    slug: r.slug as string,
    type: r.type as string,
    countryCode: r.country_code as string | null,
    logoUrl: r.logo_url as string | null,
    fixtureCount: Number(r.fixture_count),
  }));
}

// ── Last N form results (W/D/L) ──

const TERMINAL_STATUSES = ['FT', 'AET', 'PEN'];

export type FormResult = 'W' | 'D' | 'L';

export async function getTeamFormResults(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  n = 5,
): Promise<FormResult[]> {
  const rows = await db
    .select({
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      kickoffAt: schema.fixtures.kickoffAt,
    })
    .from(schema.fixtures)
    .where(
      and(
        or(eq(schema.fixtures.homeTeamId, teamId), eq(schema.fixtures.awayTeamId, teamId)),
        inArray(schema.fixtures.statusCode, TERMINAL_STATUSES),
        sql`${schema.fixtures.homeScore} IS NOT NULL`,
        sql`${schema.fixtures.awayScore} IS NOT NULL`,
      ),
    )
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(n);

  // Return oldest-first for display
  return rows.reverse().map((r) => {
    const isHome = r.homeTeamId === teamId;
    const teamGoals = isHome ? r.homeScore! : r.awayScore!;
    const oppGoals = isHome ? r.awayScore! : r.homeScore!;
    if (teamGoals > oppGoals) return 'W';
    if (teamGoals < oppGoals) return 'L';
    return 'D';
  });
}
