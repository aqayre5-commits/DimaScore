/** Stored team or player slug for an id. Throws if the database is unreachable. */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import type { SlugRedirectRef } from '@/lib/seo/slug-redirect';

export async function lookupCanonicalSlug(ref: SlugRedirectRef): Promise<string | null> {
  if (ref.kind === 'team') {
    const [row] = await db
      .select({ slug: schema.teams.slug })
      .from(schema.teams)
      .where(eq(schema.teams.id, ref.id))
      .limit(1);
    return row?.slug ?? null;
  }
  const [row] = await db
    .select({ slug: schema.players.slug })
    .from(schema.players)
    .where(eq(schema.players.id, ref.id))
    .limit(1);
  return row?.slug ?? null;
}
