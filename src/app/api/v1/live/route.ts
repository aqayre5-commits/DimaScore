import { NextResponse } from 'next/server';
import { inArray, or, and, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { LIVE_CODES_ARRAY, FINISHED_CODES_ARRAY } from '@/lib/match-status';
import type { LiveFixturePatch } from '@/lib/realtime/live-types';

// Live data — never cached. With cacheComponents, route handlers are dynamic by default
// (no 'use cache'), and the response sets no-store. Polled by the client every 30s.
export async function GET() {
  // Currently-live fixtures, plus ones finished in the last 4h so a client that
  // was watching sees the final score + live→FT transition before they age out.
  const rows: LiveFixturePatch[] = await db
    .select({
      id: schema.fixtures.id,
      statusCode: schema.fixtures.statusCode,
      minute: schema.fixtures.minute,
      extraMinute: schema.fixtures.extraMinute,
      homeScore: schema.fixtures.homeScore,
      awayScore: schema.fixtures.awayScore,
      homeScorePen: schema.fixtures.homeScorePen,
      awayScorePen: schema.fixtures.awayScorePen,
    })
    .from(schema.fixtures)
    .where(
      or(
        inArray(schema.fixtures.statusCode, [...LIVE_CODES_ARRAY]),
        and(
          inArray(schema.fixtures.statusCode, [...FINISHED_CODES_ARRAY]),
          gte(schema.fixtures.kickoffAt, sql`NOW() - INTERVAL '4 hours'`),
        ),
      ),
    );

  return NextResponse.json({ fixtures: rows }, { headers: { 'Cache-Control': 'no-store' } });
}
