/**
 * Backfill country codes (flags) for friendly nations.
 *
 * Friendlies (comp 10) brought in teams from ~19 nations missing from the `countries`
 * table, so their country_code resolved to null → no flag. This re-seeds /countries
 * (filling the standard-name nations), then re-runs the friendlies team sync so country_code
 * re-resolves via the now-complete lookup + the aliases added in country-lookup.ts. syncTeams'
 * upsert sets country_code, so existing teams are corrected in place — no full re-pull.
 *
 * Idempotent. Prints any names still unresolved (e.g. overseas territories that have no ISO
 * code in /countries — those stay flag-less by design).
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-friendly-countries.ts
 */
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { syncCountries } from '@/lib/ingestion/reference-data';
import { syncTeams } from '@/lib/ingestion/teams';

const FRIENDLIES_ID = 10;
const SEASON = 2026;

async function main(): Promise<void> {
  const provider = getDataProvider();

  // 1. Re-seed /countries — fills the standard-name nations that were missing.
  console.log('[backfill-countries] re-seeding /countries…');
  const countryStats = await syncCountries(provider, db);
  console.log('[backfill-countries] countries:', countryStats);

  // 2. Re-sync friendly teams — re-resolves + updates country_code via the upsert.
  console.log('[backfill-countries] re-syncing friendly teams to re-resolve country_code…');
  const teamStats = await syncTeams(provider, db, {
    leagueId: FRIENDLIES_ID,
    season: SEASON,
    isWomen: false,
  });
  console.log('[backfill-countries] teams:', teamStats);

  console.log(
    '\n[backfill-countries] done — review the warnings above for any residual unresolved names.',
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[backfill-countries] fatal:', err);
  process.exit(1);
});
