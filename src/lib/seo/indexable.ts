import { cache } from 'react';
import { sql, type SQL } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

type DB = NeonHttpDatabase<typeof schema>;

/**
 * Indexability gates — keep thin/empty entity pages out of Google's index (and the sitemap).
 *
 * The SAME rule must apply in two places: a page's `generateMetadata` (`robots.index`) and the
 * sitemap WHERE. Each entity's rule lives here once as a `sql` condition; the per-id helpers run
 * that exact fragment (`SELECT <condition> FROM <table> WHERE id = …`), so page and sitemap can't
 * drift.
 *
 * Player rule (Phase 17 index policy): indexable if the slug is real (not "unknown-%") AND either
 *   - Moroccan nationality (`nationality_code = 'MA'`, Lions Abroad), OR
 *   - a current team AND season stats for the current or previous season.
 * Everything else is noindex,follow + de-sitemapped.
 */

/** Current football season start year (Jul–Jun): Nov 2026 → 2026, Mar 2027 → 2026. */
const CURRENT_SEASON_YEAR = sql`(EXTRACT(YEAR FROM NOW() - INTERVAL '6 months')::int)`;

export const playerIndexableSitemapCondition = sql`(
  ${schema.players.slug} NOT LIKE 'unknown-%'
  AND (
    ${schema.players.nationalityCode} = 'MA'
    OR (
      ${schema.players.currentTeamId} IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM player_season_stats pss
        WHERE pss.player_id = ${schema.players.id}
          AND pss.season_year >= ${CURRENT_SEASON_YEAR} - 1
      )
    )
  )
)`;

/** Same rule as `playerIndexableSitemapCondition`, for one player (runs the identical SQL). */
export const isPlayerIndexable = cache(async function isPlayerIndexable(
  db: DB,
  id: number,
  slug: string,
): Promise<boolean> {
  if (slug.startsWith('unknown-')) return false;
  const res = await db.execute(
    sql`SELECT ${playerIndexableSitemapCondition} AS indexable FROM players WHERE ${schema.players.id} = ${id}`,
  );
  return Boolean((res.rows[0] as { indexable: boolean } | undefined)?.indexable);
});

/**
 * Team rule (approved): indexable if the team has any real data — at least one fixture (home or
 * away), OR squad members, OR a standings row. Reserve/youth/defunct/test teams with none are
 * noindex + de-sitemapped.
 */
export const teamIndexableSitemapCondition = sql`(
  EXISTS (SELECT 1 FROM fixtures f WHERE f.home_team_id = ${schema.teams.id} OR f.away_team_id = ${schema.teams.id})
  OR EXISTS (SELECT 1 FROM squad_members sm WHERE sm.team_id = ${schema.teams.id})
  OR EXISTS (SELECT 1 FROM standings st WHERE st.team_id = ${schema.teams.id})
)`;

export const isTeamIndexable = cache(async function isTeamIndexable(
  db: DB,
  id: number,
): Promise<boolean> {
  const res = await db.execute(sql`SELECT (
    EXISTS (SELECT 1 FROM fixtures WHERE home_team_id = ${id} OR away_team_id = ${id})
    OR EXISTS (SELECT 1 FROM squad_members WHERE team_id = ${id})
    OR EXISTS (SELECT 1 FROM standings WHERE team_id = ${id})
  ) AS indexable`);
  return Boolean((res.rows[0] as { indexable: boolean } | undefined)?.indexable);
});

/**
 * Match rule (Phase 17 index policy). A match page is indexable iff:
 *   1. it is in a featured competition (WC 1, AFCON 6, WAFCON 922, Botola Pro 200, Botola 2 201,
 *      Coupe du Trône 822) — any age, any data; OR
 *   2. ALL of:
 *      a. not a youth/women fixture (competition.is_women, team.is_women, or a team name with
 *         U15–U23 / " W" / Women / Ladies);
 *      b. not a finished game (FT/AET/PEN/AWD/WO) with no events AND no lineups;
 *      c. and one of:
 *         - top-tier competition (UCL 2, UEL 3, UECL 848, PL 39, LaLiga 140, Bundesliga 78,
 *           Serie A 135, Ligue 1 61) with kickoff in [now − 180 days, now + 14 days];
 *         - Morocco (team 31) plays;
 *         - a senior men's national side plays (team.is_national and not youth/women).
 * Everything else is noindex,follow and out of the sitemap.
 */
export const FEATURED_COMPETITION_IDS: number[] = [1, 6, 922, 200, 201, 822];
export const TOP_TIER_COMPETITION_IDS: number[] = [2, 3, 848, 39, 140, 78, 135, 61];
export const MOROCCO_TEAM_ID = 31;
export const TOP_TIER_PAST_DAYS = 180;
export const TOP_TIER_FUTURE_DAYS = 14;

/** Team-name pattern for youth / women sides (API-Football English names). */
const YOUTH_OR_WOMEN_NAME_RE = String.raw`(\mU-?(1[5-9]|2[0-3])\M|\sW$|women|ladies)`;

const idList = (ids: number[]) => sql.raw(ids.map((n) => String(Math.trunc(n))).join(', '));

/** True when team `col` is a youth or women side. */
const youthOrWomenTeam = (col: SQL) => sql`EXISTS (
  SELECT 1 FROM teams yt WHERE yt.id = ${col}
    AND (COALESCE(yt.is_women, false) OR (yt.name->>'en') ~* ${sql.raw(`'${YOUTH_OR_WOMEN_NAME_RE}'`)})
)`;

/** True when team `col` is a senior men's national side. */
const seniorNationalTeam = (col: SQL) => sql`EXISTS (
  SELECT 1 FROM teams nt WHERE nt.id = ${col}
    AND COALESCE(nt.is_national, false)
    AND NOT COALESCE(nt.is_women, false)
    AND NOT ((nt.name->>'en') ~* ${sql.raw(`'${YOUTH_OR_WOMEN_NAME_RE}'`)})
)`;

const homeCol = sql`${schema.fixtures.homeTeamId}`;
const awayCol = sql`${schema.fixtures.awayTeamId}`;

export const matchIndexableSitemapCondition = sql`(
  ${schema.fixtures.competitionId} IN (${idList(FEATURED_COMPETITION_IDS)})
  OR (
    NOT EXISTS (
      SELECT 1 FROM competitions wc
      WHERE wc.id = ${schema.fixtures.competitionId} AND COALESCE(wc.is_women, false)
    )
    AND NOT ${youthOrWomenTeam(homeCol)}
    AND NOT ${youthOrWomenTeam(awayCol)}
    AND NOT (
      ${schema.fixtures.statusCode} IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
      AND NOT EXISTS (SELECT 1 FROM fixture_events fe WHERE fe.fixture_id = ${schema.fixtures.id})
      AND NOT EXISTS (SELECT 1 FROM fixture_lineups fl WHERE fl.fixture_id = ${schema.fixtures.id})
    )
    AND (
      (
        ${schema.fixtures.competitionId} IN (${idList(TOP_TIER_COMPETITION_IDS)})
        AND ${schema.fixtures.kickoffAt} >= NOW() - INTERVAL '${sql.raw(String(TOP_TIER_PAST_DAYS))} days'
        AND ${schema.fixtures.kickoffAt} <= NOW() + INTERVAL '${sql.raw(String(TOP_TIER_FUTURE_DAYS))} days'
      )
      OR ${homeCol} = ${sql.raw(String(MOROCCO_TEAM_ID))}
      OR ${awayCol} = ${sql.raw(String(MOROCCO_TEAM_ID))}
      OR ${seniorNationalTeam(homeCol)}
      OR ${seniorNationalTeam(awayCol)}
    )
  )
)`;

/** Same rule as `matchIndexableSitemapCondition`, for one fixture (runs the identical SQL). */
export const isMatchIndexable = cache(async function isMatchIndexable(
  db: DB,
  fixtureId: number,
  competitionId: number | null | undefined,
): Promise<boolean> {
  if (competitionId != null && FEATURED_COMPETITION_IDS.includes(competitionId)) return true;
  const res = await db.execute(
    sql`SELECT ${matchIndexableSitemapCondition} AS indexable FROM fixtures WHERE ${schema.fixtures.id} = ${fixtureId}`,
  );
  return Boolean((res.rows[0] as { indexable: boolean } | undefined)?.indexable);
});
