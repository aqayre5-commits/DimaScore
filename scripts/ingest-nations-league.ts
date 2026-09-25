/**
 * One-off ingestion for UEFA Nations League (competition id 5), so its hub page has data
 * immediately instead of waiting for the scheduled crons.
 *
 * Order mirrors the crons: reference-data (competition + seasons + coverage, flags the current
 * season and sets display_priority from VERIFIED_COMPETITIONS) → teams → fixtures → standings.
 *
 * Run:
 *   pnpm tsx --env-file=.env.local scripts/ingest-nations-league.ts           # dry-run
 *   pnpm tsx --env-file=.env.local scripts/ingest-nations-league.ts --apply    # fetch + write
 *
 * Requires: .env.local with DATABASE_URL + API-Football credentials. ~4 API-Football calls.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { syncTeams } from '@/lib/ingestion/teams';
import { syncStandings } from '@/lib/ingestion/standings';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';

const COMP_ID = 5;
const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const apply = process.argv.includes('--apply');

async function main() {
  const meta = VERIFIED_COMPETITIONS.find((c) => c.id === COMP_ID);
  if (!meta) throw new Error(`Competition ${COMP_ID} not found in VERIFIED_COMPETITIONS`);
  const provider = getDataProvider();

  if (!apply) {
    console.log(`DRY-RUN: would ingest competition ${COMP_ID} (${meta.slug}).`);
    console.log(
      'Steps: reference-data (seasons + coverage + display_priority) → teams → fixtures → standings.',
    );
    console.log('Re-run with --apply to write.');
    return;
  }

  console.log('1/4 reference-data (competition + seasons + coverage)…');
  console.log('   ', JSON.stringify(await syncCompetitionsWithSeasons(provider, db, [meta])));

  const rows = await db
    .select({ year: schema.seasons.year })
    .from(schema.seasons)
    .where(and(eq(schema.seasons.competitionId, COMP_ID), eq(schema.seasons.isCurrent, true)));
  const season = rows[0]?.year;
  if (season == null) throw new Error('No current season flagged for competition 5 after sync');
  console.log(`   current season = ${season}`);

  console.log('2/4 teams…');
  console.log(
    '   ',
    JSON.stringify(await syncTeams(provider, db, { leagueId: COMP_ID, season, isWomen: false })),
  );
  console.log('3/4 fixtures…');
  console.log(
    '   ',
    JSON.stringify(await syncFixtures(provider, db, { leagueId: COMP_ID, season, isWomen: false })),
  );
  console.log('4/4 standings…');
  console.log(
    '   ',
    JSON.stringify(await syncStandings(provider, db, { leagueId: COMP_ID, season })),
  );
  console.log('Done.');
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
