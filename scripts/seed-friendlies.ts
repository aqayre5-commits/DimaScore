/**
 * Seed international friendlies (competition 10) into the live pipeline.
 *
 * Friendlies (10) was orphaned: not in VERIFIED_COMPETITIONS, no `seasons` row, and no
 * `league_coverage` — so the schedule cron never ingested upcoming friendlies and the
 * live-poller never tracked them. This:
 *   1. seeds the competition + its seasons + coverage straight from API-Football,
 *   2. resolves the current season (the API marks it), then
 *   3. ingests teams (FK target) and fixtures for that season.
 *
 * Idempotent — safe to re-run. The VERIFIED_COMPETITIONS entry (added in code) keeps the
 * competition current going forward and lets the live-poller track live friendly scores.
 * No standings (friendlies have no table).
 *
 * Run: pnpm tsx --env-file=.env.local scripts/seed-friendlies.ts
 */
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { syncTeams } from '@/lib/ingestion/teams';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import type { CompetitionMeta } from '@/lib/ingestion/types';

const FRIENDLIES: CompetitionMeta = {
  id: 10,
  slug: 'friendlies',
  tier: 6,
  isWomen: false,
  isFeatured: false,
  isMoroccoFocus: false,
  displayPriority: 66,
};

async function main(): Promise<void> {
  const provider = getDataProvider();

  // 1. Competition + seasons + coverage from API-Football (sets is_current per the API).
  console.log('[friendlies] seeding competition + seasons + coverage…');
  const ref = await syncCompetitionsWithSeasons(provider, db, [FRIENDLIES]);
  console.log('[friendlies] reference-data:', ref);

  // 2. Resolve the season to ingest — the current one, else the latest.
  const rows = await db
    .select({ year: schema.seasons.year, isCurrent: schema.seasons.isCurrent })
    .from(schema.seasons)
    .where(eq(schema.seasons.competitionId, FRIENDLIES.id))
    .orderBy(desc(schema.seasons.year));

  // Season to ingest: an explicit CLI arg, else the API's current, else latest, else this year.
  const argSeason = process.argv[2] ? Number(process.argv[2]) : undefined;
  const season =
    argSeason ??
    rows.find((r) => r.isCurrent)?.year ??
    rows[0]?.year ??
    new Date().getUTCFullYear();
  console.log(`[friendlies] ingesting season ${season}…`);

  // 3. Teams first (fixtures reference team ids — FK), then fixtures.
  const teamStats = await syncTeams(provider, db, { leagueId: FRIENDLIES.id, season });
  console.log('[friendlies] teams:', teamStats);

  const fixtureStats = await syncFixtures(provider, db, { leagueId: FRIENDLIES.id, season });
  console.log('[friendlies] fixtures:', fixtureStats);

  console.log('\n[friendlies] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[friendlies] fatal:', err);
  process.exit(1);
});
