import { cacheLife } from 'next/cache';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { matchIndexableSitemapCondition } from '@/lib/seo/indexable';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

export const TODAYS_MATCH_LINKS_MAX = 24;

export interface TodaysMatchLink {
  id: number;
  homeSlug: string | null;
  awaySlug: string | null;
  home: { name: Record<string, string>; shortName: Record<string, string>; code: string | null };
  away: { name: Record<string, string>; shortName: Record<string, string>; code: string | null };
  live: boolean;
  indexable: boolean;
}

type Row = {
  id: number | string;
  home_slug: string | null;
  away_slug: string | null;
  home_name: Record<string, string> | null;
  home_short: Record<string, string> | null;
  home_code: string | null;
  away_name: Record<string, string> | null;
  away_short: Record<string, string> | null;
  away_code: string | null;
  live: boolean;
  indexable: boolean;
};

const liveCodes = sql.raw(LIVE_CODES_ARRAY.map((c) => `'${c.replace(/'/g, "''")}'`).join(', '));

/**
 * Up to 24 of today's (Africa/Casablanca calendar day) + live matches for the server-rendered
 * "Today's matches" link block — the crawlable replacement for the client-only ticker strip.
 * Order: live first, then indexable (same SQL as robots/sitemap), competition display priority,
 * kickoff. Cached ('minutes' profile), shared by every page and locale, so it adds one cheap
 * query per minute at most and no per-request latency.
 */
export async function getTodaysMatchLinks(): Promise<TodaysMatchLink[]> {
  'use cache';
  cacheLife('minutes');
  try {
    const res = await db.execute(sql`
      WITH day AS (
        SELECT (date_trunc('day', NOW() AT TIME ZONE 'Africa/Casablanca') AT TIME ZONE 'Africa/Casablanca') AS start
      )
      SELECT fixtures.id AS id,
        ht.slug AS home_slug, ht.name AS home_name, ht.short_name AS home_short, ht.code AS home_code,
        aw.slug AS away_slug, aw.name AS away_name, aw.short_name AS away_short, aw.code AS away_code,
        (${schema.fixtures.statusCode} IN (${liveCodes})) AS live,
        ${matchIndexableSitemapCondition} AS indexable
      FROM fixtures
      JOIN teams ht ON ht.id = fixtures.home_team_id
      JOIN teams aw ON aw.id = fixtures.away_team_id
      LEFT JOIN competitions c ON c.id = fixtures.competition_id
      CROSS JOIN day
      WHERE (
          (fixtures.kickoff_at >= day.start AND fixtures.kickoff_at < day.start + INTERVAL '1 day')
          OR ${schema.fixtures.statusCode} IN (${liveCodes})
        )
        AND ${schema.fixtures.statusCode} NOT IN ('CANC', 'PST', 'ABD', 'SUSP')
      ORDER BY live DESC, indexable DESC, COALESCE(c.display_priority, 100) ASC, fixtures.kickoff_at ASC, fixtures.id ASC
      LIMIT ${TODAYS_MATCH_LINKS_MAX}`);
    return (res.rows as Row[]).map((r) => ({
      id: Number(r.id),
      homeSlug: r.home_slug,
      awaySlug: r.away_slug,
      home: { name: r.home_name ?? {}, shortName: r.home_short ?? {}, code: r.home_code },
      away: { name: r.away_name ?? {}, shortName: r.away_short ?? {}, code: r.away_code },
      live: Boolean(r.live),
      indexable: Boolean(r.indexable),
    }));
  } catch {
    return []; // never break the page chrome over a link block
  }
}
