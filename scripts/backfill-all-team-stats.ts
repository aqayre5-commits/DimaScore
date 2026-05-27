/**
 * Bulk backfill team season statistics for ALL teams across all verified competitions.
 *
 * Run:
 *   pnpm tsx scripts/backfill-all-team-stats.ts                          # dry-run
 *   pnpm tsx scripts/backfill-all-team-stats.ts --apply                  # apply all
 *   pnpm tsx scripts/backfill-all-team-stats.ts --apply --resume-from 50 # resume from team ID 50
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, sql, asc } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { apiGet } from '@/lib/data/adapters/api-football/client';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');
const resumeArg = process.argv.find((_, i, a) => a[i - 1] === '--resume-from');
const resumeFromTeamId = resumeArg ? Number(resumeArg) : 0;

const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(msg: string) {
  console.log(`[backfill-all-team-stats] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  log(`Resume from team ID: ${resumeFromTeamId || 'start'}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set');
    process.exit(1);
  }

  // Get all unique team IDs from standings + fixtures (union covers teams without standings)
  const standingsTeams = await db
    .selectDistinct({ teamId: schema.standings.teamId })
    .from(schema.standings)
    .where(
      sql`${schema.standings.teamId} IS NOT NULL AND ${schema.standings.teamId} >= ${resumeFromTeamId}`,
    );

  const fixtureTeams = await db.execute(
    sql`SELECT DISTINCT team_id FROM (
      SELECT home_team_id AS team_id FROM fixtures WHERE home_team_id IS NOT NULL AND home_team_id >= ${resumeFromTeamId}
      UNION
      SELECT away_team_id AS team_id FROM fixtures WHERE away_team_id IS NOT NULL AND away_team_id >= ${resumeFromTeamId}
    ) t`,
  );

  const teamIdSet = new Set<number>();
  for (const r of standingsTeams) if (r.teamId != null) teamIdSet.add(r.teamId);
  for (const r of fixtureTeams.rows as { team_id: string | number }[])
    teamIdSet.add(Number(r.team_id));
  const teamIds = [...teamIdSet].sort((a, b) => a - b);
  log(`Found ${teamIds.length} teams (standings + fixtures) to process`);

  // For each team, find which competitions they participate in
  let totalUpserted = 0;
  let totalSkipped = 0;
  let totalApiCalls = 0;
  let totalErrors = 0;
  const t0 = Date.now();

  for (let ti = 0; ti < teamIds.length; ti++) {
    const teamId = teamIds[ti];

    // Find competitions this team appears in (from standings + fixtures)
    const standingsComps = await db
      .selectDistinct({ competitionId: schema.standings.competitionId })
      .from(schema.standings)
      .where(eq(schema.standings.teamId, teamId));

    const fixtureComps = await db
      .selectDistinct({ competitionId: schema.fixtures.competitionId })
      .from(schema.fixtures)
      .where(
        sql`(${schema.fixtures.homeTeamId} = ${teamId} OR ${schema.fixtures.awayTeamId} = ${teamId})`,
      );

    const compIdSet = new Set<number>();
    for (const r of standingsComps) if (r.competitionId != null) compIdSet.add(r.competitionId);
    for (const r of fixtureComps) if (r.competitionId != null) compIdSet.add(r.competitionId);
    const compIds = [...compIdSet].sort((a, b) => a - b);

    log(`Team ${teamId} (${ti + 1}/${teamIds.length}): ${compIds.length} competitions`);

    for (const compId of compIds) {
      for (const season of SEASONS) {
        try {
          const res = await apiGet<Record<string, unknown>>('/teams/statistics', {
            team: teamId,
            season,
            league: compId,
          });
          totalApiCalls++;

          const data = res.response;
          if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            totalSkipped++;
            await sleep(120);
            continue;
          }

          const fx = (data as Record<string, unknown>).fixtures as
            | Record<string, Record<string, number>>
            | undefined;
          if (!fx || !fx.played || fx.played.total === 0) {
            totalSkipped++;
            await sleep(120);
            continue;
          }

          if (!dryRun) {
            await db
              .delete(schema.teamSeasonStats)
              .where(
                and(
                  eq(schema.teamSeasonStats.teamId, teamId),
                  eq(schema.teamSeasonStats.competitionId, compId),
                  eq(schema.teamSeasonStats.seasonYear, season),
                ),
              );
            await db.insert(schema.teamSeasonStats).values({
              teamId,
              competitionId: compId,
              seasonYear: season,
              stats: data as Record<string, unknown>,
            });
          }
          totalUpserted++;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes('429') && !msg.includes('rate')) {
            console.error(`  [ERROR] team=${teamId} comp=${compId} season=${season}: ${msg}`);
          }
          totalErrors++;
        }
        await sleep(120);
      }
    }

    if ((ti + 1) % 10 === 0 || ti === teamIds.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      log(
        `Progress: ${ti + 1}/${teamIds.length} teams, ${totalUpserted} upserted, ${totalSkipped} skipped, ${totalApiCalls} calls, ${totalErrors} errors (${elapsed}s)`,
      );
    }
  }

  log('=== COMPLETE ===');
  log(`Upserted: ${totalUpserted}`);
  log(`Skipped: ${totalSkipped}`);
  log(`API calls: ${totalApiCalls}`);
  log(`Errors: ${totalErrors}`);
  log(`Duration: ${((Date.now() - t0) / 1000 / 60).toFixed(1)} minutes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
