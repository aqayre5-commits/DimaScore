import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type * as schema from '../schema';
import { getTeamsMap, type TeamSnapshot } from '../queries-hydrate';
import { LIVE_CODES_ARRAY, SCORED_STATUSES_ARRAY } from '@/lib/match-status';

type Db = NeonHttpDatabase<typeof schema>;

const num = (v: unknown) => (v == null ? null : Number(v));
const list = (codes: readonly string[]) =>
  sql.join(
    codes.map((c) => sql`${c}`),
    sql`, `,
  );

export interface UpcomingFixture {
  id: number;
  kickoffAt: string;
  home: TeamSnapshot | null;
  away: TeamSnapshot | null;
}

/**
 * The template's rail cards: the next three scheduled fixtures of the same competition (one per
 * pairing), excluding this match. Fixtures with an undetermined slot are skipped.
 */
export async function getUpcomingCompetitionFixtures(
  db: Db,
  competitionId: number,
  excludeFixtureId: number,
): Promise<UpcomingFixture[]> {
  const res = await db.execute(sql`
    SELECT f.id, f.kickoff_at, f.home_team_id, f.away_team_id
    FROM fixtures f
    WHERE f.competition_id = ${competitionId}
      AND f.status_code IN ('NS', 'TBD')
      AND f.kickoff_at > NOW()
      AND f.id != ${excludeFixtureId}
      AND f.home_team_id IS NOT NULL
      AND f.away_team_id IS NOT NULL
    ORDER BY f.kickoff_at ASC, f.id ASC
    LIMIT 12
  `);
  type Row = { id: unknown; kickoff_at: unknown; home_team_id: unknown; away_team_id: unknown };
  const seen = new Set<string>();
  const chosen: Row[] = [];
  for (const r of res.rows as Row[]) {
    const pair = [Number(r.home_team_id), Number(r.away_team_id)].sort().join('|');
    if (seen.has(pair)) continue;
    seen.add(pair);
    chosen.push(r);
    if (chosen.length === 3) break;
  }
  if (chosen.length === 0) return [];
  const teams = await getTeamsMap(db, [
    ...new Set(chosen.flatMap((r) => [Number(r.home_team_id), Number(r.away_team_id)])),
  ]);
  return chosen.map((r) => ({
    id: Number(r.id),
    kickoffAt: new Date(String(r.kickoff_at)).toISOString(),
    home: teams.get(Number(r.home_team_id)) ?? null,
    away: teams.get(Number(r.away_team_id)) ?? null,
  }));
}

export interface CompetitionResult {
  fixtureId: number;
  homeTeamId: number;
  awayTeamId: number;
  homeScore: number;
  awayScore: number;
  live: boolean;
}

/**
 * Finished (scored) and in-play results of a competition season, for the Home / Away tables and
 * the live table. Callers keep only the fixtures between teams of the table's group.
 */
export async function getCompetitionResults(
  db: Db,
  competitionId: number,
  seasonYear: number,
): Promise<CompetitionResult[]> {
  const res = await db.execute(sql`
    SELECT f.id, f.home_team_id, f.away_team_id, f.home_score, f.away_score, f.status_code
    FROM fixtures f
    WHERE f.competition_id = ${competitionId}
      AND f.season_year = ${seasonYear}
      AND f.home_team_id IS NOT NULL
      AND f.away_team_id IS NOT NULL
      AND f.status_code IN (${list([...SCORED_STATUSES_ARRAY, ...LIVE_CODES_ARRAY])})
  `);
  const live = new Set<string>(LIVE_CODES_ARRAY);
  const out: CompetitionResult[] = [];
  for (const r of res.rows as Record<string, unknown>[]) {
    const isLive = live.has(String(r.status_code));
    const hs = num(r.home_score);
    const as = num(r.away_score);
    // A live fixture with no score yet counts as 0–0 (it is being played).
    if (!isLive && (hs == null || as == null)) continue;
    out.push({
      fixtureId: Number(r.id),
      homeTeamId: Number(r.home_team_id),
      awayTeamId: Number(r.away_team_id),
      homeScore: hs ?? 0,
      awayScore: as ?? 0,
      live: isLive,
    });
  }
  return out;
}

export interface RailCompetitionData {
  /** Competitions with a fixture in the last or next ten days ("active" in the template). */
  activeIds: number[];
  /** DB logo per competition id. */
  logos: Record<number, string | null>;
}

export async function getRailCompetitionData(db: Db, ids: number[]): Promise<RailCompetitionData> {
  if (ids.length === 0) return { activeIds: [], logos: {} };
  const idList = sql.join(
    ids.map((i) => sql`${i}`),
    sql`, `,
  );
  const [active, logos] = await Promise.all([
    db.execute(sql`
      SELECT DISTINCT f.competition_id AS id
      FROM fixtures f
      WHERE f.competition_id IN (${idList})
        AND f.kickoff_at BETWEEN NOW() - INTERVAL '10 days' AND NOW() + INTERVAL '10 days'
    `),
    db.execute(sql`SELECT c.id, c.logo_url FROM competitions c WHERE c.id IN (${idList})`),
  ]);
  return {
    activeIds: (active.rows as { id: unknown }[]).map((r) => Number(r.id)),
    logos: Object.fromEntries(
      (logos.rows as { id: unknown; logo_url: unknown }[]).map((r) => [
        Number(r.id),
        r.logo_url == null ? null : String(r.logo_url),
      ]),
    ),
  };
}
