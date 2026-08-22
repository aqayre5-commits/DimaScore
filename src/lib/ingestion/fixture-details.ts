import { eq, and, sql, inArray, desc } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type {
  NormalizedFixtureEvent,
  NormalizedFixtureLineup,
  NormalizedFixtureStatistic,
  NormalizedFixturePlayer,
} from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';

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
    comments: e.comments ?? null,
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

  await runWrites(async (tx) => {
    // Events: delete existing + batch insert fresh
    if (events.length > 0) {
      const eventRows = events.map((e) => mapEvent(fixtureId, e));
      await tx.delete(schema.fixtureEvents).where(eq(schema.fixtureEvents.fixtureId, fixtureId));
      await tx.insert(schema.fixtureEvents).values(eventRows);
      eventsCount = eventRows.length;
    }

    // Lineups: upsert per team
    for (const l of lineups) {
      const row = mapLineup(fixtureId, l);
      await tx
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
      await tx
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
        await tx
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

    // Only mark synced when something landed. An empty provider response
    // (common right after FT) must stay in the retry queue.
    if (eventsCount + lineupsCount + statisticsCount + playerStatsCount > 0) {
      await tx
        .update(schema.fixtures)
        .set({ detailsSyncedAt: new Date() })
        .where(eq(schema.fixtures.id, fixtureId));
    }
  });

  return {
    events: eventsCount,
    lineups: lineupsCount,
    statistics: statisticsCount,
    playerStats: playerStatsCount,
  };
}

// ── Live sync: events, lineups, and/or team stats — never sets detailsSyncedAt ──

/**
 * Lightweight detail sync for an in-progress match. Gated by `want` so an uncovered
 * feed is skipped. Never marks detailsSyncedAt — the post-FT cron still runs the
 * full sync (player stats included) once the match ends.
 */
export async function syncLiveFixtureDetails(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
  want: { events: boolean; lineups: boolean; statistics?: boolean },
): Promise<{ events: number; lineups: number; statistics: number }> {
  const [events, lineups, statistics] = await Promise.all([
    want.events
      ? provider
          .getFixtureEvents({ fixture: fixtureId })
          .catch(() => [] as NormalizedFixtureEvent[])
      : Promise.resolve([] as NormalizedFixtureEvent[]),
    want.lineups
      ? provider
          .getFixtureLineups({ fixture: fixtureId })
          .catch(() => [] as NormalizedFixtureLineup[])
      : Promise.resolve([] as NormalizedFixtureLineup[]),
    want.statistics
      ? provider
          .getFixtureStatistics({ fixture: fixtureId })
          .catch(() => [] as NormalizedFixtureStatistic[])
      : Promise.resolve([] as NormalizedFixtureStatistic[]),
  ]);

  let eventsCount = 0;
  let lineupsCount = 0;
  let statisticsCount = 0;

  await runWrites(async (tx) => {
    if (want.events && events.length > 0) {
      const eventRows = events.map((e) => mapEvent(fixtureId, e));
      await tx.delete(schema.fixtureEvents).where(eq(schema.fixtureEvents.fixtureId, fixtureId));
      await tx.insert(schema.fixtureEvents).values(eventRows);
      eventsCount = eventRows.length;
    }

    for (const l of lineups) {
      const row = mapLineup(fixtureId, l);
      await tx
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

    for (const s of statistics) {
      const row = mapStatistics(fixtureId, s);
      await tx
        .insert(schema.fixtureStatistics)
        .values(row)
        .onConflictDoUpdate({
          target: [schema.fixtureStatistics.fixtureId, schema.fixtureStatistics.teamId],
          set: { stats: row.stats },
        });
      statisticsCount++;
    }
  });

  return { events: eventsCount, lineups: lineupsCount, statistics: statisticsCount };
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
    // Newest finished fixtures first — a live-scores product needs the latest matchday's events
    // before any old backfill, so recent results don't sit behind a stale queue.
    .orderBy(desc(schema.fixtures.kickoffAt))
    .limit(limit);

  return rows.map((r) => r.id);
}

/**
 * Recent shootout fixtures whose events were synced before the shootout kicks were
 * published upstream: status PEN, detailsSyncedAt already set, but no penalty events
 * at minute ≥119. The post-FT sync sets detailsSyncedAt once, so without this sweep
 * such fixtures keep a permanent hole in their timeline (e.g. Netherlands–Morocco WC R32).
 * Bounded to the last 48h — historical healing is a one-off backfill, not the cron's job.
 */
export async function getPenFixturesMissingShootout(
  db: NeonHttpDatabase<typeof schema>,
  limit = 10,
): Promise<number[]> {
  const rows = await db.execute(
    sql`SELECT f.id FROM fixtures f
        WHERE f.status_code = 'PEN'
          AND f.details_synced_at IS NOT NULL
          AND f.kickoff_at > NOW() - INTERVAL '48 hours'
          AND NOT EXISTS (
            SELECT 1 FROM fixture_events fe
            WHERE fe.fixture_id = f.id
              AND fe.minute >= 119
              AND fe.detail ILIKE '%penalty%'
          )
        ORDER BY f.kickoff_at DESC
        LIMIT ${limit}`,
  );

  return (rows.rows as { id: number }[]).map((r) => Number(r.id));
}

/**
 * Finished matches that were marked synced (or never queued) but have a score and
 * no goal events. Bounded to 48h so the cron heals opening-weekend holes without
 * re-walking historical seasons.
 */
export async function getScoredFixturesMissingEvents(
  db: NeonHttpDatabase<typeof schema>,
  limit = 20,
): Promise<number[]> {
  const rows = await db.execute(
    sql`SELECT f.id FROM fixtures f
        WHERE f.status_code IN ('FT', 'AET', 'PEN')
          AND f.kickoff_at > NOW() - INTERVAL '48 hours'
          AND COALESCE(f.home_score, 0) + COALESCE(f.away_score, 0) > 0
          AND NOT EXISTS (
            SELECT 1 FROM fixture_events fe
            WHERE fe.fixture_id = f.id
              AND fe.type = 'Goal'
          )
        ORDER BY f.kickoff_at DESC
        LIMIT ${limit}`,
  );

  return (rows.rows as { id: number }[]).map((r) => Number(r.id));
}
