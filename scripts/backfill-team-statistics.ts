/**
 * Backfill team season statistics from API-Football /teams/statistics endpoint.
 *
 * Run:
 *   pnpm tsx scripts/backfill-team-statistics.ts --team 40          # dry-run for Liverpool
 *   pnpm tsx scripts/backfill-team-statistics.ts --team 40 --apply  # apply changes
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { apiGet } from '@/lib/data/adapters/api-football/client';
import { buildCountryLookup, resolveCountryCode } from '@/lib/ingestion/country-lookup';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');
const teamIdArg = process.argv.find((_, i, a) => a[i - 1] === '--team');
const teamId = teamIdArg ? Number(teamIdArg) : null;

if (!teamId || isNaN(teamId)) {
  console.error('Usage: pnpm tsx scripts/backfill-team-statistics.ts --team <teamId> [--apply]');
  process.exit(1);
}

const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025];

// Well-known competition IDs to always try (covers major European/English cups)
const WELL_KNOWN_COMPS = [
  2, // UEFA Champions League
  3, // UEFA Europa League
  39, // Premier League
  45, // FA Cup
  48, // League Cup (Carabao)
  528, // Community Shield
  531, // UEFA Super Cup
  15, // FIFA Club World Cup
  848, // UEFA Conference League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  200, // Botola Pro
  233, // Coupe du Trône
  6, // Africa Cup of Nations
  29, // FIFA World Cup
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(name: string, id: number): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + `-${id}`
  );
}

async function main() {
  console.log(`[backfill-team-stats] Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`[backfill-team-stats] Team ID: ${teamId}`);
  console.log(`[backfill-team-stats] Seasons: ${SEASONS.join(', ')}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('[backfill-team-stats] API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // Find competitions from DB
  const standingsRows = await db
    .selectDistinct({ competitionId: schema.standings.competitionId })
    .from(schema.standings)
    .where(eq(schema.standings.teamId, teamId!));

  const fixtureRows = await db
    .selectDistinct({ competitionId: schema.fixtures.competitionId })
    .from(schema.fixtures)
    .where(eq(schema.fixtures.homeTeamId, teamId!));

  const fixtureRowsAway = await db
    .selectDistinct({ competitionId: schema.fixtures.competitionId })
    .from(schema.fixtures)
    .where(eq(schema.fixtures.awayTeamId, teamId!));

  // Merge DB competitions + well-known list
  const compIds = [
    ...new Set([
      ...standingsRows.map((r) => r.competitionId).filter((id): id is number => id != null),
      ...fixtureRows.map((r) => r.competitionId).filter((id): id is number => id != null),
      ...fixtureRowsAway.map((r) => r.competitionId).filter((id): id is number => id != null),
      ...WELL_KNOWN_COMPS,
    ]),
  ];

  console.log(`[backfill-team-stats] Trying ${compIds.length} competitions`);

  // Get known competition IDs for auto-registration
  const allCompRows = await db.select({ id: schema.competitions.id }).from(schema.competitions);
  const knownCompIds = new Set(allCompRows.map((r) => r.id));
  const countryLookup = await buildCountryLookup(db);

  let upserted = 0;
  let apiCalls = 0;
  let skipped = 0;
  let compsRegistered = 0;
  let errors = 0;

  for (const compId of compIds) {
    for (const season of SEASONS) {
      try {
        const res = await apiGet<Record<string, unknown>>('/teams/statistics', {
          team: teamId!,
          season,
          league: compId,
        });
        apiCalls++;

        const data = res.response;
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          skipped++;
          await sleep(120);
          continue;
        }

        // Check if fixtures.played.total > 0
        const fx = (data as unknown as Record<string, unknown>).fixtures as
          | Record<string, Record<string, number>>
          | undefined;
        if (!fx || !fx.played || fx.played.total === 0) {
          skipped++;
          await sleep(120);
          continue;
        }

        // Auto-register competition if needed
        if (!knownCompIds.has(compId)) {
          const league = (data as unknown as Record<string, unknown>).league as
            | {
                id: number;
                name: string;
                country: string;
                logo: string;
              }
            | undefined;
          if (league) {
            const countryCode = resolveCountryCode(countryLookup, league.country);
            console.log(
              `  [AUTO-REGISTER] Competition ${compId}: ${league.name} (${league.country})`,
            );
            if (!dryRun) {
              await db
                .insert(schema.competitions)
                .values({
                  id: compId,
                  slug: slugify(league.name, compId),
                  name: { en: league.name },
                  countryCode,
                  type: 'Cup',
                  logoUrl: league.logo ?? null,
                })
                .onConflictDoNothing();
            }
            knownCompIds.add(compId);
            compsRegistered++;
          }
        }

        console.log(
          `  [${dryRun ? 'DRY' : 'UPSERT'}] comp=${compId} season=${season} (${fx.played.total} matches)`,
        );

        if (!dryRun) {
          await db
            .delete(schema.teamSeasonStats)
            .where(
              and(
                eq(schema.teamSeasonStats.teamId, teamId!),
                eq(schema.teamSeasonStats.competitionId, compId),
                eq(schema.teamSeasonStats.seasonYear, season),
              ),
            );
          await db.insert(schema.teamSeasonStats).values({
            teamId: teamId!,
            competitionId: compId,
            seasonYear: season,
            stats: data as unknown as Record<string, unknown>,
          });
        }
        upserted++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] comp=${compId} season=${season}: ${msg}`);
        errors++;
      }

      await sleep(120);
    }
  }

  console.log(`\n[backfill-team-stats] Done.`);
  console.log(`  Upserted: ${upserted}`);
  console.log(`  Skipped (no data): ${skipped}`);
  console.log(`  Competitions registered: ${compsRegistered}`);
  console.log(`  API calls: ${apiCalls}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
