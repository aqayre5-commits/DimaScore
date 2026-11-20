import { cache } from 'react';
import { sql, type SQL } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { FINISHED_CODES_ARRAY } from '@/lib/match-status';

type DB = NeonHttpDatabase<typeof schema>;

/**
 * Indexability gates — keep thin/empty entity pages out of Google's index (and the sitemap).
 *
 * The SAME rule must apply in two places: a page's `generateMetadata` (`robots.index`) and the
 * sitemap WHERE. Each entity's rule lives here once as a `sql` condition; the per-id helpers run
 * that exact fragment (`SELECT <condition> FROM <table> WHERE id = …`), so page and sitemap can't
 * drift.
 *
 * Player rule: a real slug, unique career data, AND either Moroccan nationality or a current
 * team with season stats for the current or previous season. Unique data (the single
 * threshold) is a season-stat row, a transfer, a trophy, or a match stat line. Without
 * that the page is noindex and out of the sitemap, including a Moroccan name with no record.
 * Team rule: a squad row, any fixture, or a standings row. That is the same single threshold.
 */

/** Current football season start year (Jul–Jun): Nov 2026 → 2026, Mar 2027 → 2026. */
const CURRENT_SEASON_YEAR = sql`(EXTRACT(YEAR FROM NOW() - INTERVAL '6 months')::int)`;

/**
 * Unique player data: season stats, or a career trace (transfer, trophy, or a match stat line).
 * Referenced only from `playerIndexableSitemapCondition` so the threshold lives in one place.
 */
const playerHasUniqueData = sql`(
  EXISTS (SELECT 1 FROM player_season_stats pss_u WHERE pss_u.player_id = ${schema.players.id})
  OR EXISTS (SELECT 1 FROM transfers tr WHERE tr.player_id = ${schema.players.id})
  OR EXISTS (SELECT 1 FROM player_trophies pt WHERE pt.player_id = ${schema.players.id})
  OR EXISTS (SELECT 1 FROM fixture_player_stats fps WHERE fps.player_id = ${schema.players.id})
)`;

export const playerIndexableSitemapCondition = sql`(
  ${schema.players.slug} NOT LIKE 'unknown-%'
  AND ${playerHasUniqueData}
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
 * Recent-match rule (not the old-finished gate). A match is indexable iff:
 *   1. it is in a featured competition (WC 1, AFCON 6, WAFCON 922, Botola Pro 200, Botola 2 201,
 *      Coupe du Trône 822), any data; OR
 *   2. it is not a finished game (FT/AET/PEN/AWD/WO) with no events AND no lineups, AND one of:
 *      a. top women's competition (TOP_WOMEN_COMPETITION_IDS) with kickoff in
 *         [now − 180 days, now + 14 days] — exempt from the youth/women rule below;
 *      b. not a youth/women fixture (competition.is_women, team.is_women, or a team name with
 *         U15–U23 / " W" / Women / Ladies) AND one of:
 *         - top-tier competition (UCL 2, UEL 3, UECL 848, PL 39, LaLiga 140, Bundesliga 78,
 *           Serie A 135, Ligue 1 61) with kickoff in [now − 180 days, now + 14 days];
 *         - Morocco (team 31) plays;
 *         - a senior men's national side plays (team.is_national and not youth/women).
 * Finished matches older than FINISHED_MATCH_MAX_AGE_MONTHS are handled separately.
 */
export const FEATURED_COMPETITION_IDS: number[] = [1, 6, 922, 200, 201, 822];
export const TOP_TIER_COMPETITION_IDS: number[] = [2, 3, 848, 39, 140, 78, 135, 61];
/**
 * Top women's competitions (API-Football league ids, verified in the DB): UEFA Champions League
 * Women 525, FA WSL 44, Liga F ("Primera División Femenina") 142, Frauen-Bundesliga 82,
 * Serie A Women 139, Première Ligue / D1 Arkema ("Feminine Division 1") 64, Women's World Cup 8.
 * (Women's Euro isn't in the competitions table yet — add its id here once ingested.)
 */
export const TOP_WOMEN_COMPETITION_IDS: number[] = [525, 44, 142, 82, 139, 64, 8];
export const MOROCCO_TEAM_ID = 31;
/**
 * Senior Morocco national teams (men 31, women 14461). Youth sides are not included.
 * Any of their matches — finals, qualifiers, friendlies — can stay indexed when old.
 */
export const MOROCCO_SENIOR_NATIONAL_TEAM_IDS = [31, 14461] as const;
/**
 * Final tournaments only. Qualifiers are not listed: an old qualifier stays indexed
 * only when a senior Morocco side plays.
 * 1 men's World Cup, 8 women's World Cup, 6 AFCON, 922 WAFCON.
 *
 * Ids alone are not enough. API-Football names the qualifiers "World Cup - Qualification …"
 * and "Africa Cup of Nations - Qualification", and a row filed under 1 or 6 with that
 * name is still a qualifier. `isOldMatchExempt` and `oldMatchAllowList` both reject it.
 */
export const OLD_MATCH_ALLOWLIST_COMPETITION_IDS = [1, 8, 6, 922] as const;
/** English competition name of a qualifier. "Qualification" and "Qualifiers" both match. */
export const QUALIFIER_COMPETITION_NAME_RE = /qualif/i;
/** Finished matches older than this are noindex unless they are on the allow-list and have data. */
export const FINISHED_MATCH_MAX_AGE_MONTHS = 12;
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

const inRecencyWindow = sql`(
  ${schema.fixtures.kickoffAt} >= NOW() - INTERVAL '${sql.raw(String(TOP_TIER_PAST_DAYS))} days'
  AND ${schema.fixtures.kickoffAt} <= NOW() + INTERVAL '${sql.raw(String(TOP_TIER_FUTURE_DAYS))} days'
)`;

const recentMatchPolicy = sql`(
  ${schema.fixtures.competitionId} IN (${idList(FEATURED_COMPETITION_IDS)})
  OR (
    NOT (
      ${schema.fixtures.statusCode} IN ('FT', 'AET', 'PEN', 'AWD', 'WO')
      AND NOT EXISTS (SELECT 1 FROM fixture_events fe WHERE fe.fixture_id = ${schema.fixtures.id})
      AND NOT EXISTS (SELECT 1 FROM fixture_lineups fl WHERE fl.fixture_id = ${schema.fixtures.id})
    )
    AND (
      (
        ${schema.fixtures.competitionId} IN (${idList(TOP_WOMEN_COMPETITION_IDS)})
        AND ${inRecencyWindow}
      )
      OR (
        NOT EXISTS (
          SELECT 1 FROM competitions wc
          WHERE wc.id = ${schema.fixtures.competitionId} AND COALESCE(wc.is_women, false)
        )
        AND NOT ${youthOrWomenTeam(homeCol)}
        AND NOT ${youthOrWomenTeam(awayCol)}
        AND (
          (
            ${schema.fixtures.competitionId} IN (${idList(TOP_TIER_COMPETITION_IDS)})
            AND ${inRecencyWindow}
          )
          OR ${homeCol} = ${sql.raw(String(MOROCCO_TEAM_ID))}
          OR ${awayCol} = ${sql.raw(String(MOROCCO_TEAM_ID))}
          OR ${seniorNationalTeam(homeCol)}
          OR ${seniorNationalTeam(awayCol)}
        )
      )
    )
  )
)`;

const statusList = (codes: readonly string[]) =>
  sql.raw(codes.map((code) => `'${code}'`).join(', '));

/**
 * Same set as `FINISHED_CODES_ARRAY`: played results plus cancelled and abandoned.
 * A cancelled qualifier is not "upcoming". Leaving CANC/ABD out of this list sent
 * Libya–Nigeria and Eritrea–Tanzania through the senior-national recent rule.
 */
const finishedAndOlderThanCutoff = sql`(
  ${schema.fixtures.statusCode} IN (${statusList(FINISHED_CODES_ARRAY)})
  AND ${schema.fixtures.kickoffAt} < NOW() - (${sql.raw(String(FINISHED_MATCH_MAX_AGE_MONTHS))} * INTERVAL '1 month')
)`;

const hasEventsOrLineups = sql`(
  EXISTS (SELECT 1 FROM fixture_events fe WHERE fe.fixture_id = ${schema.fixtures.id})
  OR EXISTS (SELECT 1 FROM fixture_lineups fl WHERE fl.fixture_id = ${schema.fixtures.id})
)`;

/**
 * Same rule as `oldMatchAllowList`. Senior Morocco (men or women) in any competition,
 * including a qualifier. A final tournament (ids 1, 8, 6, 922) only when its English
 * name is not a qualification — "World Cup - Qualification Africa" and
 * "Africa Cup of Nations - Qualification" are not finals, even under id 1 or 6.
 */
export function isOldMatchExempt(match: {
  homeTeamId: number | null;
  awayTeamId: number | null;
  competitionId: number | null;
  competitionName: string | null;
}): boolean {
  const morocco = MOROCCO_SENIOR_NATIONAL_TEAM_IDS as readonly number[];
  if (
    (match.homeTeamId != null && morocco.includes(match.homeTeamId)) ||
    (match.awayTeamId != null && morocco.includes(match.awayTeamId))
  ) {
    return true;
  }
  const finals = OLD_MATCH_ALLOWLIST_COMPETITION_IDS as readonly number[];
  if (match.competitionId == null || !finals.includes(match.competitionId)) return false;
  return !QUALIFIER_COMPETITION_NAME_RE.test(match.competitionName ?? '');
}

/**
 * Old-match allow-list, one definition, shared by robots.index and the sitemap.
 * Mirrors `isOldMatchExempt`: Morocco senior ids, or a final-tournament id whose
 * English name does not contain "qualif".
 */
export const oldMatchAllowList = sql`(
  ${homeCol} IN (${idList([...MOROCCO_SENIOR_NATIONAL_TEAM_IDS])})
  OR ${awayCol} IN (${idList([...MOROCCO_SENIOR_NATIONAL_TEAM_IDS])})
  OR EXISTS (
    SELECT 1 FROM competitions oc
    WHERE oc.id = ${schema.fixtures.competitionId}
      AND oc.id IN (${idList([...OLD_MATCH_ALLOWLIST_COMPETITION_IDS])})
      AND COALESCE(oc.name->>'en', '') !~* 'qualif'
  )
)`;

/**
 * Shared by robots.index and the sitemap. A finished match older than
 * FINISHED_MATCH_MAX_AGE_MONTHS is noindex unless it is on `oldMatchAllowList`
 * and has events or lineups. The page still returns 200 either way.
 */
export const matchIndexableSitemapCondition = sql`(
  (
    NOT ${finishedAndOlderThanCutoff}
    AND ${recentMatchPolicy}
  )
  OR (
    ${finishedAndOlderThanCutoff}
    AND ${oldMatchAllowList}
    AND ${hasEventsOrLineups}
  )
)`;

/** Same SQL as `matchIndexableSitemapCondition`. No featured-competition shortcut. */
export const isMatchIndexable = cache(async function isMatchIndexable(
  db: DB,
  fixtureId: number,
  competitionId: number | null | undefined,
): Promise<boolean> {
  // Callers still pass the competition id. The SQL decides, including for featured competitions.
  void competitionId;
  const res = await db.execute(
    sql`SELECT ${matchIndexableSitemapCondition} AS indexable FROM fixtures WHERE ${schema.fixtures.id} = ${fixtureId}`,
  );
  return Boolean((res.rows[0] as { indexable: boolean } | undefined)?.indexable);
});
