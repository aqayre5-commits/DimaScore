/**
 * Backfill full squads for every team so players referenced by fixtures/events (scorers, assisters,
 * lineups) that were never ingested get real records — fixing the "—" placeholders on match recaps,
 * events and scorer lists. One API-Football `/players/squads` call per team (not per player), then
 * syncSquad upserts the roster (id, name, slug, photo, currentTeam).
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/backfill-squads.ts            # dry-run (previews ~10 teams, no writes)
 *   pnpm tsx --env-file=.env.local scripts/backfill-squads.ts --apply     # process all teams + write
 * Throttled via BACKFILL_DELAY_MS (default 300).
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { asc } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncSquad } from '@/lib/ingestion/squads';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');
const DELAY = Number(process.env.BACKFILL_DELAY_MS ?? '300');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const provider = getDataProvider();
  const teams = await db
    .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
    .from(schema.teams)
    .orderBy(asc(schema.teams.id));

  const work = apply ? teams : teams.slice(0, 10);
  console.log(
    `teams: ${teams.length}${apply ? '' : `  (dry-run — previewing ${work.length}, NO writes)`}`,
  );

  let processed = 0,
    playersSeen = 0,
    errors = 0;

  for (const t of work) {
    try {
      if (apply) {
        const stats = await syncSquad(provider, db, { teamId: Number(t.id), isWomen: t.isWomen });
        playersSeen += stats.updated ?? 0;
      } else {
        const squad = await provider.getPlayerSquads({ team: Number(t.id) });
        playersSeen += squad.length;
        if (processed < 10) console.log(`  team ${t.id}: ${squad.length} squad players`);
      }
      processed++;
      if (apply && processed % 100 === 0)
        console.log(`  ...${processed}/${work.length} teams, ~${playersSeen} players upserted`);
    } catch {
      errors++;
    }
    await sleep(DELAY);
  }

  console.log(
    `\nprocessed=${processed} players≈${playersSeen} errors=${errors}${apply ? '' : '  (dry-run — re-run with --apply)'}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
