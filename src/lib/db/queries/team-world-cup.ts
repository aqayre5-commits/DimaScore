import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

const WORLD_CUP_ID = 1;

export interface WorldCupResult {
  fixtureId: number;
  kickoffAt: Date;
  seasonYear: number;
  round: string | null;
  statusCode: string;
  home: {
    name: Record<string, string>;
    logoUrl: string | null;
    score: number | null;
    pen: number | null;
  };
  away: {
    name: Record<string, string>;
    logoUrl: string | null;
    score: number | null;
    pen: number | null;
  };
  /** Outcome from the queried team's perspective (penalty-aware for knockout draws). */
  result: 'W' | 'D' | 'L';
}

interface RawRow {
  id: string;
  kickoff_at: string;
  season_year: number;
  round: string | null;
  status_code: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  home_score_pen: number | null;
  away_score_pen: number | null;
  home_name: Record<string, string>;
  home_logo: string | null;
  away_name: Record<string, string>;
  away_logo: string | null;
}

/** A national team's most recent finished World Cup (competition 1) results, newest first. */
export async function getTeamWorldCupResults(
  db: NeonHttpDatabase<typeof schema>,
  teamId: number,
  limit = 10,
): Promise<WorldCupResult[]> {
  const res = await db.execute(sql`
    SELECT f.id, f.kickoff_at, f.season_year, f.round, f.status_code,
           f.home_team_id, f.away_team_id,
           f.home_score, f.away_score, f.home_score_pen, f.away_score_pen,
           ht.name AS home_name, ht.logo_url AS home_logo,
           at.name AS away_name, at.logo_url AS away_logo
    FROM fixtures f
    JOIN teams ht ON ht.id = f.home_team_id
    JOIN teams at ON at.id = f.away_team_id
    WHERE f.competition_id = ${WORLD_CUP_ID}
      AND (f.home_team_id = ${teamId} OR f.away_team_id = ${teamId})
      AND f.status_code IN ('FT','AET','PEN')
    ORDER BY f.kickoff_at DESC
    LIMIT ${limit}
  `);

  return (res.rows as unknown as RawRow[]).map((r) => {
    const isHome = Number(r.home_team_id) === teamId;
    const tg = (isHome ? r.home_score : r.away_score) ?? 0;
    const og = (isHome ? r.away_score : r.home_score) ?? 0;
    let result: 'W' | 'D' | 'L';
    if (tg > og) result = 'W';
    else if (tg < og) result = 'L';
    else {
      const tp = isHome ? r.home_score_pen : r.away_score_pen;
      const op = isHome ? r.away_score_pen : r.home_score_pen;
      result = tp != null && op != null && tp !== op ? (tp > op ? 'W' : 'L') : 'D';
    }
    return {
      fixtureId: Number(r.id),
      kickoffAt: new Date(r.kickoff_at),
      seasonYear: r.season_year,
      round: r.round,
      statusCode: r.status_code,
      home: { name: r.home_name, logoUrl: r.home_logo, score: r.home_score, pen: r.home_score_pen },
      away: { name: r.away_name, logoUrl: r.away_logo, score: r.away_score, pen: r.away_score_pen },
      result,
    };
  });
}
