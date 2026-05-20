import { eq, and, sql, inArray, asc } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type {
  NormalizedFixtureEvent,
  NormalizedFixtureLineup,
  NormalizedFixtureStatistic,
  NormalizedFixturePlayer,
} from '@/lib/data/types';
import * as schema from '@/lib/db/schema';

// ── Events ──

function mapEvent(fixtureId: number, e: NormalizedFixtureEvent) {
  return {
    fixtureId,
    teamId: e.team?.id ?? null,
    playerId: e.player?.id ?? null,
    assistPlayerId: e.assist?.id ?? null,
    minute: e.time?.elapsed ?? null,
    extraMinute: e.time?.extra ?? null,
    type: e.type,
    detail: e.detail,
    comments: ((e as unknown as Record<string, unknown>).comments as string) ?? null,
  };
}

// ── Lineups ──

function mapLineup(fixtureId: number, l: NormalizedFixtureLineup) {
  return {
    fixtureId,
    teamId: l.team.id,
    coachId: l.coach?.id ?? null,
    formation: l.formation,
    starters: (l.startXI ?? []).map((s) => s.player),
    substitutes: (l.substitutes ?? []).map((s) => s.player),
  };
}

// ── Statistics ──

function mapStatistics(fixtureId: number, s: NormalizedFixtureStatistic) {
  const statsObj: Record<string, number | string | null> = {};
  for (const stat of s.statistics ?? []) {
    statsObj[stat.type] = stat.value;
  }
  return {
    fixtureId,
    teamId: s.team.id,
    stats: statsObj,
  };
}

// ── Player stats ──

function mapPlayerStats(
  fixtureId: number,
  teamId: number,
  p: NormalizedFixturePlayer['players'][0],
) {
  const s = p.statistics[0];
  return {
    fixtureId,
    teamId,
    playerId: p.player.id,
    minutesPlayed: s?.minutes ?? null,
    rating: s?.rating ?? null,
    captain: s?.captain ?? false,
    position: s?.position ?? null,
    substitute: false,
    stats: s ?? {},
  };
}

// ── Sync one fixture ──

export async function syncFixtureDetails(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
): Promise<{ events: number; lineups: number; statistics: number; playerStats: number }> {
  const [events, lineups, statistics, players] = await Promise.all([
    provider.getFixtureEvents({ fixture: fixtureId }).catch(() => []),
    provider.getFixtureLineups({ fixture: fixtureId }).catch(() => []),
    provider.getFixtureStatistics({ fixture: fixtureId }).catch(() => []),
    provider.getFixturePlayers({ fixture: fixtureId }).catch(() => []),
  ]);

  let eventsCount = 0;
  let lineupsCount = 0;
  let statisticsCount = 0;
  let playerStatsCount = 0;

  // Events: delete existing + insert fresh
  if (events.length > 0) {
    await db.delete(schema.fixtureEvents).where(eq(schema.fixtureEvents.fixtureId, fixtureId));

    for (const e of events) {
      const row = mapEvent(fixtureId, e);
      await db.insert(schema.fixtureEvents).values(row);
      eventsCount++;
    }
  }

  // Lineups: upsert per team
  for (const l of lineups) {
    const row = mapLineup(fixtureId, l);
    await db
      .insert(schema.fixtureLineups)
      .values(row)
      .onConflictDoUpdate({
        target: [schema.fixtureLineups.fixtureId, schema.fixtureLineups.teamId],
        set: {
          coachId: row.coachId,
          formation: row.formation,
          starters: row.starters,
          substitutes: row.substitutes,
        },
      });
    lineupsCount++;
  }

  // Statistics: upsert per team
  for (const s of statistics) {
    const row = mapStatistics(fixtureId, s);
    await db
      .insert(schema.fixtureStatistics)
      .values(row)
      .onConflictDoUpdate({
        target: [schema.fixtureStatistics.fixtureId, schema.fixtureStatistics.teamId],
        set: { stats: row.stats },
      });
    statisticsCount++;
  }

  // Player stats: upsert per player
  for (const team of players) {
    if (!team.players) continue;
    for (const p of team.players) {
      const row = mapPlayerStats(fixtureId, team.team.id, p);
      await db
        .insert(schema.fixturePlayerStats)
        .values(row)
        .onConflictDoUpdate({
          target: [schema.fixturePlayerStats.fixtureId, schema.fixturePlayerStats.playerId],
          set: {
            teamId: row.teamId,
            minutesPlayed: row.minutesPlayed,
            rating: row.rating,
            captain: row.captain,
            position: row.position,
            stats: row.stats,
          },
        });
      playerStatsCount++;
    }
  }

  // Mark fixture as synced so it won't be re-processed
  await db
    .update(schema.fixtures)
    .set({ detailsSyncedAt: new Date() })
    .where(eq(schema.fixtures.id, fixtureId));

  return {
    events: eventsCount,
    lineups: lineupsCount,
    statistics: statisticsCount,
    playerStats: playerStatsCount,
  };
}

// ── Batch: find fixtures missing details ──

export async function getFixturesMissingDetails(
  db: NeonHttpDatabase<typeof schema>,
  limit = 50,
): Promise<number[]> {
  const rows = await db
    .select({ id: schema.fixtures.id })
    .from(schema.fixtures)
    .where(
      and(
        inArray(schema.fixtures.statusCode, ['FT', 'AET', 'PEN']),
        sql`${schema.fixtures.detailsSyncedAt} IS NULL`,
      ),
    )
    .orderBy(asc(schema.fixtures.kickoffAt))
    .limit(limit);

  return rows.map((r) => r.id);
}
