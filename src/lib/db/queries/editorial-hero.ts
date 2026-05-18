import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { TEAM_IDS, LEAGUE_IDS } from '@/lib/constants/canonical-ids';
import { getMetadataForCompetition } from '@/lib/constants/tournament-metadata';

// ── Types ──

type TeamSnapshot = {
  id: number;
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl: string | null;
  isNational: boolean | null;
};

interface HeroFixture {
  id: number;
  kickoffAt: Date;
  statusCode: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: TeamSnapshot | null;
  awayTeam: TeamSnapshot | null;
  competitionId: number;
  competitionName: Record<string, string>;
  competitionSlug: string;
  venueName: string | null;
}

// ── Result types (discriminated union per mode) ──

export type EditorialHeroData =
  | { mode: 'A'; fixture: HeroFixture }
  | { mode: 'B'; fixture: HeroFixture; daysUntil: number }
  | { mode: 'C'; fixture: HeroFixture }
  | { mode: 'D'; tournament: string; daysUntil: number; moroccoGroup: string }
  | { mode: 'E' };

const LIVE_STATUSES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];

// ── Main query ──

/**
 * Resolve editorial hero data for the homepage.
 * Priority: A (live Morocco) > B (Atlas Lions <=7d) > C (Botola highlight) > D (milestone) > E (fallback)
 * Max 3 queries (short-circuits on first match).
 */
export async function getEditorialHeroData(
  db: NeonHttpDatabase<typeof schema>,
): Promise<EditorialHeroData> {
  // Mode A: Live Morocco/Atlas Lions fixture
  const liveRow = await db
    .select({
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
      compSlug: schema.competitions.slug,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      and(
        inArray(schema.fixtures.statusCode, LIVE_STATUSES),
        sql`(${schema.fixtures.homeTeamId} = ${TEAM_IDS.MOROCCO_MEN} OR ${schema.fixtures.awayTeamId} = ${TEAM_IDS.MOROCCO_MEN})`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(1);

  if (liveRow.length > 0) {
    const fixture = await hydrateHeroRow(db, liveRow[0]);
    return { mode: 'A', fixture };
  }

  // Mode B: Atlas Lions match within 7 days
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingAtlasLions = await db
    .select({
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
      compSlug: schema.competitions.slug,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      and(
        eq(schema.fixtures.statusCode, 'NS'),
        sql`(${schema.fixtures.homeTeamId} = ${TEAM_IDS.MOROCCO_MEN} OR ${schema.fixtures.awayTeamId} = ${TEAM_IDS.MOROCCO_MEN})`,
        sql`${schema.fixtures.kickoffAt} > ${now.toISOString()}`,
        sql`${schema.fixtures.kickoffAt} <= ${sevenDaysOut.toISOString()}`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(1);

  if (upcomingAtlasLions.length > 0) {
    const fixture = await hydrateHeroRow(db, upcomingAtlasLions[0]);
    const daysUntil = Math.ceil(
      (upcomingAtlasLions[0].kickoffAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { mode: 'B', fixture, daysUntil };
  }

  // Mode C: Botola Pro highlight (next upcoming Botola fixture)
  const botolaHighlight = await db
    .select({
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
      compSlug: schema.competitions.slug,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      and(
        eq(schema.fixtures.competitionId, LEAGUE_IDS.BOTOLA_PRO_1),
        eq(schema.fixtures.statusCode, 'NS'),
        sql`${schema.fixtures.kickoffAt} > ${now.toISOString()}`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(1);

  if (botolaHighlight.length > 0) {
    const fixture = await hydrateHeroRow(db, botolaHighlight[0]);
    return { mode: 'C', fixture };
  }

  // Mode D: Tournament milestone (WC 2026 within 90 days)
  const wc2026 = getMetadataForCompetition(LEAGUE_IDS.WORLD_CUP);
  if (wc2026 && wc2026.type === 'cup') {
    const kickoff = new Date(wc2026.kickoffDate);
    const daysUntil = Math.ceil((kickoff.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil > 0 && daysUntil <= 90) {
      const moroccoGroup = wc2026.groups.find((g) => g.isMoroccoGroup)?.label ?? 'C';
      return { mode: 'D', tournament: 'WC 2026', daysUntil, moroccoGroup };
    }
  }

  // Mode E: Fallback
  return { mode: 'E' };
}

// ── Hydration helper ──

type HeroRow = {
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
  compSlug: string;
};

async function hydrateHeroRow(
  db: NeonHttpDatabase<typeof schema>,
  row: HeroRow,
): Promise<HeroFixture> {
  const teamIds: number[] = [];
  if (row.homeTeamId != null) teamIds.push(row.homeTeamId);
  if (row.awayTeamId != null) teamIds.push(row.awayTeamId);

  const teamsMap = new Map<number, TeamSnapshot>();
  if (teamIds.length > 0) {
    const teams = await db
      .select({
        id: schema.teams.id,
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

  return {
    id: row.id,
    kickoffAt: row.kickoffAt,
    statusCode: row.statusCode,
    minute: row.minute,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeTeam: row.homeTeamId ? (teamsMap.get(row.homeTeamId) ?? null) : null,
    awayTeam: row.awayTeamId ? (teamsMap.get(row.awayTeamId) ?? null) : null,
    competitionId: row.compId,
    competitionName: row.compName,
    competitionSlug: row.compSlug,
    venueName: null,
  };
}
