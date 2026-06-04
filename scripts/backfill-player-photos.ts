/**
 * Backfill player photo_url from the API-Football media CDN.
 *
 * Photo URLs are deterministic: media.api-sports.io/football/players/{id}.png.
 * ~26% of players have a null photo_url even though the CDN has the image (the
 * ingestion just never set it). This HEAD-checks each missing-photo player's
 * CDN URL — FREE, the media CDN is not the rate-limited API-Football quota —
 * and sets photo_url only when the image actually exists (200), so we never
 * introduce a broken image (the lineup pitch has no error fallback).
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-player-photos.ts [--dry-run]
 */
import { eq, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const DRY = process.argv.includes('--dry-run');
const CONCURRENCY = 16;
const cdnUrl = (id: number) => `https://media.api-sports.io/football/players/${id}.png`;

async function photoExists(id: number): Promise<boolean> {
  try {
    const res = await fetch(cdnUrl(id), { method: 'HEAD' });
    return res.ok && (res.headers.get('content-type') ?? '').startsWith('image');
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const rows = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(isNull(schema.players.photoUrl));
  const ids = rows.map((r) => r.id);
  console.log(`[photos] ${ids.length} players missing photo_url${DRY ? ' (dry run)' : ''}`);

  let set = 0;
  let none = 0;
  let done = 0;

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (id) => ({ id, ok: await photoExists(id) })));
    for (const { id, ok } of results) {
      if (ok) {
        if (!DRY) {
          await db
            .update(schema.players)
            .set({ photoUrl: cdnUrl(id) })
            .where(eq(schema.players.id, id));
        }
        set++;
      } else {
        none++;
      }
    }
    done += batch.length;
    if (done % 500 < CONCURRENCY || done === ids.length) {
      console.log(`[photos] ${done}/${ids.length} checked — set=${set} no_cdn_photo=${none}`);
    }
  }

  console.log(`[photos] done — set=${set}, no_cdn_photo=${none}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[photos] fatal:', err);
  process.exit(1);
});
