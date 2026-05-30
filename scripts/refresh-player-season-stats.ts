/**
 * Refresh player season stats for the current season (default: 2025).
 *
 * Run:
 *   pnpm tsx scripts/refresh-player-season-stats.ts                        # dry-run all players
 *   pnpm tsx scripts/refresh-player-season-stats.ts --apply                # apply all players
 *   pnpm tsx scripts/refresh-player-season-stats.ts --apply --player 9     # single player (Hakimi)
 *   pnpm tsx scripts/refresh-player-season-stats.ts --apply --season 2024  # different season
 *   pnpm tsx scripts/refresh-player-season-stats.ts --apply --resume-from 500  # resume from player ID
 *
 * Requires: .env.local with DATABASE_URL and API_FOOTBALL_KEY
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, asc, sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { apiGet } from '@/lib/data/adapters/api-football/client';
import { buildCountryLookup, resolveCountryCode } from '@/lib/ingestion/country-lookup';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');
const singlePlayerArg = process.argv.find((_, i, a) => a[i - 1] === '--player');
const singlePlayerId = singlePlayerArg ? Number(singlePlayerArg) : null;
const seasonArg = process.argv.find((_, i, a) => a[i - 1] === '--season');
const season = seasonArg ? Number(seasonArg) : 2025;
const resumeArg = process.argv.find((_, i, a) => a[i - 1] === '--resume-from');
const resumeFromId = resumeArg ? Number(resumeArg) : 0;

interface ApiPlayerResponse {
  player: {
    id: number;
    name: string;
    photo: string | null;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string | null;
      season: number;
    };
    games: {
      appearences: number | null;
      lineups: number | null;
      minutes: number | null;
      position: string | null;
      rating: string | null;
      captain: boolean;
    };
    substitutes: { in: number | null; out: number | null; bench: number | null };
    shots: { total: number | null; on: number | null };
    goals: {
      total: number | null;
      conceded: number | null;
      assists: number | null;
      saves: number | null;
    };
    passes: { total: number | null; key: number | null; accuracy: number | null };
    tackles: { total: number | null; blocks: number | null; interceptions: number | null };
    duels: { total: number | null; won: number | null };
    dribbles: { attempts: number | null; success: number | null; past: number | null };
    fouls: { drawn: number | null; committed: number | null };
    cards: { yellow: number | null; yellowred: number | null; red: number | null };
    penalty: {
      won: number | null;
      committed: number | null;
      scored: number | null;
      missed: number | null;
      saved: number | null;
    };
  }>;
}

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

function log(msg: string) {
  console.log(`[refresh-stats] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  log(`Season: ${season}`);
  if (singlePlayerId) log(`Single player: ${singlePlayerId}`);
  if (resumeFromId) log(`Resume from player ID: ${resumeFromId}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // Build lookups
  const countryLookup = await buildCountryLookup(db);
  const allTeamRows = await db.select({ id: schema.teams.id }).from(schema.teams);
  const knownTeamIds = new Set(allTeamRows.map((r) => r.id));
  const allCompRows = await db.select({ id: schema.competitions.id }).from(schema.competitions);
  const knownCompIds = new Set(allCompRows.map((r) => r.id));

  // Get players to process
  let playerRows: { id: number; name: Record<string, string> }[];
  if (singlePlayerId) {
    playerRows = await db
      .select({ id: schema.players.id, name: schema.players.name })
      .from(schema.players)
      .where(eq(schema.players.id, singlePlayerId));
  } else {
    playerRows = await db
      .select({ id: schema.players.id, name: schema.players.name })
      .from(schema.players)
      .where(sql`${schema.players.id} >= ${resumeFromId}`)
      .orderBy(asc(schema.players.id));
  }

  log(`Found ${playerRows.length} players to process`);

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalApiCalls = 0;
  let totalErrors = 0;
  let totalCompsCreated = 0;
  const t0 = Date.now();

  for (let pi = 0; pi < playerRows.length; pi++) {
    const player = playerRows[pi];
    const playerName = player.name.en ?? `ID ${player.id}`;

    try {
      const res = await apiGet<ApiPlayerResponse>('/players', { id: player.id, season });
      totalApiCalls++;

      const profile = res.response?.[0];
      if (!profile || !profile.statistics || profile.statistics.length === 0) {
        totalSkipped++;
        await sleep(120);
        continue;
      }

      for (const stat of profile.statistics) {
        const compId = stat.league.id;
        const statTeamId = stat.team.id;

        // Skip stats with null IDs
        if (compId == null || statTeamId == null) continue;

        // Skip stats for teams not in our DB
        if (!knownTeamIds.has(statTeamId)) continue;

        try {
          // Auto-create competition if missing
          if (!knownCompIds.has(compId)) {
            const countryCode = resolveCountryCode(countryLookup, stat.league.country);
            if (!dryRun) {
              await db
                .insert(schema.competitions)
                .values({
                  id: compId,
                  slug: slugify(stat.league.name, compId),
                  name: { en: stat.league.name },
                  countryCode,
                  type: 'Cup',
                  logoUrl: stat.league.logo ?? null,
                })
                .onConflictDoNothing();
            }
            knownCompIds.add(compId);
            totalCompsCreated++;
            log(`  Created competition: ${stat.league.name} (${compId})`);
          }

          if (!dryRun) {
            // Delete existing row for this exact combo
            await db
              .delete(schema.playerSeasonStats)
              .where(
                and(
                  eq(schema.playerSeasonStats.playerId, player.id),
                  eq(schema.playerSeasonStats.teamId, statTeamId),
                  eq(schema.playerSeasonStats.competitionId, compId),
                  eq(schema.playerSeasonStats.seasonYear, season),
                ),
              );
            await db.insert(schema.playerSeasonStats).values({
              playerId: player.id,
              teamId: statTeamId,
              competitionId: compId,
              seasonYear: season,
              stats: {
                appearances: stat.games.appearences,
                lineups: stat.games.lineups,
                minutes: stat.games.minutes,
                position: stat.games.position,
                rating: stat.games.rating,
                captain: stat.games.captain,
                goals: stat.goals.total,
                assists: stat.goals.assists,
                conceded: stat.goals.conceded,
                saves: stat.goals.saves,
                shotsTotal: stat.shots.total,
                shotsOn: stat.shots.on,
                passesTotal: stat.passes.total,
                passesKey: stat.passes.key,
                passAccuracy: stat.passes.accuracy,
                tacklesTotal: stat.tackles.total,
                blocks: stat.tackles.blocks,
                interceptions: stat.tackles.interceptions,
                duelsTotal: stat.duels.total,
                duelsWon: stat.duels.won,
                dribblesAttempts: stat.dribbles.attempts,
                dribblesSuccess: stat.dribbles.success,
                foulsDrawn: stat.fouls.drawn,
                foulsCommitted: stat.fouls.committed,
                yellowCards: stat.cards.yellow,
                yellowRedCards: stat.cards.yellowred,
                redCards: stat.cards.red,
                penaltyWon: stat.penalty.won,
                penaltyScored: stat.penalty.scored,
                penaltyMissed: stat.penalty.missed,
                penaltySaved: stat.penalty.saved,
                subsIn: stat.substitutes.in,
                subsOut: stat.substitutes.out,
                bench: stat.substitutes.bench,
                teamName: stat.team.name,
                teamLogo: stat.team.logo,
                playerName: profile.player.name,
                playerPhoto: profile.player.photo,
              },
            });
          }
          totalUpdated++;
        } catch (statErr: unknown) {
          const statMsg = statErr instanceof Error ? statErr.message : String(statErr);
          console.error(
            `  [STAT ERROR] ${playerName} comp=${compId} team=${statTeamId}: ${statMsg}`,
          );
          totalErrors++;
        }
      }

      if (singlePlayerId) {
        log(
          `  ${playerName}: ${profile.statistics.length} competition entries found for season ${season}`,
        );
        for (const stat of profile.statistics) {
          log(
            `    ${stat.league.name} (${stat.team.name}): ${stat.games.appearences ?? 0} apps, ${stat.goals.total ?? 0} goals, ${stat.goals.assists ?? 0} assists`,
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('429') && !msg.includes('rate')) {
        console.error(`  [ERROR] ${playerName} (${player.id}): ${msg}`);
      }
      totalErrors++;
    }

    await sleep(120);

    // Progress log every 50 players
    if (!singlePlayerId && ((pi + 1) % 50 === 0 || pi === playerRows.length - 1)) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      log(
        `Progress: ${pi + 1}/${playerRows.length} players, ${totalUpdated} stats updated, ${totalSkipped} skipped, ${totalApiCalls} API calls, ${totalErrors} errors (${elapsed}s)`,
      );
    }
  }

  log('=== COMPLETE ===');
  log(`Stats updated: ${totalUpdated}`);
  log(`Skipped (no data): ${totalSkipped}`);
  log(`Competitions created: ${totalCompsCreated}`);
  log(`API calls: ${totalApiCalls}`);
  log(`Errors: ${totalErrors}`);
  log(`Duration: ${((Date.now() - t0) / 1000 / 60).toFixed(1)} minutes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
