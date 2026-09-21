import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import type { TeamSnapshot, VenueSnapshot } from './queries-hydrate';
import { applyComputedStandings } from '@/lib/standings/compute';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import { isDisplayableFixture } from './queries/homepage';

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
  homeScorePen: number | null;
  awayScorePen: number | null;
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

  // The standings sync produced duplicate rows under variant labels ("Group A" AND
  // "Group Stage - Group A", plus a "Group Stage" aggregate). Normalize the variant prefix, drop
  // the junk pseudo-groups (the aggregate + API-Football's "Ranking of third-placed teams"), then
  // de-duplicate by (group, team) so each team appears once per group.
  const seenStanding = new Set<string>();
  const filtered = rows
    .map((r) => ({ ...r, groupLabel: r.groupLabel.trim().replace(/^Group Stage\s*-\s*/i, '') }))
    .filter((r) => {
      const g = r.groupLabel.toLowerCase();
      if (g.includes('ranking') || g === 'group stage') return false;
      const key = `${r.groupLabel}::${r.teamId}`;
      if (seenStanding.has(key)) return false;
      seenStanding.add(key);
      return true;
    });

  const teamIds = [
    ...new Set(filtered.map((r) => r.teamId).filter((id): id is number => id != null)),
  ];
  const teamsMap = await getTeamsMap(db, teamIds);

  const result: StandingRow[] = filtered.map((r) => ({
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

  // Fallback: if a group's feed is unpopulated but its fixtures have results, compute it from
  // the fixtures (immune to a stale/empty upstream /standings; populated groups untouched).
  const fixtures = await db
    .select({
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      statusCode: schema.fixtures.statusCode,
      seasonYear: schema.fixtures.seasonYear,
    })
    .from(schema.fixtures)
    .where(
      and(
        eq(schema.fixtures.competitionId, competitionId),
        eq(schema.fixtures.seasonYear, seasonYear),
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt));

  return applyComputedStandings(result, fixtures, seasonYear);
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
    homeScorePen: f.homeScorePen,
    awayScorePen: f.awayScorePen,
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
  /** Competition display_priority (lower = more prominent) — carried for composite ordering. */
  displayPriority: number;
}

export type TickerResult = { mode: 'fixtures'; fixtures: TickerFixture[] } | { mode: 'empty' };

const LIVE_STATUSES: string[] = [...LIVE_CODES_ARRAY];
const LIVE_SET = new Set<string>(LIVE_CODES_ARRAY);
// Scored results only — a highlight strip shows a final score, so WO/AWD/CANC/ABD are excluded.
const RESULT_STATUSES: string[] = ['FT', 'AET', 'PEN'];
const MOROCCO_CC = 'MA';
// Cap after composite sort so a busy night can't produce a 200-cell marquee.
const TICKER_MAX = 60;

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
  displayPriority: schema.competitions.displayPriority,
} as const;

/**
 * Fixtures for the global ticker strip.
 *
 * Membership parity with the homepage: same competitions (no allowlist) and the SAME
 * isDisplayableFixture filter — so no match reaches the ticker that the main page hides, and
 * vice-versa. Three buckets are fetched in parallel — all live, upcoming ≤48h, scored results
 * ≤24h (tighter than the homepage's ±window, since a marquee of multi-day results is unusable) —
 * hydrated in one batch, filtered, composite-sorted, then capped at TICKER_MAX.
 */
export async function getTickerFixtures(
  db: NeonHttpDatabase<typeof schema>,
): Promise<TickerResult> {
  const [liveRows, upcomingRows, resultRows] = await Promise.all([
    db
      .select(TICKER_SELECT)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .where(inArray(schema.fixtures.statusCode, LIVE_STATUSES)),
    db
      .select(TICKER_SELECT)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .where(
        and(
          eq(schema.fixtures.statusCode, 'NS'),
          sql`${schema.fixtures.kickoffAt} > NOW()`,
          sql`${schema.fixtures.kickoffAt} < NOW() + INTERVAL '48 hours'`,
        ),
      ),
    db
      .select(TICKER_SELECT)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .where(
        and(
          inArray(schema.fixtures.statusCode, RESULT_STATUSES),
          sql`${schema.fixtures.kickoffAt} > NOW() - INTERVAL '24 hours'`,
          sql`${schema.fixtures.kickoffAt} <= NOW()`,
        ),
      ),
  ]);

  const rows: TickerRow[] = [...liveRows, ...upcomingRows, ...resultRows];
  if (rows.length === 0) return { mode: 'empty' };

  const fixtures = await hydrateTickerRows(db, rows);
  const ordered = sortTickerFixtures(fixtures).slice(0, TICKER_MAX);
  if (ordered.length === 0) return { mode: 'empty' };
  return { mode: 'fixtures', fixtures: ordered };
}

function isLiveCode(code: string): boolean {
  return LIVE_SET.has(code);
}

function isResultCode(code: string): boolean {
  return !LIVE_SET.has(code) && code !== 'NS';
}

function isMoroccanFixture(f: TickerFixture): boolean {
  return f.homeTeam?.countryCode === MOROCCO_CC || f.awayTeam?.countryCode === MOROCCO_CC;
}

/**
 * Composite order (option A): (1) live first, (2) Moroccan pinned, (3) competition display_priority,
 * (4) within the same competition upcoming before results, (5) time — upcoming/live soonest first,
 * results most recent first. Priority sits ABOVE the upcoming/results split so a marquee result (e.g.
 * a La Liga fixture just finished) outranks a trivial upcoming (a lower-tier match two days out),
 * instead of all upcoming burying all results. Mirrors SofaScore/LiveScore (live-first + geo-bias +
 * competition popularity), tuned Morocco-first. Also drops rows the homepage hides so the two
 * surfaces stay in parity.
 */
function sortTickerFixtures(fixtures: TickerFixture[]): TickerFixture[] {
  return fixtures
    .filter((f) => isDisplayableFixture(f))
    .sort((a, b) => {
      const la = isLiveCode(a.statusCode) ? 0 : 1;
      const lb = isLiveCode(b.statusCode) ? 0 : 1;
      if (la !== lb) return la - lb;
      const ma = isMoroccanFixture(a) ? 0 : 1;
      const mb = isMoroccanFixture(b) ? 0 : 1;
      if (ma !== mb) return ma - mb;
      if (a.displayPriority !== b.displayPriority) return a.displayPriority - b.displayPriority;
      const ka = isResultCode(a.statusCode) ? 1 : 0; // upcoming (0) before results (1)
      const kb = isResultCode(b.statusCode) ? 1 : 0;
      if (ka !== kb) return ka - kb;
      const ta = a.kickoffAt.getTime();
      const tb = b.kickoffAt.getTime();
      return ka === 1 ? tb - ta : ta - tb; // results: most recent first; else soonest first
    });
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
  displayPriority: number | null;
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
    displayPriority: r.displayPriority ?? 100,
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

  const current = rows.map((r) => ({
    competitionId: r.competitionId,
    year: r.year,
    isWomen: r.isWomen ?? false,
    hasStandingsCoverage: r.hasStandingsCoverage ?? false,
  }));

  // Fallback for the changeover gap: upstream sometimes flags *no* season current for a league
  // (old one ended, new one not yet published). Without this the fixtures/standings/top-scorers
  // crons silently skip that competition entirely until the new season is flagged.
  //
  // Bounded to competitions with fixtures in the last 60 days (or scheduled ahead) so we resurrect
  // a league mid-rollover without dragging in long-dead competitions still sitting in `fixtures`.
  const currentIds = new Set(current.map((c) => c.competitionId));
  const gapRows = await db.execute(sql`
    SELECT f.competition_id,
           MAX(f.season_year)          AS year,
           bool_or(c.is_women)         AS is_women,
           bool_or(lc.standings)       AS has_standings_coverage
    FROM fixtures f
    JOIN competitions c ON c.id = f.competition_id
    LEFT JOIN league_coverage lc
           ON lc.league_id = f.competition_id AND lc.season = f.season_year
    WHERE f.competition_id NOT IN (SELECT competition_id FROM seasons WHERE is_current = true)
      AND f.kickoff_at > NOW() - interval '60 days'
    GROUP BY f.competition_id
  `);

  for (const r of gapRows.rows as Record<string, unknown>[]) {
    const competitionId = Number(r.competition_id);
    if (!Number.isFinite(competitionId) || currentIds.has(competitionId)) continue;
    current.push({
      competitionId,
      year: Number(r.year),
      isWomen: Boolean(r.is_women),
      hasStandingsCoverage: Boolean(r.has_standings_coverage),
    });
  }

  return current;
}
