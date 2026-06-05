/**
 * Insert WC2026 squad players that aren't in our DB (fresh call-ups, or players
 * we never synced). Minimal rows — id, name, photo, position — which is all the
 * Squad tab needs; mirrors mapSquadPlayerToInsert (slug, isWomen). Idempotent.
 *
 * After running, pin each via data/wc2026-overrides.ts, then re-run the seed.
 * Grow PLAYERS as later groups surface more missing players.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/ingest-wc2026-players.ts [--dry-run]
 */
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { slugify } from '@/lib/ingestion/slug';

const DRY = process.argv.includes('--dry-run');

interface IngestPlayer {
  id: number;
  name: string;
  position: string; // Goalkeeper | Defender | Midfielder | Attacker
  photoUrl: string;
}

const PLAYERS: IngestPlayer[] = [
  // Group A
  {
    id: 2869,
    name: 'E. Álvarez',
    position: 'Defender',
    photoUrl: 'https://media.api-sports.io/football/players/2869.png',
  }, // Edson Álvarez (Mexico) — distinct from #51068 Efraín
  {
    id: 66214,
    name: 'D. Douděra',
    position: 'Defender',
    photoUrl: 'https://media.api-sports.io/football/players/66214.png',
  }, // David Doudera (Czech Republic)
];

async function main(): Promise<void> {
  let n = 0;
  for (const p of PLAYERS) {
    console.log(`[ingest] #${p.id} ${p.name} (${p.position})${DRY ? ' (dry run)' : ''}`);
    if (DRY) continue;
    await db
      .insert(schema.players)
      .values({
        id: p.id,
        slug: `${slugify(p.name)}-${p.id}`,
        name: { en: p.name },
        photoUrl: p.photoUrl,
        position: p.position,
        isWomen: false,
      })
      .onConflictDoUpdate({
        target: schema.players.id,
        set: { name: { en: p.name }, photoUrl: p.photoUrl, position: p.position },
      });
    n++;
  }
  console.log(`[ingest] done${DRY ? ' (dry run)' : ''} — ${n} players upserted`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[ingest] fatal:', err);
  process.exit(1);
});
