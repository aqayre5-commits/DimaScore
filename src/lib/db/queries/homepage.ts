import { eq, and, asc, inArray, gte, lt, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { ALL_ENTRIES } from '@/lib/constants/competitions-mega-menu';

// ── Types ──

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

export interface HomeFixture {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  round: string | null;
  groupLabel: string | null;
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
  venueName: string | null;
  venueCity: string | null;
  venueCapacity: number | null;
}

export type FormResult = 'W' | 'D' | 'L';

export interface GoalEvent {
  minute: number;
  playerName: string;
}

export interface TrendingPlayer {
  playerId: number;
  playerName: string;
  photoUrl: string | null;
  teamName: Record<string, string>;
  teamLogoUrl: string | null;
  goals: number;
}

const LIVE_CODES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
const FINISHED_CODES = ['FT', 'AET', 'PEN', 'WO', 'AWD'];

const ROUND_NORMALIZE: Record<string, string> = {
  '16th Finals': 'Round of 32',
  '8th Finals': 'Round of 16',
  'Quarter-finals': 'Quarter-final',
  'Semi-Finals': 'Semi-final',
  'Semi-finals': 'Semi-final',
};

function normalizeRound(round: string | null): string | null {
  if (!round) return null;
  return ROUND_NORMALIZE[round] ?? round;
}

// ── Helpers ──

async function hydrateTeams(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: Set<number>,
): Promise<Map<number, TeamSnapshot>> {
  const map = new Map<number, TeamSnapshot>();
  if (teamIds.size === 0) return map;
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
    .where(inArray(schema.teams.id, [...teamIds]));
  for (const t of teams) map.set(t.id, t);
  return map;
}

function mapFixtureRow(
  r: {
    id: number;
    kickoffAt: Date;
    statusCode: string;
    minute: number | null;
    round: string | null;
    groupLabel?: string | null;
    homeTeamId: number | null;
    awayTeamId: number | null;
    homeScore: number | null;
    awayScore: number | null;
    homeScorePen: number | null;
    awayScorePen: number | null;
    compId: number;
    compName: Record<string, string>;
    compSlug: string;
    compCountryCode: string | null;
    compLogoUrl: string | null;
    venueName?: string | null;
    venueCity?: string | null;
    venueCapacity?: number | null;
  },
  teamsMap: Map<number, TeamSnapshot>,
): HomeFixture {
  return {
    id: r.id,
    kickoffAt: r.kickoffAt,
    statusCode: r.statusCode,
    minute: r.minute,
    round: normalizeRound(r.round),
    groupLabel: r.groupLabel ?? null,
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
      logoUrl: r.compLogoUrl,
    },
    venueName: r.venueName ?? null,
    venueCity: r.venueCity ?? null,
    venueCapacity: r.venueCapacity ?? null,
  };
}

// ── Queries ──

/** Live + upcoming + recent results for match tabs. */
export async function getHomeMatchesByCategory(
  db: NeonHttpDatabase<typeof schema>,
): Promise<{ live: HomeFixture[]; upcoming: HomeFixture[]; results: HomeFixture[] }> {
  const nowSql = sql`NOW()`;
  const fourHoursAgo = sql`NOW() - INTERVAL '4 hours'`;
  const sevenDaysAgo = sql`NOW() - INTERVAL '7 days'`;
  const thirtyDaysOut = sql`NOW() + INTERVAL '30 days'`;

  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      round: schema.fixtures.round,
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
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      or(
        inArray(schema.fixtures.statusCode, LIVE_CODES),
        and(
          eq(schema.fixtures.statusCode, 'NS'),
          sql`${schema.fixtures.kickoffAt} >= ${fourHoursAgo}`,
          sql`${schema.fixtures.kickoffAt} < ${thirtyDaysOut}`,
        ),
        and(
          inArray(schema.fixtures.statusCode, FINISHED_CODES),
          sql`${schema.fixtures.kickoffAt} >= ${sevenDaysAgo}`,
          sql`${schema.fixtures.kickoffAt} < ${nowSql}`,
        ),
      ),
    )
    .orderBy(asc(schema.competitions.displayPriority), asc(schema.fixtures.kickoffAt));

  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }
  const teamsMap = await hydrateTeams(db, teamIds);

  const live: HomeFixture[] = [];
  const upcoming: HomeFixture[] = [];
  const results: HomeFixture[] = [];

  for (const r of rows) {
    const f = mapFixtureRow(r, teamsMap);
    if (LIVE_CODES.includes(r.statusCode)) live.push(f);
    else if (r.statusCode === 'NS') upcoming.push(f);
    else results.push(f);
  }

  // Results: most recent first
  results.sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

  return { live, upcoming, results };
}

/** Featured upcoming matches for hero carousel, priority-sorted. */
export async function getFeaturedMatches(
  db: NeonHttpDatabase<typeof schema>,
  limit = 8,
): Promise<HomeFixture[]> {
  const now = new Date();
  const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      round: schema.fixtures.round,
      groupLabel: schema.standings.groupLabel,
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
      venueName: schema.venues.name,
      venueCity: schema.venues.city,
      venueCapacity: schema.venues.capacity,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .leftJoin(schema.venues, eq(schema.fixtures.venueId, schema.venues.id))
    .leftJoin(
      schema.standings,
      and(
        eq(schema.standings.competitionId, schema.fixtures.competitionId),
        eq(schema.standings.teamId, schema.fixtures.homeTeamId),
        sql`${schema.standings.groupLabel} LIKE 'Group%'`,
      ),
    )
    .where(
      and(
        eq(schema.fixtures.statusCode, 'NS'),
        gte(schema.fixtures.kickoffAt, now),
        lt(schema.fixtures.kickoffAt, thirtyDaysOut),
      ),
    )
    .orderBy(asc(schema.competitions.displayPriority), asc(schema.fixtures.kickoffAt))
    .limit(limit);

  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }
  const teamsMap = await hydrateTeams(db, teamIds);

  return rows.map((r) => mapFixtureRow(r, teamsMap));
}

/** Goal events for the first live match (right rail live card). */
export async function getLiveMatchGoals(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<GoalEvent[]> {
  const rows = await db.execute(
    sql`SELECT fe.minute, COALESCE(p.name->>'en', p.name->>'fr', 'Unknown') AS player_name
        FROM fixture_events fe
        LEFT JOIN players p ON p.id = fe.player_id
        WHERE fe.fixture_id = ${fixtureId} AND fe.type = 'Goal'
        ORDER BY fe.minute ASC`,
  );

  return (rows.rows as { minute: number | null; player_name: string }[])
    .filter((r) => r.minute != null)
    .map((r) => ({ minute: Number(r.minute), playerName: r.player_name }));
}

/** Top scorers across all competitions for trending players strip. */
export async function getTrendingPlayers(
  db: NeonHttpDatabase<typeof schema>,
  limit = 5,
): Promise<TrendingPlayer[]> {
  const rows = await db.execute(
    sql`SELECT
          pss.player_id,
          p.name AS player_name,
          p.photo_url,
          t.name AS team_name,
          t.logo_url AS team_logo_url,
          SUM((pss.stats->'goals'->>'total')::int) AS goals
        FROM player_season_stats pss
        JOIN players p ON p.id = pss.player_id
        LEFT JOIN teams t ON t.id = p.current_team_id
        WHERE (pss.stats->'goals'->>'total')::int > 0
        GROUP BY pss.player_id, p.name, p.photo_url, t.name, t.logo_url
        ORDER BY goals DESC
        LIMIT ${limit}`,
  );

  return (
    rows.rows as {
      player_id: string;
      player_name: string;
      photo_url: string | null;
      team_name: Record<string, string> | null;
      team_logo_url: string | null;
      goals: string;
    }[]
  ).map((r) => ({
    playerId: Number(r.player_id),
    playerName: r.player_name,
    photoUrl: r.photo_url,
    teamName: r.team_name ?? {},
    teamLogoUrl: r.team_logo_url,
    goals: Number(r.goals),
  }));
}

/** Match counts for quick filters. */
export async function getHomeMatchCounts(
  db: NeonHttpDatabase<typeof schema>,
): Promise<{ live: number; today: number; upcoming: number; results: number }> {
  const rows = await db.execute(
    sql`SELECT
          COUNT(*) FILTER (WHERE status_code IN ('1H','HT','2H','ET','BT','P','LIVE')) AS live,
          COUNT(*) FILTER (WHERE kickoff_at >= date_trunc('day', NOW()) AND kickoff_at < date_trunc('day', NOW()) + INTERVAL '1 day') AS today,
          COUNT(*) FILTER (WHERE status_code = 'NS' AND kickoff_at >= NOW()) AS upcoming,
          COUNT(*) FILTER (WHERE status_code IN ('FT','AET','PEN','WO','AWD')) AS results
        FROM fixtures`,
  );

  const r = rows.rows[0] as { live: string; today: string; upcoming: string; results: string };
  return {
    live: Number(r.live),
    today: Number(r.today),
    upcoming: Number(r.upcoming),
    results: Number(r.results),
  };
}

/** Fetch specific competitions by ID, preserving order, enriched with mega menu slugs. */
export async function getCompetitionsByIds(db: NeonHttpDatabase<typeof schema>, ids: number[]) {
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      id: schema.competitions.id,
      name: schema.competitions.name,
      countryCode: schema.competitions.countryCode,
      logoUrl: schema.competitions.logoUrl,
    })
    .from(schema.competitions)
    .where(inArray(schema.competitions.id, ids));

  const menuMap = new Map(ALL_ENTRIES.map((e) => [e.competitionId, e]));
  const rowMap = new Map(rows.map((r) => [r.id, r]));

  return ids
    .map((id) => {
      const r = rowMap.get(id);
      const entry = menuMap.get(id);
      if (!r || !entry) return null;
      return {
        id: r.id,
        name: r.name,
        countryCode: r.countryCode,
        logoUrl: r.logoUrl,
        countryKey: entry.countryKey,
        slug: entry.slugs as Record<string, string>,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r != null);
}

/** Last N results per team for form badges (W/D/L). */
export async function getTeamForm(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: number[],
  limit = 5,
): Promise<Map<number, FormResult[]>> {
  if (teamIds.length === 0) return new Map();

  const idList = sql.join(
    teamIds.map((id) => sql`${id}`),
    sql`, `,
  );

  const rows = await db.execute(
    sql`SELECT f.home_team_id, f.away_team_id, f.home_score, f.away_score
        FROM fixtures f
        WHERE f.status_code IN ('FT', 'AET', 'PEN', 'WO', 'AWD')
          AND (f.home_team_id IN (${idList}) OR f.away_team_id IN (${idList}))
        ORDER BY f.kickoff_at DESC
        LIMIT ${teamIds.length * limit * 2}`,
  );

  const formMap = new Map<number, FormResult[]>();

  for (const r of rows.rows as {
    home_team_id: string;
    away_team_id: string;
    home_score: string;
    away_score: string;
  }[]) {
    const homeId = Number(r.home_team_id);
    const awayId = Number(r.away_team_id);
    const hs = Number(r.home_score);
    const as_ = Number(r.away_score);

    for (const tid of [homeId, awayId]) {
      if (!teamIds.includes(tid)) continue;
      const existing = formMap.get(tid);
      if (existing && existing.length >= limit) continue;

      let result: FormResult;
      if (tid === homeId) {
        result = hs > as_ ? 'W' : hs < as_ ? 'L' : 'D';
      } else {
        result = as_ > hs ? 'W' : as_ < hs ? 'L' : 'D';
      }

      if (!existing) formMap.set(tid, [result]);
      else existing.push(result);
    }
  }

  return formMap;
}
