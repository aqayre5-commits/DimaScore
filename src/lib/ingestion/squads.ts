import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedSquadPlayer } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import type { SyncStats } from './types';
import { slugify } from './slug';

// ─── Mapper (exported for testing) ───

export function mapSquadPlayerToInsert(p: NormalizedSquadPlayer, teamId: number, isWomen: boolean) {
  if (p.name === null) {
    console.warn(`[squad] player id=${p.id} has null name, inserted as stub`);
  }
  const safeName = p.name ?? 'Unknown';
  return {
    id: p.id,
    slug: `${slugify(safeName)}-${p.id}`,
    name: { en: safeName } as Record<string, string>,
    photoUrl: p.photo,
    currentTeamId: teamId,
    position: p.position,
    shirtNumber: p.number,
    isWomen,
  };
}

// ─── Sync ───

export async function syncSquad(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { teamId: number; isWomen: boolean },
): Promise<SyncStats> {
  const players = await provider.getPlayerSquads({ team: params.teamId });
  const inserted = 0;
  let updated = 0;

  await db.transaction(async (tx) => {
    for (const p of players) {
      const row = mapSquadPlayerToInsert(p, params.teamId, params.isWomen);
      await tx
        .insert(schema.players)
        .values(row)
        .onConflictDoUpdate({
          target: schema.players.id,
          set: {
            slug: row.slug,
            name: row.name,
            photoUrl: row.photoUrl,
            currentTeamId: row.currentTeamId,
            position: row.position,
            shirtNumber: row.shirtNumber,
            isWomen: row.isWomen,
          },
        });
      updated++;
    }
  });

  return { inserted, updated };
}
