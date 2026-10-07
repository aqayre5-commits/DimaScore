/**
 * Bulk backfill team_season_stats from API-Football /teams/statistics — the complete source
 * (fixtures, goals, penalties, lineups, cards, clean sheets, form). Targets every
 * (team, competition, season >= 2020) whose current row is a basic fixtures-computed one
 * (no penalty / no lineups); rows already sourced from the API are left alone. Where the API
 * returns no data for a combo, the computed row stays as a fallback.
 *
 * Run:
 *   pnpm tsx scripts/backfill-team-statistics-bulk.ts          # dry-run (counts combos, no API calls)
 *   pnpm tsx scripts/backfill-team-statistics-bulk.ts --apply   # fetch + upsert
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq, sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { apiGet } from '@/lib/data/adapters/api-football/client';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });
const apply = process.argv.includes('--apply');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function log(msg: string) {
  console.log(`[bulk-team-stats] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  if (!process.env.API_FOOTBALL_KEY) {
    console.error('[bulk-team-stats] API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // Combos currently on computed stats (no penalty + no lineups) → need the full API data.
  const res = await db.execute(sql`
    SELECT team_id, competition_id, season_year
    FROM team_season_stats
    WHERE season_year >= 2020
      AND stats->'penalty' IS NULL AND stats->'lineups' IS NULL
    ORDER BY team_id, competition_id, season_year`);

  const combos = (
    res.rows as { team_id: string; competition_id: string; season_year: string }[]
  ).map((r) => ({
    teamId: Number(r.team_id),
    competitionId: Number(r.competition_id),
    seasonYear: Number(r.season_year),
  }));

  log(
    `Mode: ${apply ? 'APPLY' : 'DRY-RUN'} — ${combos.length} computed combos to upgrade from the API`,
  );
  if (!apply) {
    log('(dry-run — re-run with --apply to fetch from API; ~1 call per combo)');
    return;
  }

  let upserted = 0;
  let noData = 0;
  let errors = 0;

  for (let i = 0; i < combos.length; i++) {
    const { teamId, competitionId, seasonYear } = combos[i];
    try {
      const r = await apiGet<Record<string, unknown>>('/teams/statistics', {
        team: teamId,
        league: competitionId,
        season: seasonYear,
      });
      const data = r.response as Record<string, unknown> | undefined;
      const fx = data?.fixtures as Record<string, Record<string, number>> | undefined;

      if (!data || !fx?.played || fx.played.total === 0) {
        noData++; // keep the computed fallback
      } else {
        await db
          .delete(schema.teamSeasonStats)
          .where(
            and(
              eq(schema.teamSeasonStats.teamId, teamId),
              eq(schema.teamSeasonStats.competitionId, competitionId),
              eq(schema.teamSeasonStats.seasonYear, seasonYear),
            ),
          );
        await db
          .insert(schema.teamSeasonStats)
          .values({ teamId, competitionId, seasonYear, stats: data });
        upserted++;
      }
    } catch (err) {
      errors++;
      if (errors <= 10)
        log(
          `ERROR team=${teamId} comp=${competitionId} season=${seasonYear}: ${err instanceof Error ? err.message : String(err)}`,
        );
    }
    if ((i + 1) % 100 === 0)
      log(
        `progress ${i + 1}/${combos.length} — upserted ${upserted}, noData ${noData}, errors ${errors}`,
      );
    await sleep(120);
  }

  log('=== COMPLETE ===');
  log(
    `upgraded to API data: ${upserted} | no API data (kept computed): ${noData} | errors: ${errors}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
