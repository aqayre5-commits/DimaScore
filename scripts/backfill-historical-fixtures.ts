/**
 * Backfill fixtures for historical (non-current) seasons of a competition.
 *
 * Uses the existing syncFixtures ingestion pipeline, so venues, teams, scores
 * are all upserted properly.
 *
 * Run:
 *   pnpm tsx scripts/backfill-historical-fixtures.ts --comp 36                    # all seasons for AFCON Qualifiers
 *   pnpm tsx scripts/backfill-historical-fixtures.ts --comp 36 --seasons 2021,2023,2025  # specific seasons
 *   pnpm tsx scripts/backfill-historical-fixtures.ts --all-comps                  # all competitions, history-rule seasons
 *   pnpm tsx scripts/backfill-historical-fixtures.ts --all-comps --all-seasons    # override: every historical season
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getDataProvider } from '@/lib/data';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { allowedSeasons } from '@/lib/competitions/allowed-seasons';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const provider = getDataProvider();

function log(msg: string) {
  console.log(`[backfill-hist-fixtures] ${new Date().toISOString()} ${msg}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface SeasonEntry {
  competitionId: number;
  year: number;
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }

  const compArg = process.argv.find((_, i, a) => a[i - 1] === '--comp');
  const seasonsArg = process.argv.find((_, i, a) => a[i - 1] === '--seasons');
  const allComps = process.argv.includes('--all-comps');
  const allSeasons = process.argv.includes('--all-seasons');

  let entries: SeasonEntry[] = [];

  if (allComps) {
    // All competitions, all non-current seasons
    const rows = await db
      .select({ competitionId: schema.seasons.competitionId, year: schema.seasons.year })
      .from(schema.seasons)
      .where(eq(schema.seasons.isCurrent, false));
    entries = rows;
    log(`All competitions: found ${entries.length} historical seasons`);
  } else if (compArg) {
    const compId = Number(compArg);
    if (seasonsArg) {
      // Specific seasons
      const years = seasonsArg.split(',').map(Number);
      entries = years.map((year) => ({ competitionId: compId, year }));
    } else {
      // All seasons for this competition
      const rows = await db
        .select({ competitionId: schema.seasons.competitionId, year: schema.seasons.year })
        .from(schema.seasons)
        .where(eq(schema.seasons.competitionId, compId));
      entries = rows;
    }
    log(`Competition ${compId}: ${entries.length} seasons to sync`);
  } else {
    console.error('Usage: --comp <id> [--seasons 2021,2023] [--all-seasons] or --all-comps');
    process.exit(1);
  }

  if (!seasonsArg && !allSeasons && entries.length > 0) {
    const seasonRows = await db
      .select({
        competitionId: schema.seasons.competitionId,
        year: schema.seasons.year,
        isCurrent: schema.seasons.isCurrent,
        startDate: schema.seasons.startDate,
        endDate: schema.seasons.endDate,
      })
      .from(schema.seasons);
    const byComp = new Map<number, typeof seasonRows>();
    for (const row of seasonRows) {
      const list = byComp.get(row.competitionId) ?? [];
      list.push(row);
      byComp.set(row.competitionId, list);
    }
    const before = entries.length;
    entries = entries.filter((e) => {
      const windows = byComp.get(e.competitionId) ?? [];
      const allowed = new Set(allowedSeasons(e.competitionId, windows));
      return allowed.has(e.year);
    });
    log(
      `History rule: kept ${entries.length}/${before} seasons (current+previous, or latest edition only). Pass --all-seasons or --seasons to override. No data is deleted.`,
    );
  }

  let totalFixtures = 0;
  let totalErrors = 0;
  const t0 = Date.now();

  for (let i = 0; i < entries.length; i++) {
    const { competitionId, year } = entries[i];
    try {
      const stats = await syncFixtures(provider, db, {
        leagueId: competitionId,
        season: year,
      });
      totalFixtures += stats.updated;
      log(
        `  [${i + 1}/${entries.length}] comp=${competitionId} season=${year}: ${stats.updated} fixtures`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] comp=${competitionId} season=${year}: ${msg}`);
      totalErrors++;
    }
    await sleep(300);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  log('=== COMPLETE ===');
  log(`Fixtures upserted: ${totalFixtures}`);
  log(`Errors: ${totalErrors}`);
  log(`Duration: ${elapsed}s`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
