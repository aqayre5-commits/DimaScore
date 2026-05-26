/**
 * Bulk backfill player profiles, multi-season stats, transfers, and trophies
 * for ALL teams in the database.
 *
 * Run:
 *   pnpm tsx scripts/backfill-all-player-profiles.ts                     # dry-run
 *   pnpm tsx scripts/backfill-all-player-profiles.ts --apply             # apply all
 *   pnpm tsx scripts/backfill-all-player-profiles.ts --apply --resume-from 50  # resume from team ID 50
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
import { buildCountryLookup, resolveCountryCode } from '@/lib/ingestion/country-lookup';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');
const resumeArg = process.argv.find((_, i, a) => a[i - 1] === '--resume-from');
const resumeFromTeamId = resumeArg ? Number(resumeArg) : 0;

const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

interface ApiPlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: { date: string | null; place: string | null; country: string | null } | null;
    nationality: string | null;
    height: string | null;
    weight: string | null;
    injured: boolean;
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

interface ApiTransferResponse {
  player: { id: number; name: string };
  transfers: Array<{
    date: string | null;
    type: string | null;
    teams: {
      in: { id: number | null; name: string; logo: string | null };
      out: { id: number | null; name: string; logo: string | null };
    };
  }>;
}

interface ApiTrophyResponse {
  league: string;
  country: string;
  season: string;
  place: string;
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
  console.log(`[backfill-all-players] ${new Date().toISOString()} ${msg}`);
}

async function main() {
  log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  log(`Resume from team ID: ${resumeFromTeamId || 'start'}`);
  log(`Seasons: ${SEASONS.join(', ')}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // Get all distinct team IDs that have players
  const teamRows = await db
    .selectDistinct({ teamId: schema.players.currentTeamId })
    .from(schema.players)
    .where(
      sql`${schema.players.currentTeamId} IS NOT NULL AND ${schema.players.currentTeamId} >= ${resumeFromTeamId}`,
    )
    .orderBy(asc(schema.players.currentTeamId));

  const teamIds = teamRows.map((r) => r.teamId).filter((id): id is number => id != null);
  log(`Found ${teamIds.length} teams with players to process`);

  const countryLookup = await buildCountryLookup(db);
  const allTeamRows = await db.select({ id: schema.teams.id }).from(schema.teams);
  const knownTeamIds = new Set(allTeamRows.map((r) => r.id));
  const allCompRows = await db.select({ id: schema.competitions.id }).from(schema.competitions);
  const knownCompIds = new Set(allCompRows.map((r) => r.id));

  let totalProfiles = 0;
  let totalStats = 0;
  let totalTransfers = 0;
  let totalTrophies = 0;
  let totalApiCalls = 0;
  let totalErrors = 0;
  const t0 = Date.now();

  for (let ti = 0; ti < teamIds.length; ti++) {
    const currentTeamId = teamIds[ti];
    const players = await db
      .select({ id: schema.players.id, name: schema.players.name })
      .from(schema.players)
      .where(eq(schema.players.currentTeamId, currentTeamId));

    log(`Team ${currentTeamId} (${ti + 1}/${teamIds.length}): ${players.length} players`);

    for (const player of players) {
      const playerName = (player.name as Record<string, string>).en ?? `ID ${player.id}`;
      let profileWritten = false;

      // Profile + stats per season
      for (const season of SEASONS) {
        try {
          const res = await apiGet<ApiPlayerResponse>('/players', { id: player.id, season });
          totalApiCalls++;

          const profile = res.response?.[0];
          if (!profile) {
            await sleep(120);
            continue;
          }

          if (!profileWritten) {
            const p = profile.player;
            const nationalityCode = resolveCountryCode(countryLookup, p.nationality);
            const birthCountryCode = resolveCountryCode(countryLookup, p.birth?.country ?? null);

            if (!dryRun) {
              await db
                .update(schema.players)
                .set({
                  firstname: p.firstname,
                  lastname: p.lastname,
                  birthDate: p.birth?.date ?? null,
                  birthPlace: p.birth?.place ?? null,
                  birthCountryCode,
                  nationalityCode,
                  height: p.height,
                  weight: p.weight,
                  injured: p.injured,
                })
                .where(eq(schema.players.id, player.id));
            }
            totalProfiles++;
            profileWritten = true;
          }

          for (const stat of profile.statistics) {
            const compId = stat.league.id;
            const statTeamId = stat.team.id;
            if (!knownTeamIds.has(statTeamId)) continue;

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
            }

            if (!dryRun) {
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
            totalStats++;
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  [ERROR] ${playerName} season ${season}: ${msg}`);
          totalErrors++;
        }
        await sleep(120);
      }

      // Transfers
      try {
        const transferRes = await apiGet<ApiTransferResponse>('/transfers', { player: player.id });
        totalApiCalls++;
        const transfers = transferRes.response?.[0]?.transfers ?? [];
        if (transfers.length > 0 && !dryRun) {
          await db.delete(schema.transfers).where(eq(schema.transfers.playerId, player.id));
          for (const t of transfers) {
            const fromId = t.teams.out.id;
            const toId = t.teams.in.id;
            if (
              (fromId != null && !knownTeamIds.has(fromId)) ||
              (toId != null && !knownTeamIds.has(toId))
            )
              continue;
            await db.insert(schema.transfers).values({
              playerId: player.id,
              date: t.date ?? null,
              type: t.type ?? null,
              fromTeamId: fromId ?? null,
              toTeamId: toId ?? null,
            });
            totalTransfers++;
          }
        }
      } catch (err: unknown) {
        totalErrors++;
      }
      await sleep(120);

      // Trophies
      try {
        const trophyRes = await apiGet<ApiTrophyResponse>('/trophies', { player: player.id });
        totalApiCalls++;
        const trophies = trophyRes.response ?? [];
        if (trophies.length > 0 && !dryRun) {
          await db
            .delete(schema.playerTrophies)
            .where(eq(schema.playerTrophies.playerId, player.id));
          for (const t of trophies) {
            await db.insert(schema.playerTrophies).values({
              playerId: player.id,
              league: t.league,
              country: t.country ?? null,
              season: t.season ?? null,
              place: t.place ?? null,
            });
            totalTrophies++;
          }
        }
      } catch (err: unknown) {
        totalErrors++;
      }
      await sleep(120);
    }

    // Progress summary per team
    const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
    log(
      `  Done team ${currentTeamId}. Totals so far: ${totalProfiles} profiles, ${totalStats} stats, ${totalTransfers} transfers, ${totalTrophies} trophies, ${totalApiCalls} API calls, ${totalErrors} errors (${elapsed}s)`,
    );
  }

  log('=== COMPLETE ===');
  log(`Profiles: ${totalProfiles}`);
  log(`Season stats: ${totalStats}`);
  log(`Transfers: ${totalTransfers}`);
  log(`Trophies: ${totalTrophies}`);
  log(`API calls: ${totalApiCalls}`);
  log(`Errors: ${totalErrors}`);
  log(`Duration: ${((Date.now() - t0) / 1000 / 60).toFixed(1)} minutes`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
