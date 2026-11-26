/**
 * Re-fetch events for fixtures whose stored events have a null player id, so
 * the player_name / assist_name columns added in 0011 can keep a name the
 * provider sent without an id.
 *
 * Lineups do not need this. Their names are already in fixture_lineups JSON;
 * the pitch reads them with a stable key. This script only rewrites events.
 *
 * Each fixture costs 4 API-Football calls (events, lineups, statistics, players)
 * via syncFixtureDetails. Default is a dry run. --apply is capped at 25 fixtures
 * unless --ids is an explicit list (still capped at 25).
 *
 * Apply migration 0011 first. Requires DATABASE_URL and, for --apply, API_FOOTBALL_KEY.
 *
 *   pnpm tsx --env-file=.env.local scripts/resync-null-player-fixtures.ts
 *   pnpm tsx --env-file=.env.local scripts/resync-null-player-fixtures.ts --apply --limit 10
 *   pnpm tsx --env-file=.env.local scripts/resync-null-player-fixtures.ts --apply --ids 1546186
 *
 * Selection (null id and no stored name yet, so a finished pass drops out when
 * the provider sent a name). Fixtures the provider also leaves unnamed stay in
 * the set — do not loop --apply unattended.
 *
 *   SELECT e.fixture_id
 *   FROM fixture_events e
 *   JOIN fixtures f ON f.id = e.fixture_id
 *   WHERE e.type IN ('Goal', 'subst', 'Card')
 *     AND (
 *       (e.player_id IS NULL AND e.player_name IS NULL)
 *       OR (e.type = 'subst' AND e.assist_player_id IS NULL AND e.assist_name IS NULL)
 *     )
 *   GROUP BY e.fixture_id
 *   ORDER BY MAX(f.kickoff_at) DESC NULLS LAST
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncFixtureDetails } from '@/lib/ingestion/fixture-details';

const CAP = 25;

const apply = process.argv.includes('--apply');
const limitArg = process.argv.find((_, i, a) => a[i - 1] === '--limit');
const idsArg = process.argv.find((_, i, a) => a[i - 1] === '--ids');
const limit = Math.min(CAP, limitArg ? Number(limitArg) : 10);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function affectedIds(db: NeonHttpDatabase<typeof schema>): Promise<number[]> {
  const rows = await db.execute(sql`
    SELECT e.fixture_id AS id
    FROM fixture_events e
    JOIN fixtures f ON f.id = e.fixture_id
    WHERE e.type IN ('Goal', 'subst', 'Card')
      AND (
        (e.player_id IS NULL AND e.player_name IS NULL)
        OR (e.type = 'subst' AND e.assist_player_id IS NULL AND e.assist_name IS NULL)
      )
    GROUP BY e.fixture_id
    ORDER BY MAX(f.kickoff_at) DESC NULLS LAST
  `);
  return (rows.rows as Array<{ id: number | string }>).map((r) => Number(r.id));
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }
  const db = drizzle(neon(process.env.DATABASE_URL), { schema });
  const explicit = idsArg
    ? idsArg
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    : null;
  const all = explicit ?? (await affectedIds(db));
  const batch = all.slice(0, limit);

  console.log(
    `[resync-null-player-fixtures] ${all.length} fixture(s) selected, showing ${batch.length} (cap ${CAP}).`,
  );
  console.log(batch.join(','));
  if (!apply) {
    console.log('Dry run. Pass --apply to call API-Football. Each fixture is 4 requests.');
    return;
  }
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }
  const provider = getDataProvider();
  for (const id of batch) {
    try {
      const result = await syncFixtureDetails(provider, db, id);
      console.log(
        `  ${id}: events=${result.events} lineups=${result.lineups} players=${result.playerStats}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] fixture ${id}: ${msg}`);
    }
    await sleep(250);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
