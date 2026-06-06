import { createHash } from 'node:crypto';
import { inArray, or, and, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { LIVE_CODES_ARRAY, FINISHED_CODES_ARRAY } from '@/lib/match-status';
import type { LiveFixturePatch } from '@/lib/realtime/live-types';

// Live data. A short shared (CDN) cache collapses concurrent DB reads at scale, while the
// browser revalidates each poll (max-age=0) so it never serves stale and gets a cheap 304
// when nothing changed. Polled by the client (useLiveFixtures).
export async function GET(request: Request) {
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

  const body = JSON.stringify({ fixtures: rows });
  const etag = `"${createHash('sha1').update(body).digest('base64url')}"`;
  const headers = {
    'Content-Type': 'application/json',
    ETag: etag,
    'Cache-Control': 'public, max-age=0, s-maxage=5, stale-while-revalidate=30',
  };

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(body, { status: 200, headers });
}
