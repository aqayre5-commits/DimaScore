/**
 * Backfill head-to-head history for upcoming matches.
 *
 * The match page's H2H panel reads from the `fixtures` table (getHeadToHead),
 * but historical meetings between the two teams are mostly absent (~74% of
 * upcoming matches show "No previous meetings"). This script fetches each
 * upcoming matchup's H2H from API-Football (/fixtures/headtohead) and upserts
 * the returned past fixtures into `fixtures`, so the existing H2H panel fills.
 *
 * Scope: distinct team pairs from upcoming (NS) fixtures.
 * FK safety: skips meetings whose competition isn't already in the DB
 *   (competitions aren't upserted here), and upserts venues as a side-effect.
 *
 * Run:  pnpm tsx --env-file=.env.local scripts/backfill-h2h.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { mapFixtureToInsert } from '@/lib/ingestion/fixtures';

const H2H_LAST = 10; // meetings to request per pair
const DELAY_MS = 250; // gentle pause between API calls (rate-limit safety)

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
  const provider = getDataProvider();

  // Distinct upcoming team pairs (normalize order so A-B == B-A)
  const pairRows = await db.execute(
    sql`SELECT DISTINCT LEAST(home_team_id, away_team_id) AS a, GREATEST(home_team_id, away_team_id) AS b
        FROM fixtures
        WHERE status_code = 'NS' AND home_team_id IS NOT NULL AND away_team_id IS NOT NULL`,
  );
  const pairs = (pairRows.rows as { a: string; b: string }[]).map(
    (r) => [Number(r.a), Number(r.b)] as const,
  );

  // Existing competition ids (for FK skip)
  const compRows = await db.execute(sql`SELECT id FROM competitions`);
  const knownComps = new Set((compRows.rows as { id: string }[]).map((r) => Number(r.id)));

  console.log(`[h2h] ${pairs.length} distinct upcoming pairs to backfill`);

  let apiCalls = 0;
  let upserted = 0;
  let skippedComp = 0;
  let errors = 0;

  for (const [a, b] of pairs) {
    try {
      const meetings = await provider.getHeadToHead({ h2h: `${a}-${b}`, last: H2H_LAST });
      apiCalls++;

      for (const f of meetings) {
        if (!knownComps.has(f.league.id)) {
          skippedComp++;
          continue;
        }

        // Upsert venue side-effect (mirrors syncFixtures)
        if (f.venue.id) {
          await db
            .insert(schema.venues)
            .values({ id: f.venue.id, name: f.venue.name, city: f.venue.city })
            .onConflictDoUpdate({
              target: schema.venues.id,
              set: { name: f.venue.name, city: f.venue.city },
            });
        }

        const row = mapFixtureToInsert(f);
        await db
          .insert(schema.fixtures)
          .values(row)
          .onConflictDoUpdate({
            target: schema.fixtures.id,
            set: {
              competitionId: row.competitionId,
              seasonYear: row.seasonYear,
              round: row.round,
              roundNumber: row.roundNumber,
              kickoffAt: row.kickoffAt,
              statusCode: row.statusCode,
              minute: row.minute,
              homeTeamId: row.homeTeamId,
              awayTeamId: row.awayTeamId,
              homeScore: row.homeScore,
              awayScore: row.awayScore,
              homeScoreHt: row.homeScoreHt,
              awayScoreHt: row.awayScoreHt,
              homeScoreFt: row.homeScoreFt,
              awayScoreFt: row.awayScoreFt,
              homeScoreEt: row.homeScoreEt,
              awayScoreEt: row.awayScoreEt,
              homeScorePen: row.homeScorePen,
              awayScorePen: row.awayScorePen,
              venueId: row.venueId,
              referee: row.referee,
            },
          });
        upserted++;
      }
    } catch (err) {
      errors++;
      console.error(`[h2h] pair ${a}-${b} failed:`, err instanceof Error ? err.message : err);
    }
    await sleep(DELAY_MS);
  }

  console.log(
    `[h2h] done — api_calls=${apiCalls} fixtures_upserted=${upserted} skipped_unknown_comp=${skippedComp} errors=${errors}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('[h2h] fatal:', err);
  process.exit(1);
});
