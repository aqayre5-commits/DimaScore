/**
 * Backfill historical standings from API-Football for a given team's competitions.
 *
 * Run:
 *   pnpm tsx scripts/backfill-standings.ts --team 40          # dry-run
 *   pnpm tsx scripts/backfill-standings.ts --team 40 --apply  # apply
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

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');
const teamIdArg = process.argv.find((_, i, a) => a[i - 1] === '--team');
const teamId = teamIdArg ? Number(teamIdArg) : null;

if (!teamId || isNaN(teamId)) {
  console.error('Usage: pnpm tsx scripts/backfill-standings.ts --team <teamId> [--apply]');
  process.exit(1);
}

const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025];

// Competitions that have league-style standings
const LEAGUE_COMPS = [
  39, // Premier League
  2, // Champions League
  3, // Europa League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  200, // Botola Pro
  848, // Conference League
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

interface ApiStandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  description: string | null;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
}

interface ApiStandingsResponse {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: ApiStandingEntry[][];
  };
}

async function main() {
  console.log(`[backfill-standings] Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`[backfill-standings] Team ID: ${teamId}`);
  console.log(`[backfill-standings] Seasons: ${SEASONS.join(', ')}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('[backfill-standings] API_FOOTBALL_KEY not set');
    process.exit(1);
  }

  // Get known team IDs for FK validation
  const allTeamRows = await db.select({ id: schema.teams.id }).from(schema.teams);
  const knownTeamIds = new Set(allTeamRows.map((r) => r.id));

  // Find competitions this team plays in from team_season_stats
  const teamStatRows = await db
    .selectDistinct({ competitionId: schema.teamSeasonStats.competitionId })
    .from(schema.teamSeasonStats)
    .where(eq(schema.teamSeasonStats.teamId, teamId!));

  const compIdsFromStats = teamStatRows.map((r) => r.competitionId);

  // Merge with well-known league comps
  const compIds = [...new Set([...compIdsFromStats, ...LEAGUE_COMPS])];

  console.log(`[backfill-standings] Trying ${compIds.length} competitions`);

  let upserted = 0;
  let teamsRegistered = 0;
  let apiCalls = 0;
  let skipped = 0;
  let errors = 0;

  for (const compId of compIds) {
    for (const season of SEASONS) {
      try {
        const res = await apiGet<ApiStandingsResponse>('/standings', {
          league: compId,
          season,
        });
        apiCalls++;

        const data = res.response?.[0];
        if (!data || !data.league?.standings?.length) {
          skipped++;
          await sleep(120);
          continue;
        }

        // Check if this team is actually in these standings
        const allEntries = data.league.standings.flat();
        const teamInStandings = allEntries.some((e) => e.team.id === teamId);
        if (!teamInStandings) {
          skipped++;
          await sleep(120);
          continue;
        }

        console.log(
          `  [${dryRun ? 'DRY' : 'UPSERT'}] ${data.league.name} ${season} (${allEntries.length} teams)`,
        );

        if (!dryRun) {
          // Auto-register any unknown teams
          for (const entry of allEntries) {
            if (!knownTeamIds.has(entry.team.id)) {
              await db
                .insert(schema.teams)
                .values({
                  id: entry.team.id,
                  slug: slugify(entry.team.name, entry.team.id),
                  name: { en: entry.team.name },
                  shortName: { en: entry.team.name.substring(0, 20) },
                  logoUrl: entry.team.logo,
                })
                .onConflictDoNothing();
              knownTeamIds.add(entry.team.id);
              teamsRegistered++;
            }
          }

          // Upsert all standings rows for this competition/season
          for (const entry of allEntries) {
            const row = {
              competitionId: compId,
              seasonYear: season,
              groupLabel: entry.group.replace(/^Group\s+/i, ''),
              teamId: entry.team.id,
              rank: entry.rank,
              points: entry.points,
              played: entry.all.played,
              won: entry.all.win,
              drawn: entry.all.draw,
              lost: entry.all.lose,
              goalsFor: entry.all.goals.for,
              goalsAgainst: entry.all.goals.against,
              goalDiff: entry.goalsDiff,
              form: entry.form,
              description: entry.description,
            };
            await db
              .insert(schema.standings)
              .values(row)
              .onConflictDoUpdate({
                target: [
                  schema.standings.competitionId,
                  schema.standings.seasonYear,
                  schema.standings.groupLabel,
                  schema.standings.teamId,
                ],
                set: {
                  rank: row.rank,
                  points: row.points,
                  played: row.played,
                  won: row.won,
                  drawn: row.drawn,
                  lost: row.lost,
                  goalsFor: row.goalsFor,
                  goalsAgainst: row.goalsAgainst,
                  goalDiff: row.goalDiff,
                  form: row.form,
                  description: row.description,
                },
              });
          }
          upserted += allEntries.length;
        } else {
          upserted += allEntries.length;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] comp=${compId} season=${season}: ${msg}`);
        errors++;
      }

      await sleep(120);
    }
  }

  console.log(`\n[backfill-standings] Done.`);
  console.log(`  Standings rows upserted: ${upserted}`);
  console.log(`  Teams auto-registered: ${teamsRegistered}`);
  console.log(`  API calls: ${apiCalls}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
