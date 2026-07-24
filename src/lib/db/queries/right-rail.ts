import { eq, and, asc, desc, inArray, gte, lt, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import type { HomeFixture } from './homepage';
import type { StandingRow } from '../queries';
import { applyComputedStandings } from '@/lib/standings/compute';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';
import { TEAM_IDS } from '@/lib/constants/canonical-ids';
import { hydrateTeams, type TeamSnapshot } from '../queries-hydrate';
import { LIVE_CODES_ARRAY, SCORED_STATUSES_ARRAY } from '@/lib/match-status';
import { toSiteDateKey } from '@/lib/utils/date';

// ── Status code sets ──

const LIVE_CODES: string[] = [...LIVE_CODES_ARRAY];

// Featured card must skip the same noise the homepage list filters: fixtures whose teams don't
// resolve (render "TBD") and youth (U17–U23) entries in the Friendlies feed.
const DISPLAYABLE = sql`
  EXISTS (SELECT 1 FROM teams WHERE id = ${schema.fixtures.homeTeamId})
  AND EXISTS (SELECT 1 FROM teams WHERE id = ${schema.fixtures.awayTeamId})
  AND NOT (
    ${schema.fixtures.competitionId} = 10
    AND EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id IN (${schema.fixtures.homeTeamId}, ${schema.fixtures.awayTeamId})
        AND t.name->>'en' ~ ' U-?[0-9]{2}$'
    )
  )
`;
// Statuses that produced an official scored result (excludes CANC + ABD where no winner).
const FINISHED_CODES: string[] = [...SCORED_STATUSES_ARRAY];

export interface RightRailFixture {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  round: string | null;
  /** Real group (e.g. "Group A") for group-stage matches, resolved from standings; else null. */
  groupLabel: string | null;
  /**
   * Short context label rendered after the competition name on featured-match cards (hero,
   * HomeNextMatch, etc.). Adapts by tournament shape: 'Group A' for group stage, 'R32'/'QF'/
   * 'SF'/'F'/'3rd' for knockout, 'MD 14' for league rounds, null when round can't be
   * classified (friendlies, oddly-named qualifiers). Replaces the brittle
   * `groupLabel ?? round` fallback that mis-rendered 'Group F' for R32 matches.
   */
  contextLabel: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
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
}

export interface GoalEvent {
  minute: number;
  playerName: string;
}

/** Today's fixtures for a group — lets the client compute a live/provisional table. */
export interface LiveGroupFixture {
  id: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
}

export interface GroupStandingsBlock {
  competitionId: number;
  seasonYear: number;
  competitionName: Record<string, string>;
  competitionSlug: string;
  competitionLogoUrl: string | null;
  groupLabel: string;
  rows: StandingRow[];
  fixtures: LiveGroupFixture[];
}

export interface TopMatchDateGroup {
  dateKey: string; // ISO date e.g. '2026-05-30'
  fixtures: RightRailFixture[];
}

export interface MoroccanPerformance {
  playerId: number;
  playerName: string;
  playerSlug: string;
  photoUrl: string | null;
  fixtureId: number;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  goals: number;
  assists: number;
  minutesPlayed: number;
  cleanSheet: boolean;
  position: string | null;
}

export interface TopScorerEntry {
  playerId: number;
  playerName: string;
  playerSlug: string;
  photoUrl: string | null;
  teamName: string;
  teamLogoUrl: string | null;
  goals: number;
}

// ── Helpers ──

/**
 * Adaptive short label for the "COMP · STAGE" line on featured-match cards. Rules:
 *   - Resolved group label wins ("Group A") — accurate during group stage and never wrong.
 *   - Knockout rounds → canonical short codes (R32, R16, QF, SF, F, 3rd).
 *   - Round-robin league matchday → "MD N".
 *   - Unclassifiable (friendlies, qualifier-format quirks) → null so the card renders comp
 *     name only with no trailing segment.
 *
 * NOTE: returns strings as-is in English short form; rendering surfaces are free to translate
 * "Group X" or "MD N" via i18n if they care. Knockout codes (R32/QF/SF/F) are commonly used
 * in their English form across locales.
 */
export function resolveContextLabel(
  round: string | null,
  groupLabel: string | null,
): string | null {
  // Decide what the round itself says — knockout / matchday / explicit-group / unknown.
  // Crucially we IGNORE a stray groupLabel when the round is a knockout: standings joins
  // can attach a team's old group (e.g. "Group F" for Netherlands) to a R32 fixture
  // because fixtures store no group field — that's the bug this resolver fixes.
  if (round) {
    const r = round.trim();
    const roundOf = r.match(/^Round of (\d+)$/i);
    if (roundOf) return `R${roundOf[1]}`;
    if (/^Quarter[-\s]?finals?$/i.test(r)) return 'QF';
    if (/^Semi[-\s]?finals?$/i.test(r)) return 'SF';
    if (/^Final$/i.test(r)) return 'F';
    if (/^3rd Place( Final)?$|^3rd place$/i.test(r)) return '3rd';
    const matchday = r.match(/Regular Season\s*-\s*(\d+)/i);
    if (matchday) return `MD ${matchday[1]}`;
    // Group-stage round shapes — prefer the resolved groupLabel ("Group A" from
    // standings) over scraping the round string, because the round string can be
    // unreliable ("Group Stage" with no letter).
    if (/group/i.test(r)) {
      if (groupLabel) return groupLabel;
      const grp =
        r.match(/Group(?:\s+Stage)?\s*-\s*Group\s+([A-Z])/i) ?? r.match(/^Group\s+([A-Z])$/i);
      if (grp) return `Group ${grp[1]}`;
      return null;
    }
  }
  return null;
}

function mapToRightRailFixture(
  r: {
    id: number;
    kickoffAt: Date;
    statusCode: string;
    minute: number | null;
    round: string | null;
    homeTeamId: number | null;
    awayTeamId: number | null;
    homeScore: number | null;
    awayScore: number | null;
    compId: number;
    compName: Record<string, string>;
    compSlug: string;
    compCountryCode: string | null;
    compLogoUrl: string | null;
    venueName?: string | null;
    venueCity?: string | null;
    groupLabel?: string | null;
  },
  teamsMap: Map<number, TeamSnapshot>,
): RightRailFixture {
  const groupLabel = r.groupLabel ?? null;
  return {
    id: r.id,
    kickoffAt: r.kickoffAt,
    statusCode: r.statusCode,
    minute: r.minute,
    round: r.round,
    groupLabel,
    contextLabel: resolveContextLabel(r.round, groupLabel),
    homeTeamId: r.homeTeamId,
    awayTeamId: r.awayTeamId,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    homeTeam: r.homeTeamId ? (teamsMap.get(r.homeTeamId) ?? null) : null,
    awayTeam: r.awayTeamId ? (teamsMap.get(r.awayTeamId) ?? null) : null,
    competition: {
      id: r.compId,
      name: r.compName,
      slug: r.compSlug,
      countryCode: r.compCountryCode,
      logoUrl: resolveCompetitionLogo(r.compId, r.compLogoUrl),
    },
    venueName: r.venueName ?? null,
    venueCity: r.venueCity ?? null,
  };
}

/**
 * The real group ("Group A") for a fixture's teams, resolved from standings (fixtures store no
 * group). Excludes the malformed "Group Stage" catch-all; returns null if unresolved.
 */
export async function resolveGroupLabel(
  db: NeonHttpDatabase<typeof schema>,
  competitionId: number | null,
  seasonYear: number | null,
  homeTeamId: number | null,
  awayTeamId: number | null,
): Promise<string | null> {
  if (competitionId == null || seasonYear == null) return null;
  const teamIds = [homeTeamId, awayTeamId].filter((id): id is number => id != null);
  if (teamIds.length === 0) return null;
  const rows = await db
    .select({ teamId: schema.standings.teamId, groupLabel: schema.standings.groupLabel })
    .from(schema.standings)
    .where(
      and(
        eq(schema.standings.competitionId, competitionId),
        eq(schema.standings.seasonYear, seasonYear),
        inArray(schema.standings.teamId, teamIds),
      ),
    );
  for (const teamId of teamIds) {
    for (const r of rows) {
      if (r.teamId !== teamId || r.groupLabel == null) continue;
      const norm = r.groupLabel.replace(/^Group Stage\s*-\s*/i, '');
      const low = norm.toLowerCase();
      if (low === 'group stage' || !low.startsWith('group ')) continue;
      return norm;
    }
  }
  return null;
}

// ── Round-based priority boost ──
// Knockout rounds get a priority boost so a UCL Final (base 45) outranks
// a Botola regular-season match (base 20). Qualifier rounds excluded.

const FEATURED_ORDER = sql`
  ${schema.fixtures.isFeatured} DESC,
  (${schema.competitions.displayPriority} - CASE
    WHEN ${schema.fixtures.round} = 'Final' THEN 30
    WHEN ${schema.fixtures.round} = '3rd Place Final' THEN 25
    WHEN ${schema.fixtures.round} ILIKE '%semi-final%'
      AND ${schema.fixtures.round} NOT ILIKE '%qualifying%' THEN 20
    WHEN ${schema.fixtures.round} ILIKE '%quarter-final%'
      AND ${schema.fixtures.round} NOT ILIKE '%qualifying%' THEN 10
    WHEN ${schema.fixtures.round} IN ('Round of 16', '16th Finals') THEN 5
    WHEN ${schema.fixtures.round} IN ('Round of 32', '8th Finals') THEN 3
    ELSE 0
  END) ASC,
  ${schema.fixtures.kickoffAt} ASC
`;

// ── Query 1: Next featured matches (live > upcoming by priority) ──

/**
 * Returns up to {@link limit} candidate "next featured" matches, ranked by featured-order:
 * live first, then NS within 48h, then absolute next NS. The client picks the first whose
 * patched status isn't finished — so when one match ends, the widget auto-advances to the
 * next instead of getting stuck on a stale cached row.
 */
export async function getNextFeaturedMatches(
  db: NeonHttpDatabase<typeof schema>,
  limit = 5,
): Promise<Array<{ match: RightRailFixture; goals: GoalEvent[] }>> {
  const selectFields = {
    id: schema.fixtures.id,
    kickoffAt: schema.fixtures.kickoffAt,
    statusCode: schema.fixtures.statusCode,
    minute: schema.fixtures.minute,
    round: schema.fixtures.round,
    seasonYear: schema.fixtures.seasonYear,
    homeTeamId: schema.fixtures.homeTeamId,
    awayTeamId: schema.fixtures.awayTeamId,
    homeScore: schema.fixtures.homeScore,
    awayScore: schema.fixtures.awayScore,
    compId: schema.competitions.id,
    compName: schema.competitions.name,
    compSlug: schema.competitions.slug,
    compCountryCode: schema.competitions.countryCode,
    compLogoUrl: schema.competitions.logoUrl,
    venueName: schema.venues.name,
    venueCity: schema.venues.city,
  };

  const liveRows = await db
    .select(selectFields)
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .leftJoin(schema.venues, eq(schema.fixtures.venueId, schema.venues.id))
    .where(and(inArray(schema.fixtures.statusCode, LIVE_CODES), DISPLAYABLE))
    .orderBy(FEATURED_ORDER)
    .limit(limit);

  const collected: typeof liveRows = [...liveRows];

  if (collected.length < limit) {
    const now = new Date();
    const horizon48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const nearRows = await db
      .select(selectFields)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .leftJoin(schema.venues, eq(schema.fixtures.venueId, schema.venues.id))
      .where(
        and(
          eq(schema.fixtures.statusCode, 'NS'),
          gte(schema.fixtures.kickoffAt, now),
          lt(schema.fixtures.kickoffAt, horizon48h),
          DISPLAYABLE,
        ),
      )
      .orderBy(FEATURED_ORDER)
      .limit(limit - collected.length);
    collected.push(...nearRows);
  }

  if (collected.length < limit) {
    const now = new Date();
    const fallbackRows = await db
      .select(selectFields)
      .from(schema.fixtures)
      .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
      .leftJoin(schema.venues, eq(schema.fixtures.venueId, schema.venues.id))
      .where(
        and(eq(schema.fixtures.statusCode, 'NS'), gte(schema.fixtures.kickoffAt, now), DISPLAYABLE),
      )
      .orderBy(FEATURED_ORDER)
      .limit(limit - collected.length);
    collected.push(...fallbackRows);
  }

  // Dedupe by fixture id (a live match could also satisfy NS-window if scheduling is weird).
  const seen = new Set<number>();
  const rows = collected.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  if (rows.length === 0) return [];

  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }
  const teamsMap = await hydrateTeams(db, teamIds);

  const results: Array<{ match: RightRailFixture; goals: GoalEvent[] }> = [];
  for (const row of rows) {
    const match = mapToRightRailFixture(row, teamsMap);
    if (match.round && /group/i.test(match.round)) {
      match.groupLabel = await resolveGroupLabel(
        db,
        row.compId,
        row.seasonYear,
        row.homeTeamId,
        row.awayTeamId,
      );
      // Re-derive contextLabel now that the real group label is resolved.
      match.contextLabel = resolveContextLabel(match.round, match.groupLabel);
    }

    let goals: GoalEvent[] = [];
    if (LIVE_CODES.includes(row.statusCode)) {
      const goalRows = await db.execute(
        sql`SELECT fe.minute, COALESCE(p.name->>'en', p.name->>'fr', 'Unknown') AS player_name
            FROM fixture_events fe
            LEFT JOIN players p ON p.id = fe.player_id
            WHERE fe.fixture_id = ${row.id} AND fe.type = 'Goal'
            ORDER BY fe.minute ASC`,
      );
      goals = (goalRows.rows as { minute: number | null; player_name: string }[])
        .filter((r) => r.minute != null)
        .map((r) => ({ minute: Number(r.minute), playerName: r.player_name }));
    }
    results.push({ match, goals });
  }

  return results;
}

// ── Query 2: Group standings for competitions with matches today ──

export async function getLiveGroupStandings(
  db: NeonHttpDatabase<typeof schema>,
): Promise<GroupStandingsBlock[]> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  // Single query: all standings for groups that have fixtures today
  const allRows = await db.execute(
    sql`SELECT s.competition_id, s.season_year, s.group_label, s.team_id,
               s.rank, s.points, s.played, s.won, s.drawn, s.lost,
               s.goals_for, s.goals_against, s.goal_diff, s.form, s.description,
               c.name AS comp_name, c.slug AS comp_slug, c.logo_url AS comp_logo_url
        FROM standings s
        JOIN competitions c ON c.id = s.competition_id
        WHERE s.group_label LIKE 'Group%'
          AND (s.competition_id, s.season_year) IN (
            SELECT DISTINCT f.competition_id, f.season_year
            FROM fixtures f
            JOIN standings s2 ON s2.competition_id = f.competition_id
              AND s2.season_year = f.season_year
              AND s2.group_label LIKE 'Group%'
              AND (f.home_team_id = s2.team_id OR f.away_team_id = s2.team_id)
            WHERE f.kickoff_at >= ${todayStart}
              AND f.kickoff_at < ${todayEnd}
          )
          AND s.group_label IN (
            SELECT DISTINCT s3.group_label
            FROM standings s3
            JOIN fixtures f2 ON f2.competition_id = s3.competition_id
              AND f2.season_year = s3.season_year
              AND (f2.home_team_id = s3.team_id OR f2.away_team_id = s3.team_id)
            WHERE s3.competition_id = s.competition_id
              AND s3.season_year = s.season_year
              AND s3.group_label LIKE 'Group%'
              AND f2.kickoff_at >= ${todayStart}
              AND f2.kickoff_at < ${todayEnd}
          )
        ORDER BY s.competition_id, s.group_label, s.rank`,
  );

  if (allRows.rows.length === 0) return [];

  type RawRow = {
    competition_id: string;
    season_year: string;
    group_label: string;
    team_id: string | null;
    rank: string;
    points: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goals_for: string;
    goals_against: string;
    goal_diff: string;
    form: string | null;
    description: string | null;
    comp_name: Record<string, string>;
    comp_slug: string;
    comp_logo_url: string | null;
  };

  // Collect all team IDs for single hydration
  const teamIds = new Set<number>();
  for (const r of allRows.rows as RawRow[]) {
    if (r.team_id != null) teamIds.add(Number(r.team_id));
  }
  const teamsMap = await hydrateTeams(db, teamIds);

  // Group rows into blocks. The sync produced duplicate rows under variant labels ("Group A" AND
  // "Group Stage - Group A", plus a bare "Group Stage" catch-all), and the variants aren't adjacent
  // in the result — so normalize the prefix, drop junk pseudo-groups, and key blocks by a Map with
  // per-team de-duplication.
  const blocks: GroupStandingsBlock[] = [];
  const blockMap = new Map<string, GroupStandingsBlock>();
  const seenTeam = new Set<string>();

  for (const r of allRows.rows as RawRow[]) {
    const normalized = r.group_label.trim().replace(/^Group Stage\s*-\s*/i, '');
    const low = normalized.toLowerCase();
    if (low.includes('ranking') || low === 'group stage') continue;
    const groupLabel = normalized.replace(/^Group\s*/i, '');
    const teamId = r.team_id ? Number(r.team_id) : null;

    const blockKey = `${r.competition_id}-${r.season_year}-${groupLabel}`;
    const teamKey = `${blockKey}::${teamId}`;
    if (teamId != null && seenTeam.has(teamKey)) continue;
    if (teamId != null) seenTeam.add(teamKey);

    let block = blockMap.get(blockKey);
    if (!block) {
      block = {
        competitionId: Number(r.competition_id),
        seasonYear: Number(r.season_year),
        competitionName: r.comp_name,
        competitionSlug: r.comp_slug,
        competitionLogoUrl: resolveCompetitionLogo(Number(r.competition_id), r.comp_logo_url),
        groupLabel,
        rows: [],
        fixtures: [],
      };
      blockMap.set(blockKey, block);
      blocks.push(block);
    }
    block.rows.push({
      groupLabel,
      teamId,
      rank: Number(r.rank),
      points: Number(r.points),
      played: Number(r.played),
      won: Number(r.won),
      drawn: Number(r.drawn),
      lost: Number(r.lost),
      goalsFor: Number(r.goals_for),
      goalsAgainst: Number(r.goals_against),
      goalDiff: Number(r.goal_diff),
      form: r.form,
      description: r.description,
      team: teamId ? (teamsMap.get(teamId) ?? null) : null,
    });
  }

  // ── Compute empty group tables from results + attach today's fixtures for the live overlay ──
  const compIds = [...new Set(blocks.map((b) => b.competitionId))];
  const seasons = [...new Set(blocks.map((b) => b.seasonYear))];
  if (compIds.length > 0) {
    const allFixtures = await db
      .select({
        id: schema.fixtures.id,
        competitionId: schema.fixtures.competitionId,
        seasonYear: schema.fixtures.seasonYear,
        homeTeamId: schema.fixtures.homeTeamId,
        awayTeamId: schema.fixtures.awayTeamId,
        homeScore: schema.fixtures.homeScore,
        awayScore: schema.fixtures.awayScore,
        statusCode: schema.fixtures.statusCode,
        kickoffAt: schema.fixtures.kickoffAt,
      })
      .from(schema.fixtures)
      // Scope to the blocks' editions: a competition id alone spans every past edition, whose
      // results would otherwise leak into the current season's computed group tables.
      .where(
        and(
          inArray(schema.fixtures.competitionId, compIds),
          inArray(schema.fixtures.seasonYear, seasons),
        ),
      )
      .orderBy(asc(schema.fixtures.kickoffAt));

    const fxByCompSeason = new Map<string, typeof allFixtures>();
    for (const f of allFixtures) {
      if (f.competitionId == null || f.seasonYear == null) continue;
      const key = `${f.competitionId}:${f.seasonYear}`;
      const arr = fxByCompSeason.get(key) ?? [];
      arr.push(f);
      fxByCompSeason.set(key, arr);
    }

    const earliestKickoff = new Map<GroupStandingsBlock, number>();
    for (const b of blocks) {
      const compFx = fxByCompSeason.get(`${b.competitionId}:${b.seasonYear}`) ?? [];
      // Server: fill an empty group table from finished results (immune to a stale /standings feed).
      b.rows = applyComputedStandings(b.rows, compFx, b.seasonYear);
      // Client overlay: today's fixtures for this group's teams (live matches layer on top).
      const teamIds = new Set(b.rows.map((r) => r.teamId).filter((x): x is number => x != null));
      const todayFx = compFx.filter(
        (f) =>
          f.kickoffAt >= todayStart &&
          f.kickoffAt < todayEnd &&
          ((f.homeTeamId != null && teamIds.has(f.homeTeamId)) ||
            (f.awayTeamId != null && teamIds.has(f.awayTeamId))),
      );
      b.fixtures = todayFx.map((f) => ({
        id: f.id,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        homeScore: f.homeScore,
        awayScore: f.awayScore,
        statusCode: f.statusCode,
      }));
      earliestKickoff.set(
        b,
        todayFx.length
          ? Math.min(...todayFx.map((f) => f.kickoffAt.getTime()))
          : Number.POSITIVE_INFINITY,
      );
    }
    // When multiple groups play today, order their tables by earliest kickoff (earliest first).
    blocks.sort(
      (a, b) => (earliestKickoff.get(a) ?? Infinity) - (earliestKickoff.get(b) ?? Infinity),
    );
  }

  return blocks;
}

// ── Query 3: Top matches this week (next 7 days) ──
// A "top match" is defined as:
//   1. Knockout round in any competition (Final, SF, QF, R16, R32)
//   2. Any World Cup match (all rounds)
//   3. Morocco NT is playing (men id=31, women id=14461)
//   4. Any AFCON (6) or WAFCON (922) match

const MOROCCO_TEAM_IDS = [TEAM_IDS.MOROCCO_MEN, TEAM_IDS.MOROCCO_WOMEN];
const ALWAYS_TOP_COMP_IDS = [1, 6, 922]; // WC, AFCON, WAFCON

const KNOCKOUT_ROUND_FILTER = sql`(
  f.round = 'Final'
  OR f.round = '3rd Place Final'
  OR f.round ILIKE '%semi-final%'
  OR f.round ILIKE '%quarter-final%'
  OR f.round IN ('Round of 16', '16th Finals', 'Round of 32', '8th Finals')
)`;

export async function getTopMatchesThisWeek(
  db: NeonHttpDatabase<typeof schema>,
  limit = 8,
): Promise<TopMatchDateGroup[]> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const weekOut = new Date(todayStart);
  weekOut.setUTCDate(weekOut.getUTCDate() + 7);

  const rows = await db.execute(
    sql`SELECT
          f.id, f.kickoff_at, f.status_code, f.minute, f.round, f.season_year,
          f.home_team_id, f.away_team_id, f.home_score, f.away_score,
          c.id AS comp_id, c.name AS comp_name, c.slug AS comp_slug,
          c.country_code AS comp_country_code, c.logo_url AS comp_logo_url
        FROM fixtures f
        JOIN competitions c ON c.id = f.competition_id
        WHERE f.status_code = 'NS'
          AND f.kickoff_at >= ${todayStart}
          AND f.kickoff_at < ${weekOut}
          AND (
            ${KNOCKOUT_ROUND_FILTER}
            OR f.competition_id IN (${sql.join(
              ALWAYS_TOP_COMP_IDS.map((id) => sql`${id}`),
              sql`, `,
            )})
            OR f.home_team_id IN (${sql.join(
              MOROCCO_TEAM_IDS.map((id) => sql`${id}`),
              sql`, `,
            )})
            OR f.away_team_id IN (${sql.join(
              MOROCCO_TEAM_IDS.map((id) => sql`${id}`),
              sql`, `,
            )})
          )
        ORDER BY
          f.is_featured DESC,
          (c.display_priority - CASE
            WHEN f.round = 'Final' THEN 30
            WHEN f.round = '3rd Place Final' THEN 25
            WHEN f.round ILIKE '%semi-final%' AND f.round NOT ILIKE '%qualifying%' THEN 20
            WHEN f.round ILIKE '%quarter-final%' AND f.round NOT ILIKE '%qualifying%' THEN 10
            WHEN f.round IN ('Round of 16', '16th Finals') THEN 5
            WHEN f.round IN ('Round of 32', '8th Finals') THEN 3
            ELSE 0
          END) ASC,
          f.kickoff_at ASC
        LIMIT ${limit}`,
  );

  if (rows.rows.length === 0) return [];

  // Map raw rows
  const mapped = (
    rows.rows as {
      id: string;
      kickoff_at: string;
      status_code: string;
      minute: string | null;
      round: string | null;
      season_year: string;
      home_team_id: string | null;
      away_team_id: string | null;
      home_score: string | null;
      away_score: string | null;
      comp_id: string;
      comp_name: Record<string, string>;
      comp_slug: string;
      comp_country_code: string | null;
      comp_logo_url: string | null;
    }[]
  ).map((r) => ({
    id: Number(r.id),
    kickoffAt: new Date(r.kickoff_at),
    statusCode: r.status_code,
    minute: r.minute ? Number(r.minute) : null,
    round: r.round,
    seasonYear: Number(r.season_year),
    groupLabel: null as string | null,
    homeTeamId: r.home_team_id ? Number(r.home_team_id) : null,
    awayTeamId: r.away_team_id ? Number(r.away_team_id) : null,
    homeScore: r.home_score != null ? Number(r.home_score) : null,
    awayScore: r.away_score != null ? Number(r.away_score) : null,
    compId: Number(r.comp_id),
    compName: r.comp_name,
    compSlug: r.comp_slug,
    compCountryCode: r.comp_country_code,
    compLogoUrl: r.comp_logo_url,
  }));

  // Hydrate teams
  const teamIds = new Set<number>();
  for (const r of mapped) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }
  const teamsMap = await hydrateTeams(db, teamIds);

  // Resolve the real group (e.g. "Group A") for group-stage matches — fixtures store no group, so
  // look up each match's team in the standings team→group map.
  const groupStage = mapped.filter((r) => r.round && /group/i.test(r.round));
  if (groupStage.length > 0) {
    const groupCompIds = [...new Set(groupStage.map((r) => r.compId))];
    const standingRows = await db
      .select({
        competitionId: schema.standings.competitionId,
        seasonYear: schema.standings.seasonYear,
        teamId: schema.standings.teamId,
        groupLabel: schema.standings.groupLabel,
      })
      .from(schema.standings)
      .where(inArray(schema.standings.competitionId, groupCompIds));
    const teamGroup = new Map<string, string>();
    for (const s of standingRows) {
      if (s.teamId == null || s.groupLabel == null) continue;
      const norm = s.groupLabel.replace(/^Group Stage\s*-\s*/i, '');
      const low = norm.toLowerCase();
      if (low === 'group stage' || !low.startsWith('group ')) continue;
      teamGroup.set(`${s.competitionId}:${s.seasonYear}:${s.teamId}`, norm);
    }
    for (const r of groupStage) {
      const home =
        r.homeTeamId != null ? teamGroup.get(`${r.compId}:${r.seasonYear}:${r.homeTeamId}`) : null;
      const away =
        r.awayTeamId != null ? teamGroup.get(`${r.compId}:${r.seasonYear}:${r.awayTeamId}`) : null;
      r.groupLabel = home ?? away ?? null;
    }
  }

  // Group by date
  const groupMap = new Map<string, TopMatchDateGroup>();
  for (const r of mapped) {
    const dateKey = toSiteDateKey(r.kickoffAt);
    let group = groupMap.get(dateKey);
    if (!group) {
      group = { dateKey, fixtures: [] };
      groupMap.set(dateKey, group);
    }
    group.fixtures.push(mapToRightRailFixture(r, teamsMap));
  }

  return [...groupMap.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

// ── Query 4: Moroccan players performances (last 48h) ──

export async function getMoroccanPlayerPerformances(
  db: NeonHttpDatabase<typeof schema>,
  daysBack = 7,
  limit = 6,
): Promise<MoroccanPerformance[]> {
  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const rows = await db.execute(
    sql`WITH moroccan_matches AS (
          SELECT DISTINCT
            p.id AS player_id,
            COALESCE(p.name->>'en', p.name->>'fr') AS player_name,
            p.slug AS player_slug,
            p.photo_url,
            p.position,
            fps.fixture_id,
            COALESCE((fps.stats->>'minutes')::int, 0) AS minutes_played,
            COALESCE((fps.stats->'goals'->>'total')::int, 0) AS goals,
            COALESCE((fps.stats->'goals'->>'assists')::int, 0) AS assists,
            f.home_team_id,
            f.away_team_id,
            f.home_score,
            f.away_score,
            fps.team_id AS player_team_id
          FROM players p
          JOIN fixture_player_stats fps ON fps.player_id = p.id
          JOIN fixtures f ON f.id = fps.fixture_id
          WHERE p.nationality_code = 'MA'
            AND f.status_code IN ('FT', 'AET', 'PEN')
            AND f.kickoff_at >= ${cutoff}
            AND COALESCE((fps.stats->>'minutes')::int, 0) > 0
        )
        SELECT
          mm.*,
          COALESCE(ht.name->>'en', 'Unknown') AS home_team_name,
          COALESCE(at.name->>'en', 'Unknown') AS away_team_name,
          CASE
            WHEN mm.player_team_id = mm.home_team_id AND mm.away_score = 0 AND mm.position IN ('Goalkeeper', 'G') THEN true
            WHEN mm.player_team_id = mm.away_team_id AND mm.home_score = 0 AND mm.position IN ('Goalkeeper', 'G') THEN true
            ELSE false
          END AS clean_sheet
        FROM moroccan_matches mm
        LEFT JOIN teams ht ON ht.id = mm.home_team_id
        LEFT JOIN teams at ON at.id = mm.away_team_id
        ORDER BY
          COALESCE(mm.goals, 0) + COALESCE(mm.assists, 0) DESC,
          mm.minutes_played DESC
        LIMIT ${limit}`,
  );

  return (
    rows.rows as {
      player_id: string;
      player_name: string;
      player_slug: string;
      photo_url: string | null;
      fixture_id: string;
      home_team_name: string;
      away_team_name: string;
      home_score: string;
      away_score: string;
      goals: string | null;
      assists: string | null;
      minutes_played: string;
      clean_sheet: boolean;
      position: string | null;
    }[]
  ).map((r) => ({
    playerId: Number(r.player_id),
    playerName: r.player_name,
    playerSlug: r.player_slug,
    photoUrl: r.photo_url,
    fixtureId: Number(r.fixture_id),
    homeTeamName: r.home_team_name,
    awayTeamName: r.away_team_name,
    homeScore: Number(r.home_score),
    awayScore: Number(r.away_score),
    goals: Number(r.goals ?? 0),
    assists: Number(r.assists ?? 0),
    minutesPlayed: Number(r.minutes_played),
    cleanSheet: r.clean_sheet,
    position: r.position,
  }));
}

// ── Query 5: Top scorers for the most relevant active competition ──

export async function getRightRailTopScorers(
  db: NeonHttpDatabase<typeof schema>,
  limit = 5,
): Promise<{ competitionName: Record<string, string>; scorers: TopScorerEntry[] }> {
  // Priority order: Botola Pro (200) > WC (1) > AFCON (6) > UCL (2) > PL (39)
  const priorityComps = [200, 1, 6, 2, 39];
  const compsList = sql.join(
    priorityComps.map((id) => sql`${id}`),
    sql`, `,
  );

  // Dual-source query: pulls top-N from both player_season_stats (the official /topscorers feed)
  // and fixture_events (goals derived from match events) per priority competition. We then pick,
  // per comp, whichever source has the larger leader — covering cases where the /topscorers feed
  // is sparse or stale (Botola Pro 2025 returned 4 scorers / max 3 goals while fixture_events had
  // 372 goals). Mirrors what getResolvedTopScorers does for league/cup pages.
  const rows = await db.execute(
    sql`WITH pss_top AS (
          SELECT 'pss'::text AS source,
                 pss.competition_id,
                 pss.player_id,
                 COALESCE(p.name->>'en', p.name->>'fr') AS player_name,
                 p.slug AS player_slug,
                 p.photo_url,
                 COALESCE(t.name->>'en', 'Unknown') AS team_name,
                 t.logo_url AS team_logo_url,
                 (pss.stats->>'goals')::int AS goals,
                 c.name AS comp_name,
                 ROW_NUMBER() OVER (
                   PARTITION BY pss.competition_id
                   ORDER BY (pss.stats->>'goals')::int DESC
                 ) AS rn
          FROM player_season_stats pss
          JOIN seasons s ON s.competition_id = pss.competition_id
            AND s.year = pss.season_year
            AND s.is_current = true
          JOIN players p ON p.id = pss.player_id
          LEFT JOIN teams t ON t.id = pss.team_id
          JOIN competitions c ON c.id = pss.competition_id
          WHERE pss.competition_id IN (${compsList})
            AND (pss.stats->>'goals')::int > 0
        ),
        events_top AS (
          SELECT 'events'::text AS source,
                 f.competition_id,
                 e.player_id,
                 COALESCE(p.name->>'en', p.name->>'fr') AS player_name,
                 p.slug AS player_slug,
                 p.photo_url,
                 COALESCE(t.name->>'en', 'Unknown') AS team_name,
                 t.logo_url AS team_logo_url,
                 COUNT(*)::int AS goals,
                 c.name AS comp_name,
                 ROW_NUMBER() OVER (
                   PARTITION BY f.competition_id
                   ORDER BY COUNT(*) DESC
                 ) AS rn
          FROM fixture_events e
          JOIN fixtures f ON f.id = e.fixture_id
          JOIN seasons s ON s.competition_id = f.competition_id
            AND s.year = f.season_year
            AND s.is_current = true
          JOIN players p ON p.id = e.player_id
          LEFT JOIN teams t ON t.id = e.team_id
          JOIN competitions c ON c.id = f.competition_id
          WHERE f.competition_id IN (${compsList})
            AND e.type = 'Goal'
            AND e.detail IN ('Normal Goal', 'Penalty')
          GROUP BY f.competition_id, e.player_id, p.name, p.slug, p.photo_url, t.id, t.name, t.logo_url, c.name
        )
        SELECT * FROM pss_top WHERE rn <= ${limit}
        UNION ALL
        SELECT * FROM events_top WHERE rn <= ${limit}
        ORDER BY competition_id, source, rn`,
  );

  if (rows.rows.length === 0) return { competitionName: {}, scorers: [] };

  type RawRow = {
    source: 'pss' | 'events';
    competition_id: string;
    player_id: string;
    player_name: string;
    player_slug: string;
    photo_url: string | null;
    team_name: string;
    team_logo_url: string | null;
    goals: string;
    comp_name: Record<string, string>;
    rn: string;
  };

  // Bucket per (compId, source).
  const buckets = new Map<
    number,
    {
      compName: Record<string, string>;
      pss: RawRow[];
      events: RawRow[];
    }
  >();
  for (const r of rows.rows as RawRow[]) {
    const compId = Number(r.competition_id);
    let bucket = buckets.get(compId);
    if (!bucket) {
      bucket = { compName: r.comp_name, pss: [], events: [] };
      buckets.set(compId, bucket);
    }
    if (r.source === 'pss') bucket.pss.push(r);
    else bucket.events.push(r);
  }

  // Walk priorities; per comp pick the source with the higher leader. Skip empty comps.
  for (const compId of priorityComps) {
    const bucket = buckets.get(compId);
    if (!bucket) continue;
    const pssLeader = bucket.pss[0]?.goals ?? '0';
    const eventsLeader = bucket.events[0]?.goals ?? '0';
    if (Number(pssLeader) === 0 && Number(eventsLeader) === 0) continue;
    const chosen = Number(eventsLeader) > Number(pssLeader) ? bucket.events : bucket.pss;
    return {
      competitionName: bucket.compName,
      scorers: chosen.map((r) => ({
        playerId: Number(r.player_id),
        playerName: r.player_name,
        playerSlug: r.player_slug,
        photoUrl: r.photo_url,
        teamName: r.team_name,
        teamLogoUrl: r.team_logo_url,
        goals: Number(r.goals),
      })),
    };
  }

  return { competitionName: {}, scorers: [] };
}
