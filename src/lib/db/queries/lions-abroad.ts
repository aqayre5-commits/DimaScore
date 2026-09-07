import { sql } from 'drizzle-orm';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import {
  getMoroccanPlayerPerformances,
  type MoroccanPerformance,
} from '@/lib/db/queries/right-rail';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import { TEAM_IDS } from '@/lib/constants/canonical-ids';

export interface LionsAbroadFixture {
  id: number;
  kickoffAt: string;
  statusCode: string;
  minute: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamName: string;
  awayTeamName: string;
  competitionId: number | null;
  competitionName: string;
  players: {
    playerId: number;
    playerName: string;
    playerSlug: string;
    photoUrl: string | null;
    clubName: string;
  }[];
}

export interface LionsAbroadHubData {
  fixtures: LionsAbroadFixture[];
  performances: MoroccanPerformance[];
}

async function loadLionsAbroadFixtures(): Promise<LionsAbroadFixture[]> {
  const result = await db.execute(sql`
    WITH lions AS (
      SELECT
        p.id AS player_id,
        COALESCE(p.name->>'en', p.name->>'fr') AS player_name,
        p.slug AS player_slug,
        p.photo_url,
        p.current_team_id AS club_id,
        COALESCE(club.name->>'en', 'Unknown') AS club_name
      FROM players p
      JOIN teams club ON club.id = p.current_team_id
      WHERE p.nationality_code = 'MA'
        AND p.current_team_id IS NOT NULL
        AND p.current_team_id NOT IN (${TEAM_IDS.MOROCCO_MEN}, ${TEAM_IDS.MOROCCO_WOMEN})
        AND club.country_code IS DISTINCT FROM 'MA'
        AND COALESCE(club.is_national, false) = false
    )
    SELECT
      f.id,
      f.kickoff_at,
      f.status_code,
      f.minute,
      f.home_team_id,
      f.away_team_id,
      f.home_score,
      f.away_score,
      f.competition_id,
      COALESCE(c.name->>'en', '') AS competition_name,
      COALESCE(ht.name->>'en', 'TBD') AS home_team_name,
      COALESCE(at.name->>'en', 'TBD') AS away_team_name,
      l.player_id,
      l.player_name,
      l.player_slug,
      l.photo_url,
      l.club_name
    FROM fixtures f
    JOIN lions l ON l.club_id IN (f.home_team_id, f.away_team_id)
    LEFT JOIN competitions c ON c.id = f.competition_id
    LEFT JOIN teams ht ON ht.id = f.home_team_id
    LEFT JOIN teams at ON at.id = f.away_team_id
    WHERE f.kickoff_at >= NOW() - INTERVAL '6 hours'
      AND f.kickoff_at < NOW() + INTERVAL '8 days'
    ORDER BY f.kickoff_at ASC, l.player_name ASC
  `);

  const byId = new Map<number, LionsAbroadFixture>();
  for (const row of result.rows as Array<Record<string, unknown>>) {
    const id = Number(row.id);
    let fixture = byId.get(id);
    if (!fixture) {
      const kickoff = row.kickoff_at;
      fixture = {
        id,
        kickoffAt: kickoff instanceof Date ? kickoff.toISOString() : String(kickoff),
        statusCode: String(row.status_code),
        minute: row.minute == null ? null : Number(row.minute),
        homeTeamId: row.home_team_id == null ? null : Number(row.home_team_id),
        awayTeamId: row.away_team_id == null ? null : Number(row.away_team_id),
        homeScore: row.home_score == null ? null : Number(row.home_score),
        awayScore: row.away_score == null ? null : Number(row.away_score),
        homeTeamName: String(row.home_team_name),
        awayTeamName: String(row.away_team_name),
        competitionId: row.competition_id == null ? null : Number(row.competition_id),
        competitionName: String(row.competition_name),
        players: [],
      };
      byId.set(id, fixture);
    }
    fixture.players.push({
      playerId: Number(row.player_id),
      playerName: String(row.player_name),
      playerSlug: String(row.player_slug),
      photoUrl: (row.photo_url as string | null) ?? null,
      clubName: String(row.club_name),
    });
  }
  return [...byId.values()];
}

export async function getLionsAbroadHubData(): Promise<LionsAbroadHubData> {
  'use cache';
  cacheLife('minutes');
  const [fixtures, performances] = await Promise.all([
    loadLionsAbroadFixtures(),
    getMoroccanPlayerPerformances(db, 7, 24),
  ]);
  return { fixtures, performances };
}

export function isLiveLionsFixture(statusCode: string): boolean {
  return (LIVE_CODES_ARRAY as readonly string[]).includes(statusCode);
}
