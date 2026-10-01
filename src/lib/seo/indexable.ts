import { cache } from 'react';
import { sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

type DB = NeonHttpDatabase<typeof schema>;

/**
 * Indexability gates — keep thin/empty entity pages out of Google's index (and the sitemap).
 *
 * The SAME rule must apply in two places: a page's `generateMetadata` (`robots.index`) and the
 * sitemap WHERE. To avoid drift, each entity's rule lives here once — a `sql` condition for the
 * sitemap query and a matching per-id helper for `generateMetadata`.
 *
 * Player rule (approved): indexable if the slug is real (not the "unknown-%" placeholder) AND the
 * player has at least one real data signal — a current team, OR season stats, OR a transfer, OR a
 * trophy. Everything else is noindex + de-sitemapped.
 */
export const playerIndexableSitemapCondition = sql`(
  ${schema.players.slug} NOT LIKE 'unknown-%'
  AND (
    ${schema.players.currentTeamId} IS NOT NULL
    OR EXISTS (SELECT 1 FROM player_season_stats pss WHERE pss.player_id = ${schema.players.id})
    OR EXISTS (SELECT 1 FROM transfers tr WHERE tr.player_id = ${schema.players.id})
    OR EXISTS (SELECT 1 FROM player_trophies ptr WHERE ptr.player_id = ${schema.players.id})
  )
)`;

/** Matches `playerIndexableSitemapCondition` for a single player. `hasCurrentTeam` short-circuits
 * the common indexable case so no query runs for players who already have a team. */
export const isPlayerIndexable = cache(async function isPlayerIndexable(
  db: DB,
  id: number,
  slug: string,
  hasCurrentTeam: boolean,
): Promise<boolean> {
  if (slug.startsWith('unknown-')) return false;
  if (hasCurrentTeam) return true;
  const res = await db.execute(sql`SELECT (
    EXISTS (SELECT 1 FROM player_season_stats WHERE player_id = ${id})
    OR EXISTS (SELECT 1 FROM transfers WHERE player_id = ${id})
    OR EXISTS (SELECT 1 FROM player_trophies WHERE player_id = ${id})
  ) AS indexable`);
  return Boolean((res.rows[0] as { indexable: boolean } | undefined)?.indexable);
});
