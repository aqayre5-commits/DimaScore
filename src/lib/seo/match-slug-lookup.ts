import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { buildMatchSlug } from '@/lib/seo/match-slug';
import { createCachedSlugLookup } from '@/lib/seo/match-redirect';

const homeT = alias(schema.teams, 'redirect_home_team');
const awayT = alias(schema.teams, 'redirect_away_team');

/** fixtureId → canonical match slug, or null when the fixture doesn't exist. Cached per instance. */
export const lookupMatchSlug = createCachedSlugLookup(async (fixtureId) => {
  const [row] = await db
    .select({ id: schema.fixtures.id, homeSlug: homeT.slug, awaySlug: awayT.slug })
    .from(schema.fixtures)
    .leftJoin(homeT, eq(homeT.id, schema.fixtures.homeTeamId))
    .leftJoin(awayT, eq(awayT.id, schema.fixtures.awayTeamId))
    .where(eq(schema.fixtures.id, fixtureId))
    .limit(1);
  return row ? buildMatchSlug(row.homeSlug, row.awaySlug, row.id) : null;
});
