/**
 * Existence lookup for match / team / player URLs. Throws on database failure so the caller
 * can answer 503 instead of treating an outage as "this id was never real".
 */

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { entityLookupKey, type EntityRef } from '@/lib/seo/entity-http';

export async function lookupEntity(ref: EntityRef): Promise<'found' | 'missing'> {
  const key = entityLookupKey(ref);
  if (key.by === 'impossible') return 'missing';

  if (ref.kind === 'match') {
    if (key.by !== 'id') return 'missing';
    const [row] = await db
      .select({ id: schema.fixtures.id })
      .from(schema.fixtures)
      .where(eq(schema.fixtures.id, key.id))
      .limit(1);
    return row ? 'found' : 'missing';
  }

  if (ref.kind === 'team') {
    const where = key.by === 'id' ? eq(schema.teams.id, key.id) : eq(schema.teams.slug, ref.slug);
    const [row] = await db.select({ id: schema.teams.id }).from(schema.teams).where(where).limit(1);
    return row ? 'found' : 'missing';
  }

  const where = key.by === 'id' ? eq(schema.players.id, key.id) : eq(schema.players.slug, ref.slug);
  const [row] = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(where)
    .limit(1);
  return row ? 'found' : 'missing';
}
