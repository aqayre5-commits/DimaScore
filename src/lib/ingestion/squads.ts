import { eq, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedSquadPlayer } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import type { SyncStats } from './types';
import { slugify } from './slug';
import { classifyPhotoUrl, type ClassifyCache } from '@/lib/logos/classify';

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
  const photoCache: ClassifyCache = new Map();

  for (const p of players) {
    const row = mapSquadPlayerToInsert(p, params.teamId, params.isWomen);
    const photo = await classifyPhotoUrl(row.photoUrl, { cache: photoCache });
    const values = { ...row, photoStatus: photo.status };
    await db
      .insert(schema.players)
      .values(values)
      .onConflictDoUpdate({
        target: schema.players.id,
        set: {
          slug: values.slug,
          // Merge so a seeded name.ar/fr survives the feed's en-only rows.
          name: sql`${schema.players.name} || excluded.name`,
          photoUrl: values.photoUrl,
          photoStatus: values.photoStatus,
          currentTeamId: values.currentTeamId,
          position: values.position,
          shirtNumber: values.shirtNumber,
          isWomen: values.isWomen,
        },
      });
    updated++;
  }

  // Populate squad_members junction table (delete + re-insert for this team)
  await db.delete(schema.squadMembers).where(eq(schema.squadMembers.teamId, params.teamId));
  if (players.length > 0) {
    await db
      .insert(schema.squadMembers)
      .values(players.map((p) => ({ teamId: params.teamId, playerId: p.id })));
  }

  return { inserted, updated };
}
