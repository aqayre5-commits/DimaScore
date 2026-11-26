/**
 * Resolve a team for the redesigned hub URLs (bare name, or the stored id-slug
 * when that bare name collides). Cached in-process for middleware and the page.
 */
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { parseTrailingId } from '@/lib/seo/entity-slug';
import type { HubKind } from '@/lib/team/hub-paths';
import { bareCollisionKey, bareTeamSlug, publicTeamSlug } from '@/lib/team/public-slug';

export interface ResolvedHubTeam {
  id: number;
  storedSlug: string;
  publicSlug: string;
  isNational: boolean;
  kind: HubKind;
}

const COLLISION_TTL_MS = 5 * 60 * 1000;
let collisionCache: { at: number; set: Set<string> } | null = null;

export async function getBareSlugCollisions(): Promise<Set<string>> {
  if (collisionCache && Date.now() - collisionCache.at < COLLISION_TTL_MS)
    return collisionCache.set;
  const res = await db.execute(sql`
    SELECT regexp_replace(slug, '-\\d+$', '') AS bare,
           COALESCE(is_national, false) AS is_national,
           COUNT(*)::int AS n
    FROM teams
    WHERE slug IS NOT NULL AND slug <> ''
    GROUP BY 1, 2
    HAVING COUNT(*) > 1`);
  const set = new Set<string>();
  for (const row of res.rows as { bare: string; is_national: boolean | string; n: number }[]) {
    set.add(
      bareCollisionKey(String(row.bare), row.is_national === true || row.is_national === 't'),
    );
  }
  collisionCache = { at: Date.now(), set };
  return set;
}

async function rowToResolved(row: {
  id: number;
  slug: string;
  isNational: boolean | null;
}): Promise<ResolvedHubTeam> {
  const isNational = !!row.isNational;
  const colliding = await getBareSlugCollisions();
  return {
    id: row.id,
    storedSlug: row.slug,
    publicSlug: publicTeamSlug(row.slug, isNational, colliding),
    isNational,
    kind: isNational ? 'national' : 'club',
  };
}

/**
 * `kind` is passed on the new club/national-team routes (bare-name lookup, unique only).
 * Without `kind` (the earlier `/equipe` URL) we resolve by trailing id or exact stored slug.
 */
export async function resolveHubTeam(
  slug: string,
  kind?: HubKind,
): Promise<ResolvedHubTeam | null> {
  const trailingId = parseTrailingId(slug);
  if (trailingId != null) {
    const [row] = await db
      .select({ id: schema.teams.id, slug: schema.teams.slug, isNational: schema.teams.isNational })
      .from(schema.teams)
      .where(eq(schema.teams.id, trailingId))
      .limit(1);
    return row ? rowToResolved(row) : null;
  }
  if (kind) {
    const isNational = kind === 'national';
    const res = await db.execute(sql`
      SELECT id, slug, is_national
      FROM teams
      WHERE regexp_replace(slug, '-\\d+$', '') = ${slug}
        AND COALESCE(is_national, false) = ${isNational}`);
    const rows = res.rows as { id: number | string; slug: string; is_national: boolean | string }[];
    if (rows.length !== 1) return null;
    const r = rows[0];
    return rowToResolved({
      id: Number(r.id),
      slug: r.slug,
      isNational: r.is_national === true || r.is_national === 't',
    });
  }
  const [row] = await db
    .select({ id: schema.teams.id, slug: schema.teams.slug, isNational: schema.teams.isNational })
    .from(schema.teams)
    .where(eq(schema.teams.slug, slug))
    .limit(1);
  return row ? rowToResolved(row) : null;
}
