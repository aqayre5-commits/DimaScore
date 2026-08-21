/**
 * Backfill standings + top scorers/assists for historical (non-current) seasons of a competition.
 * Companion to backfill-historical-fixtures.ts — run that first so fixtures exist.
 *
 * Run (requires .env.local with DATABASE_URL + API_FOOTBALL_KEY):
 *   pnpm tsx --env-file=.env.local scripts/backfill-hist-standings.ts --comp 201 --seasons 2023
 *   pnpm tsx --env-file=.env.local scripts/backfill-hist-standings.ts --comp 31 --seasons 2018
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncStandings } from '@/lib/ingestion/standings';
import { syncTopScorers, syncTopAssists } from '@/lib/ingestion/top-scorers';

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const provider = getDataProvider();

function arg(name: string): string | undefined {
  return process.argv.find((_, i, a) => a[i - 1] === name);
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }
  const comp = Number(arg('--comp'));
  const seasons = (arg('--seasons') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (!comp || seasons.length === 0) {
    console.error('Usage: --comp <competitionId> --seasons <year,year>');
    process.exit(1);
  }

  const tasks = [
    ['standings', syncStandings],
    ['scorers', syncTopScorers],
    ['assists', syncTopAssists],
  ] as const;

  for (const season of seasons) {
    for (const [label, fn] of tasks) {
      try {
        const stats = await fn(provider, db, { leagueId: comp, season });
        console.log(`comp=${comp} season=${season} ${label}: updated ${stats.updated}`);
      } catch (err) {
        console.log(
          `comp=${comp} season=${season} ${label}: ERROR ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
