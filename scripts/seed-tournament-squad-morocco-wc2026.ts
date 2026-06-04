/**
 * Seed Morocco's official FIFA World Cup 2026 squad into tournament_squads.
 *
 * The Squad tab on the team page shows this curated 26-man roster instead of the
 * full national pool when rows exist for the team. Player IDs were resolved by
 * matching the official 26-man list against our players table (22 from the
 * national pool; Tagnaouti/Bouaddi/Amaimouni found under their clubs; El Kajoui
 * = id 2702, "M. Mohamedi").
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-tournament-squad-morocco-wc2026.ts [--dry-run]
 */
import { inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';

const DRY = process.argv.includes('--dry-run');

const COMPETITION_ID = 1; // World Cup
const SEASON_YEAR = 2026;
const TEAM_ID = 31; // Morocco

// Official 26-man squad → resolved player IDs.
const PLAYER_IDS = [
  2701, 2702, 2703, 9, 545, 21694, 283252, 18814, 278898, 146772, 326183, 162451, 74, 438688,
  336659, 129678, 161897, 415431, 369544, 340573, 277003, 36579, 744, 181421, 2722, 535046,
];

async function main(): Promise<void> {
  // Validate every ID exists in players before writing.
  const existing = await db
    .select({ id: schema.players.id })
    .from(schema.players)
    .where(inArray(schema.players.id, PLAYER_IDS));
  const found = new Set(existing.map((r) => r.id));
  const missing = PLAYER_IDS.filter((id) => !found.has(id));
  if (missing.length > 0) {
    console.error(
      `[wc26-squad] ABORT — ${missing.length} player IDs not in DB: ${missing.join(', ')}`,
    );
    process.exit(1);
  }
  console.log(`[wc26-squad] ${PLAYER_IDS.length} players validated${DRY ? ' (dry run)' : ''}`);

  if (DRY) {
    console.log('[wc26-squad] dry run — no rows written');
    process.exit(0);
  }

  let inserted = 0;
  for (const playerId of PLAYER_IDS) {
    const res = await db
      .insert(schema.tournamentSquads)
      .values({ competitionId: COMPETITION_ID, seasonYear: SEASON_YEAR, teamId: TEAM_ID, playerId })
      .onConflictDoNothing();
    inserted += (res as unknown as { rowCount: number }).rowCount ?? 0;
  }

  console.log(`[wc26-squad] done — ${inserted} rows inserted (of ${PLAYER_IDS.length})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[wc26-squad] fatal:', err);
  process.exit(1);
});
