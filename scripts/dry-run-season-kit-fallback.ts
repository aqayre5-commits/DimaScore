/**
 * Read-only count of how many stored lineup palettes would move off the
 * neutral grey shirt if the season-kit fallback were applied.
 *
 * Does not write. Safe to run against a production read replica.
 *
 *   pnpm tsx scripts/dry-run-season-kit-fallback.ts
 *   pnpm tsx scripts/dry-run-season-kit-fallback.ts --days 14
 *   pnpm tsx scripts/dry-run-season-kit-fallback.ts --all
 *
 * Requires DATABASE_URL (read-only is enough). Does not need API_FOOTBALL_KEY.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import type { StoredTeamKits } from '@/lib/match/kit-colours';
import { kitsNeedRefresh } from '@/lib/match/kit-colours';
import {
  applyStoredSeasonFallback,
  inferSeasonKitsFromApiSamples,
  type ApiKitSample,
  type FixtureKitContext,
  type SeasonKitSet,
} from '@/lib/match/season-kits';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const all = process.argv.includes('--all');
const daysArg = process.argv.find((_, i, a) => a[i - 1] === '--days');
const days = daysArg ? Number(daysArg) : 14;

function log(msg: string) {
  console.log(`[dry-run-season-kit-fallback] ${msg}`);
}

function isGreyRole(colors: StoredTeamKits | null, role: 'player' | 'goalkeeper') {
  return !colors || colors[role]?.source === 'neutral';
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set (read-only is enough)');
    process.exit(1);
  }

  const rows = await db
    .select({
      fixtureId: schema.fixtureLineups.fixtureId,
      teamId: schema.fixtureLineups.teamId,
      colors: schema.fixtureLineups.colors,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      season: schema.fixtures.seasonYear,
    })
    .from(schema.fixtureLineups)
    .innerJoin(schema.fixtures, eq(schema.fixtures.id, schema.fixtureLineups.fixtureId))
    .where(
      all
        ? sql`true`
        : sql`${schema.fixtures.kickoffAt} >= now() - (${days} * interval '1 day')
            and ${schema.fixtures.kickoffAt} <= now() + interval '2 days'`,
    );

  const samplesBySeason = new Map<string, ApiKitSample[]>();
  for (const r of rows) {
    const colors = r.colors as StoredTeamKits | null;
    if (colors?.player?.source !== 'api' || r.season == null || r.homeTeamId == null) continue;
    const key = `${r.teamId}:${r.season}`;
    const list = samplesBySeason.get(key) ?? [];
    list.push({
      teamId: r.teamId,
      isHome: r.teamId === r.homeTeamId,
      player: colors.player,
      goalkeeper: colors.goalkeeper ?? null,
    });
    samplesBySeason.set(key, list);
  }

  const inferredCache = new Map<string, SeasonKitSet | null>();
  function inferred(teamId: number, season: number): SeasonKitSet | null {
    const key = `${teamId}:${season}`;
    if (!inferredCache.has(key)) {
      inferredCache.set(
        key,
        inferSeasonKitsFromApiSamples(teamId, season, samplesBySeason.get(key) ?? []),
      );
    }
    return inferredCache.get(key) ?? null;
  }

  type Tally = { teamId: number; grey: number; wouldMove: number; stayGrey: number };
  const byTeam = new Map<number, Tally>();
  let greyRows = 0;
  let wouldMove = 0;
  let stayGrey = 0;
  const stayReasons = new Map<string, number>();

  for (const r of rows) {
    const colors = r.colors as StoredTeamKits | null;
    if (!kitsNeedRefresh(colors)) continue;
    if (r.homeTeamId == null || r.awayTeamId == null || r.season == null) continue;
    greyRows += 1;
    const tally = byTeam.get(r.teamId) ?? { teamId: r.teamId, grey: 0, wouldMove: 0, stayGrey: 0 };
    tally.grey += 1;

    const ctx: FixtureKitContext = {
      fixtureId: r.fixtureId,
      season: r.season,
      homeTeamId: r.homeTeamId,
      awayTeamId: r.awayTeamId,
      inferred: new Map(
        [r.homeTeamId, r.awayTeamId].map((id) => [id, inferred(id, r.season!)!] ).filter((x) => x[1]),
      ),
    };
    const next = applyStoredSeasonFallback(ctx, r.teamId, colors);
    const moved =
      next &&
      ((isGreyRole(colors, 'player') && next.player.source !== 'neutral') ||
        (isGreyRole(colors, 'goalkeeper') && next.goalkeeper.source !== 'neutral'));
    if (moved) {
      tally.wouldMove += 1;
      wouldMove += 1;
    } else {
      tally.stayGrey += 1;
      stayGrey += 1;
      const why = next?.player.source === 'neutral' ? 'no-kit-for-team-season' : 'still-neutral';
      stayReasons.set(why, (stayReasons.get(why) ?? 0) + 1);
    }
    byTeam.set(r.teamId, tally);
  }

  log(`=== DRY RUN (read-only, ${all ? 'all stored line-ups' : `days=${days}`}) ===`);
  log(`Line-up rows in the window: ${rows.length}`);
  log(`Rows currently missing a complete kit (null or source=neutral): ${greyRows}`);
  log(`Would move from grey to a kit: ${wouldMove}`);
  log(`Would stay grey: ${stayGrey}`);
  log('By team (team_id, grey, would_move, stay_grey):');
  const sorted = [...byTeam.values()].sort((a, b) => b.grey - a.grey);
  for (const t of sorted) {
    log(`  ${t.teamId}\t${t.grey}\t${t.wouldMove}\t${t.stayGrey}`);
  }
  if (stayReasons.size) {
    log('Stay-grey reasons:');
    for (const [k, n] of stayReasons) log(`  ${k}: ${n}`);
  }
  log('No rows were written.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
