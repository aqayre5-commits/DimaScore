import { eq, and, asc, inArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { TEAM_IDS, LEAGUE_IDS } from '@/lib/constants/canonical-ids';
import { getTeamsMap, type TeamSnapshot } from '../queries-hydrate';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

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
  | { mode: 'C'; fixture: HeroFixture }
  | { mode: 'E' };

const LIVE_STATUSES: string[] = [...LIVE_CODES_ARRAY];

// ── Main query ──

/**
 * Resolve editorial hero data for the homepage.
 * Priority: A (live Morocco) > C (Botola highlight) > E (fallback).
 * Max 2 queries (short-circuits on first match).
 *
 * Mode A surfaces a live Morocco fixture when one is on — card-density priority that's
 * appropriate for a brand surface like the hero, no editorial copy. The dedicated Morocco
 * angle (Lions Abroad, /edition/maroc, mega menu Morocco section) handles ongoing Morocco
 * context everywhere else. Modes B (Atlas Lions <=7d) and D (WC 2026 Morocco-group
 * countdown) were removed under the Option 1 neutrality policy: D was also dormant
 * post-WC-kickoff; B pushed editorial-style "Atlas Lions in N days" copy onto the EN hero.
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

  // Mode C: Botola Pro highlight (next upcoming Botola fixture)
  const now = new Date();
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

  const teamsMap = await getTeamsMap(db, teamIds);

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
