/**
 * Seed tournament_squads for every nation in data/wc2026-squads.ts, writing ONLY
 * the high-confidence matches (pool + global). Ambiguous/missing players are
 * skipped — resolve them in the data layer (or ingest from API-Football), then
 * re-run; inserts are idempotent (onConflictDoNothing).
 *
 * Always run scripts/resolve-wc2026-squads.ts first to review the matches.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-wc2026-squads.ts [--dry-run]
 */
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { WC2026_SQUADS, WC2026_COMPETITION_ID, WC2026_SEASON } from './data/wc2026-squads';
import { resolveNation } from './lib-wc2026';

const DRY = process.argv.includes('--dry-run');

async function main(): Promise<void> {
  let inserted = 0;
  let seededTeams = 0;
  let skipped = 0;

  for (const nation of WC2026_SQUADS) {
    const r = await resolveNation(nation);
    if (r.teamId == null) {
      console.warn(`[seed] ${nation.fifaName}: team not found in DB, skipping`);
      continue;
    }
    const ids = r.results
      .filter((x) => x.status === 'matched' && x.playerId != null)
      .map((x) => x.playerId as number);
    const notMatched = r.results.length - ids.length;
    skipped += notMatched;
    console.log(
      `[seed] ${nation.fifaName} (team ${r.teamId}): ${ids.length}/${r.results.length} matched${notMatched ? `, ${notMatched} skipped` : ''}`,
    );
    if (DRY) continue;
    seededTeams++;
    for (const playerId of ids) {
      const res = await db
        .insert(schema.tournamentSquads)
        .values({
          competitionId: WC2026_COMPETITION_ID,
          seasonYear: WC2026_SEASON,
          teamId: r.teamId,
          playerId,
        })
        .onConflictDoNothing();
      inserted += (res as unknown as { rowCount: number }).rowCount ?? 0;
    }
  }

  console.log(
    `[seed] done${DRY ? ' (dry run)' : ''} — ${inserted} rows inserted across ${seededTeams} teams, ${skipped} players skipped (ambiguous/missing)`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] fatal:', err);
  process.exit(1);
});
