/**
 * Phase 3 exit criteria test.
 * "Subscribe from a test client → write a fake live row → push received within 2s."
 *
 * Run: tsx --env-file=.env.local scripts/test-realtime.ts
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Pusher: PusherClient } = require('pusher-js') as {
  Pusher: typeof import('pusher-js').default;
};
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import Pusher from 'pusher';
import * as schema from '../src/lib/db/schema';
import { CHANNELS, EVENTS } from '../src/lib/realtime/channels';
import type { ScoreUpdatePayload } from '../src/lib/realtime/channels';
import { LEAGUE_IDS, TEAM_IDS } from '../src/lib/constants/canonical-ids';

const SENTINEL_FIXTURE_ID = 9_000_001;
const TIMEOUT_MS = 5_000;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log('=== Phase 3 Exit Criteria Test ===\n');

  // 1. Connect Pusher client
  console.log('[1] Connecting Pusher client...');
  const client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  });

  const channel = client.subscribe(CHANNELS.LIVE_SCORES);

  // Wait for subscription to succeed
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Subscription timed out after 5s')),
      TIMEOUT_MS,
    );
    channel.bind('pusher:subscription_succeeded', () => {
      clearTimeout(timer);
      resolve();
    });
  });
  console.log('[1] Subscribed to channel:', CHANNELS.LIVE_SCORES);

  // 2. Insert sentinel fixture into Neon
  console.log('[2] Inserting sentinel fixture (id=%d)...', SENTINEL_FIXTURE_ID);
  await db
    .insert(schema.fixtures)
    .values({
      id: SENTINEL_FIXTURE_ID,
      competitionId: LEAGUE_IDS.BOTOLA_PRO_1,
      seasonYear: 2026,
      round: 'Test Round',
      roundNumber: 99,
      kickoffAt: new Date(),
      statusCode: '1H',
      minute: 10,
      homeTeamId: TEAM_IDS.WYDAD,
      awayTeamId: TEAM_IDS.RAJA,
      homeScore: 1,
      awayScore: 0,
    })
    .onConflictDoUpdate({
      target: schema.fixtures.id,
      set: { statusCode: '1H', minute: 10, homeScore: 1, awayScore: 0, updatedAt: new Date() },
    });
  console.log('[2] Sentinel fixture inserted.');

  // 3. Bind event listener and trigger from server
  const payload: ScoreUpdatePayload = {
    fixtureId: SENTINEL_FIXTURE_ID,
    homeScore: 1,
    awayScore: 0,
    statusCode: '1H',
    minute: 10,
    extraMinute: null,
  };

  const latencyPromise = new Promise<number>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`FAIL: No event received within ${TIMEOUT_MS}ms`)),
      TIMEOUT_MS,
    );

    channel.bind(EVENTS.SCORE_UPDATE, (data: ScoreUpdatePayload) => {
      if (data.fixtureId === SENTINEL_FIXTURE_ID) {
        const latency = Date.now() - t0;
        clearTimeout(timer);
        resolve(latency);
      }
    });
  });

  console.log('[3] Triggering Pusher event from server...');
  const server = new Pusher({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  });

  const t0 = Date.now();
  await server.trigger(CHANNELS.LIVE_SCORES, EVENTS.SCORE_UPDATE, payload);

  // 4. Wait for event and measure latency
  const latency = await latencyPromise;
  console.log('[4] Event received. Latency: %dms', latency);

  // 5. Cleanup: delete sentinel fixture
  console.log('[5] Cleaning up sentinel fixture...');
  await db.delete(schema.fixtures).where(eq(schema.fixtures.id, SENTINEL_FIXTURE_ID));
  console.log('[5] Sentinel fixture deleted.');

  // 6. Disconnect
  client.disconnect();

  // 7. Verdict
  console.log('\n=== Result ===');
  if (latency < 2000) {
    console.log('PASS: push received in %dms (< 2000ms)', latency);
    process.exit(0);
  } else {
    console.log('FAIL: push received in %dms (>= 2000ms)', latency);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FAIL:', err instanceof Error ? err.message : err);
  // Attempt cleanup even on failure
  db.delete(schema.fixtures)
    .where(eq(schema.fixtures.id, SENTINEL_FIXTURE_ID))
    .then(() => process.exit(1))
    .catch(() => process.exit(1));
});
