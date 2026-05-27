/**
 * Backfill player profiles, multi-season stats, transfers, and trophies
 * from API-Football.
 *
 * Run:
 *   pnpm tsx scripts/backfill-player-profiles.ts --team 40          # dry-run for Liverpool
 *   pnpm tsx scripts/backfill-player-profiles.ts --team 40 --apply  # apply changes
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
  console.error('Usage: pnpm tsx scripts/backfill-player-profiles.ts --team <teamId> [--apply]');
  process.exit(1);
}

const SEASONS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

// ── API-Football response types ──

interface ApiPlayerResponse {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    birth: {
      date: string | null;
      place: string | null;
      country: string | null;
    } | null;
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

async function main() {
  console.log(`[backfill] Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);
  console.log(`[backfill] Team ID: ${teamId}`);
  console.log(`[backfill] Seasons: ${SEASONS.join(', ')}`);

  if (!process.env.API_FOOTBALL_KEY) {
    console.error('[backfill] API_FOOTBALL_KEY not set in .env.local');
    process.exit(1);
  }

  // 1. Get all players on this team
  const players = await db
    .select({ id: schema.players.id, name: schema.players.name })
    .from(schema.players)
    .where(eq(schema.players.currentTeamId, teamId!));

  console.log(`[backfill] Found ${players.length} players for team ${teamId}`);
  if (players.length === 0) return;

  const countryLookup = await buildCountryLookup(db);

  // Get all known team IDs for FK validation on transfers
  const allTeamRows = await db.select({ id: schema.teams.id }).from(schema.teams);
  const knownTeamIds = new Set(allTeamRows.map((r) => r.id));

  // Get all known competition IDs (will grow as we auto-register new ones)
  const allCompRows = await db.select({ id: schema.competitions.id }).from(schema.competitions);
  const knownCompIds = new Set(allCompRows.map((r) => r.id));

  let profilesUpdated = 0;
  let statsUpserted = 0;
  let transfersInserted = 0;
  let trophiesInserted = 0;
  let compsAutoRegistered = 0;
  let apiCalls = 0;
  let errors = 0;

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const playerName = (player.name as Record<string, string>).en ?? `ID ${player.id}`;
    let profileWritten = false;

    // ── Fetch player profile + stats for EACH season ──
    for (const season of SEASONS) {
      try {
        const res = await apiGet<ApiPlayerResponse>('/players', {
          id: player.id,
          season,
        });
        apiCalls++;

        const profile = res.response?.[0];
        if (!profile) {
          await sleep(120);
          continue;
        }

        // Update bio fields once (from the first season that has data)
        if (!profileWritten) {
          const p = profile.player;
          const nationalityCode = resolveCountryCode(countryLookup, p.nationality);
          const birthCountryCode = resolveCountryCode(countryLookup, p.birth?.country ?? null);

          console.log(
            `  [${dryRun ? 'DRY' : 'UPDATE'}] ${playerName} (${player.id}): ` +
              `${p.nationality ?? '?'} → ${nationalityCode ?? '?'}, ` +
              `DOB=${p.birth?.date ?? '?'}, H=${p.height ?? '?'}, W=${p.weight ?? '?'}`,
          );

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
          profilesUpdated++;
          profileWritten = true;
        }

        // Upsert season stats — ALL competitions the player participated in
        for (const stat of profile.statistics) {
          const compId = stat.league.id;
          const statTeamId = stat.team.id;

          // Skip if team not in our DB (can't resolve FK)
          if (!knownTeamIds.has(statTeamId)) continue;

          // Auto-register competition if not yet in DB
          if (!knownCompIds.has(compId)) {
            const countryCode = resolveCountryCode(countryLookup, stat.league.country);
            const compName = stat.league.name;

            console.log(
              `    [AUTO-REGISTER] Competition ${compId}: ${compName} (${stat.league.country})`,
            );

            if (!dryRun) {
              await db
                .insert(schema.competitions)
                .values({
                  id: compId,
                  slug: slugify(compName, compId),
                  name: { en: compName },
                  countryCode,
                  type: 'Cup', // safe default; leagues also work
                  logoUrl: stat.league.logo ?? null,
                })
                .onConflictDoNothing();
            }

            knownCompIds.add(compId);
            compsAutoRegistered++;
          }

          const statsJson = {
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
          };

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
              stats: statsJson,
            });
          }
          statsUpserted++;
        }

        if (profile.statistics.length > 0) {
          console.log(`    [STATS] ${season}: ${profile.statistics.length} competition(s)`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [ERROR] Profile ${playerName} season ${season}: ${msg}`);
        errors++;
      }

      await sleep(120);
    }

    // ── Fetch transfers ──
    try {
      const transferRes = await apiGet<ApiTransferResponse>('/transfers', {
        player: player.id,
      });
      apiCalls++;

      const transfers = transferRes.response?.[0]?.transfers ?? [];
      if (transfers.length > 0) {
        if (!dryRun) {
          await db.delete(schema.transfers).where(eq(schema.transfers.playerId, player.id));
        }

        let inserted = 0;
        for (const t of transfers) {
          const fromTeamId = t.teams.out.id;
          const toTeamId = t.teams.in.id;
          const fromValid = fromTeamId == null || knownTeamIds.has(fromTeamId);
          const toValid = toTeamId == null || knownTeamIds.has(toTeamId);
          if (!fromValid || !toValid) continue;

          if (!dryRun) {
            await db.insert(schema.transfers).values({
              playerId: player.id,
              date: t.date ?? null,
              type: t.type ?? null,
              fromTeamId: fromTeamId ?? null,
              toTeamId: toTeamId ?? null,
            });
          }
          inserted++;
        }
        transfersInserted += inserted;
        console.log(`    [TRANSFERS] ${inserted} records`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] Transfers for ${playerName}: ${msg}`);
      errors++;
    }

    await sleep(120);

    // ── Fetch trophies ──
    try {
      const trophyRes = await apiGet<ApiTrophyResponse>('/trophies', {
        player: player.id,
      });
      apiCalls++;

      const trophies = trophyRes.response ?? [];
      if (trophies.length > 0) {
        if (!dryRun) {
          await db
            .delete(schema.playerTrophies)
            .where(eq(schema.playerTrophies.playerId, player.id));
        }

        for (const t of trophies) {
          if (!dryRun) {
            await db.insert(schema.playerTrophies).values({
              playerId: player.id,
              league: t.league,
              country: t.country ?? null,
              season: t.season ?? null,
              place: t.place ?? null,
            });
          }
          trophiesInserted++;
        }
        console.log(`    [TROPHIES] ${trophies.length} records`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [ERROR] Trophies for ${playerName}: ${msg}`);
      errors++;
    }

    await sleep(120);

    // Progress
    if ((i + 1) % 5 === 0 || i === players.length - 1) {
      console.log(
        `  ... ${i + 1}/${players.length} players (${apiCalls} API calls, ${compsAutoRegistered} comps registered, ${errors} errors)`,
      );
    }
  }

  console.log(`\n[backfill] Done.`);
  console.log(`  Profiles updated: ${profilesUpdated}`);
  console.log(`  Season stats upserted: ${statsUpserted}`);
  console.log(`  Transfers inserted: ${transfersInserted}`);
  console.log(`  Trophies inserted: ${trophiesInserted}`);
  console.log(`  Competitions auto-registered: ${compsAutoRegistered}`);
  console.log(`  API calls: ${apiCalls}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
