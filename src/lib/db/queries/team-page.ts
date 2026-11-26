/**
 * Data for the redesigned team page (club + national team). Read-only; history depth is the
 * current season plus the last one (fixtures, results, player tallies, transfers).
 */
import { and, desc, eq, gte, inArray, or } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '../schema';
import { hydrateFixtures, getTeamsMap } from '../queries-hydrate';
import type { FixtureWithCompetition, CompetitionSnapshot } from './team';
import { resolveCompetitionLogo } from '@/lib/constants/competition-logos';

type Db = NeonHttpDatabase<typeof schema>;

export type TeamPageFixture = FixtureWithCompetition & {
  competitionId: number | null;
  seasonYear: number;
};

export interface TeamPageCompetition extends CompetitionSnapshot {
  slug: string;
  type: string | null;
  countryCode: string | null;
}

/** The team's fixtures from `sinceYear` on (season_year), oldest first. */
export async function getTeamWindowFixtures(
  db: Db,
  teamId: number,
  sinceYear: number,
  limit = 220,
): Promise<{ fixtures: TeamPageFixture[]; competitions: TeamPageCompetition[] }> {
  const rows = await db
    .select()
    .from(schema.fixtures)
    .where(
      and(
        or(eq(schema.fixtures.homeTeamId, teamId), eq(schema.fixtures.awayTeamId, teamId)),
        gte(schema.fixtures.seasonYear, sinceYear),
      ),
    )
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(limit);
  rows.reverse();
  const hydrated = await hydrateFixtures(db, rows);
  const compIds = [
    ...new Set(rows.map((r) => r.competitionId).filter((v): v is number => v != null)),
  ];
  const comps = compIds.length
    ? await db
        .select({
          id: schema.competitions.id,
          name: schema.competitions.name,
          logoUrl: schema.competitions.logoUrl,
          slug: schema.competitions.slug,
          type: schema.competitions.type,
          countryCode: schema.competitions.countryCode,
        })
        .from(schema.competitions)
        .where(inArray(schema.competitions.id, compIds))
    : [];
  const map = new Map<number, TeamPageCompetition>(
    comps.map((c) => [c.id, { ...c, logoUrl: resolveCompetitionLogo(c.id, c.logoUrl) }]),
  );
  return {
    fixtures: hydrated.map((f, i) => ({
      ...f,
      competition: rows[i].competitionId ? (map.get(rows[i].competitionId!) ?? null) : null,
      competitionId: rows[i].competitionId,
      seasonYear: rows[i].seasonYear,
    })),
    competitions: [...map.values()],
  };
}

export interface TeamMatchEvent {
  fixtureId: number;
  teamId: number | null;
  playerId: number | null;
  assistPlayerId: number | null;
  type: string;
  detail: string | null;
  minute: number | null;
  extraMinute: number | null;
}

export interface TeamLineupPlayer {
  id: number | null;
  name: string;
  number: number | null;
  pos: string | null;
}

/** Goals, cards and substitutions for the given fixtures (both teams), plus the team's line-ups. */
export async function getTeamMatchSheets(
  db: Db,
  teamId: number,
  fixtureIds: number[],
): Promise<{
  events: TeamMatchEvent[];
  lineups: { fixtureId: number; starters: TeamLineupPlayer[]; substitutes: TeamLineupPlayer[] }[];
  captains: { fixtureId: number; playerId: number }[];
}> {
  if (fixtureIds.length === 0) return { events: [], lineups: [], captains: [] };
  const [events, lineups, captains] = await Promise.all([
    db
      .select({
        fixtureId: schema.fixtureEvents.fixtureId,
        teamId: schema.fixtureEvents.teamId,
        playerId: schema.fixtureEvents.playerId,
        assistPlayerId: schema.fixtureEvents.assistPlayerId,
        type: schema.fixtureEvents.type,
        detail: schema.fixtureEvents.detail,
        minute: schema.fixtureEvents.minute,
        extraMinute: schema.fixtureEvents.extraMinute,
      })
      .from(schema.fixtureEvents)
      .where(
        and(
          inArray(schema.fixtureEvents.fixtureId, fixtureIds),
          inArray(schema.fixtureEvents.type, ['Goal', 'Card', 'subst']),
        ),
      ),
    db
      .select({
        fixtureId: schema.fixtureLineups.fixtureId,
        starters: schema.fixtureLineups.starters,
        substitutes: schema.fixtureLineups.substitutes,
      })
      .from(schema.fixtureLineups)
      .where(
        and(
          inArray(schema.fixtureLineups.fixtureId, fixtureIds),
          eq(schema.fixtureLineups.teamId, teamId),
        ),
      ),
    db
      .select({
        fixtureId: schema.fixturePlayerStats.fixtureId,
        playerId: schema.fixturePlayerStats.playerId,
      })
      .from(schema.fixturePlayerStats)
      .where(
        and(
          inArray(schema.fixturePlayerStats.fixtureId, fixtureIds.slice(-6)),
          eq(schema.fixturePlayerStats.teamId, teamId),
          eq(schema.fixturePlayerStats.captain, true),
        ),
      ),
  ]);
  const toPlayers = (v: unknown): TeamLineupPlayer[] =>
    Array.isArray(v)
      ? v
          .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
          .map((p) => ({
            id: typeof p.id === 'number' ? p.id : p.id != null ? Number(p.id) || null : null,
            name: typeof p.name === 'string' ? p.name : '',
            number: typeof p.number === 'number' ? p.number : null,
            pos: typeof p.pos === 'string' ? p.pos : null,
          }))
      : [];
  return {
    events,
    lineups: lineups.map((l) => ({
      fixtureId: l.fixtureId,
      starters: toPlayers(l.starters),
      substitutes: toPlayers(l.substitutes),
    })),
    captains,
  };
}

/** id → { slug, name, current club } for players named on the page. */
export async function getPlayersById(db: Db, ids: number[]) {
  if (ids.length === 0) return new Map<number, PlayerRef>();
  const rows = await db
    .select({
      id: schema.players.id,
      slug: schema.players.slug,
      name: schema.players.name,
      currentTeamId: schema.players.currentTeamId,
    })
    .from(schema.players)
    .where(inArray(schema.players.id, ids));
  return new Map<number, PlayerRef>(rows.map((r) => [r.id, r]));
}

export interface PlayerRef {
  id: number;
  slug: string;
  name: Record<string, string>;
  currentTeamId: number | null;
}

export interface TeamTransferRow {
  playerId: number | null;
  date: string | null;
  type: string | null;
  otherTeamId: number | null;
  direction: 'in' | 'out';
}

/** Arrivals and departures since `sinceDate` (YYYY-MM-DD). */
export async function getTeamTransfers(
  db: Db,
  teamId: number,
  sinceDate: string,
): Promise<TeamTransferRow[]> {
  const rows = await db
    .select({
      playerId: schema.transfers.playerId,
      date: schema.transfers.date,
      type: schema.transfers.type,
      fromTeamId: schema.transfers.fromTeamId,
      toTeamId: schema.transfers.toTeamId,
    })
    .from(schema.transfers)
    .where(
      and(
        or(eq(schema.transfers.toTeamId, teamId), eq(schema.transfers.fromTeamId, teamId)),
        gte(schema.transfers.date, sinceDate),
      ),
    )
    .orderBy(desc(schema.transfers.date))
    .limit(120);
  return rows.map((r) => ({
    playerId: r.playerId,
    date: r.date,
    type: r.type,
    otherTeamId: r.toTeamId === teamId ? r.fromTeamId : r.toTeamId,
    direction: r.toTeamId === teamId ? ('in' as const) : ('out' as const),
  }));
}

export { getTeamsMap };
