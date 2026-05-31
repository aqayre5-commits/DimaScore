import { inArray } from 'drizzle-orm';
import { getDataProvider } from '@/lib/data';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';
import { getPusherServer } from '@/lib/realtime/pusher-server';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload } from '@/lib/realtime/channels';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { computeDeltas, type FixtureRow } from './diff';
import { trackCall, resetTick, isQuotaExhausted } from './quota';

const TRACKED_COMPETITION_IDS = new Set(VERIFIED_COMPETITIONS.map((c) => c.id));

export interface PollResult {
  liveCount: number;
  trackedCount: number;
  updatedCount: number;
  apiCalls: number;
}

export async function pollLiveFixtures(): Promise<PollResult> {
  if (isQuotaExhausted()) {
    console.warn('[poller] Quota nearly exhausted, skipping poll');
    return { liveCount: 0, trackedCount: 0, updatedCount: 0, apiCalls: 0 };
  }

  const provider = getDataProvider();

  const allLive = await provider.getLiveFixtures();
  trackCall();

  const liveFixtures = allLive.filter((f) => TRACKED_COMPETITION_IDS.has(f.league.id));

  if (liveFixtures.length === 0) {
    const { tickCalls } = resetTick();
    return { liveCount: allLive.length, trackedCount: 0, updatedCount: 0, apiCalls: tickCalls };
  }

  const fixtureIds = liveFixtures.map((f) => f.id);
  const dbRows = await db
    .select({
      id: schema.fixtures.id,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
    })
    .from(schema.fixtures)
    .where(inArray(schema.fixtures.id, fixtureIds));

  const dbMap = new Map<number, FixtureRow>(dbRows.map((r) => [r.id, r]));
  const deltas = computeDeltas(liveFixtures, dbMap);

  if (deltas.length === 0) {
    const { tickCalls } = resetTick();
    return {
      liveCount: allLive.length,
      trackedCount: liveFixtures.length,
      updatedCount: 0,
      apiCalls: tickCalls,
    };
  }

  const pusher = getPusherServer();

  for (const delta of deltas) {
    const fixture = liveFixtures.find((f) => f.id === delta.fixtureId)!;
    const row = mapFixtureToInsert(fixture);

    await db
      .insert(schema.fixtures)
      .values(row)
      .onConflictDoUpdate({
        target: schema.fixtures.id,
        set: {
          statusCode: row.statusCode,
          minute: row.minute,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          homeScoreHt: row.homeScoreHt,
          awayScoreHt: row.awayScoreHt,
          homeScoreFt: row.homeScoreFt,
          awayScoreFt: row.awayScoreFt,
          homeScoreEt: row.homeScoreEt,
          awayScoreEt: row.awayScoreEt,
          homeScorePen: row.homeScorePen,
          awayScorePen: row.awayScorePen,
          updatedAt: new Date(),
        },
      });

    const payload: ScoreUpdatePayload = {
      fixtureId: delta.fixtureId,
      homeName: fixture.homeTeam.name,
      awayName: fixture.awayTeam.name,
      homeScore: fixture.goals.home,
      awayScore: fixture.goals.away,
      statusCode: fixture.status.short,
      minute: fixture.status.elapsed,
      extraMinute: null,
    };

    try {
      await pusher.trigger(CHANNELS.LIVE_SCORES, EVENTS.SCORE_UPDATE, payload);
      await pusher.trigger(CHANNELS.fixture(delta.fixtureId), EVENTS.SCORE_UPDATE, payload);
    } catch (pusherErr) {
      console.error(`  [pusher] Failed to trigger for fixture=${delta.fixtureId}:`, pusherErr);
    }

    console.log(
      `  [delta] fixture=${delta.fixtureId} changes=[${delta.changes.join(',')}] score=${fixture.goals.home}-${fixture.goals.away} status=${fixture.status.short} min=${fixture.status.elapsed}`,
    );
  }

  const { tickCalls } = resetTick();
  return {
    liveCount: allLive.length,
    trackedCount: liveFixtures.length,
    updatedCount: deltas.length,
    apiCalls: tickCalls,
  };
}
