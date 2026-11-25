/**
 * DB helpers for season-kit resolution. Kept off season-kits.ts so the
 * catalog/resolver stays free of Drizzle imports.
 */

import { and, eq, inArray, sql } from 'drizzle-orm';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';
import type { KitPalette, StoredTeamKits } from './kit-colours';
import {
  inferSeasonKitsFromApiSamples,
  type ApiKitSample,
  type FixtureKitContext,
  type SeasonKitSet,
} from './season-kits';

export async function loadFixtureKitContext(
  db: NeonHttpDatabase<typeof schema>,
  fixtureId: number,
  opts?: { infer?: boolean },
): Promise<FixtureKitContext | null> {
  const [fix] = await db
    .select({
      id: schema.fixtures.id,
      season: schema.fixtures.seasonYear,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
    })
    .from(schema.fixtures)
    .where(eq(schema.fixtures.id, fixtureId))
    .limit(1);
  if (!fix || fix.homeTeamId == null || fix.awayTeamId == null || fix.season == null) {
    return null;
  }

  const ctx: FixtureKitContext = {
    fixtureId: fix.id,
    season: fix.season,
    homeTeamId: fix.homeTeamId,
    awayTeamId: fix.awayTeamId,
  };

  if (opts?.infer !== false) {
    const inferred = await inferKitsForTeams(db, [fix.homeTeamId, fix.awayTeamId], fix.season, fixtureId);
    if (inferred.size > 0) ctx.inferred = inferred;
  }
  return ctx;
}

export async function inferKitsForTeams(
  db: NeonHttpDatabase<typeof schema>,
  teamIds: number[],
  season: number,
  exceptFixtureId?: number,
): Promise<Map<number, SeasonKitSet>> {
  if (teamIds.length === 0) return new Map();
  const rows = await db
    .select({
      fixtureId: schema.fixtureLineups.fixtureId,
      teamId: schema.fixtureLineups.teamId,
      colors: schema.fixtureLineups.colors,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
    })
    .from(schema.fixtureLineups)
    .innerJoin(schema.fixtures, eq(schema.fixtures.id, schema.fixtureLineups.fixtureId))
    .where(
      and(
        inArray(schema.fixtureLineups.teamId, teamIds),
        eq(schema.fixtures.seasonYear, season),
        sql`${schema.fixtureLineups.colors}->'player'->>'source' = 'api'`,
        ...(exceptFixtureId != null
          ? [sql`${schema.fixtureLineups.fixtureId} <> ${exceptFixtureId}`]
          : []),
      ),
    );

  const samples: ApiKitSample[] = [];
  for (const r of rows) {
    const colors = r.colors as StoredTeamKits | null;
    if (!colors?.player) continue;
    samples.push({
      teamId: r.teamId,
      isHome: r.teamId === r.homeTeamId,
      player: colors.player as KitPalette,
      goalkeeper: (colors.goalkeeper as KitPalette) ?? null,
    });
  }

  const out = new Map<number, SeasonKitSet>();
  for (const id of teamIds) {
    const set = inferSeasonKitsFromApiSamples(id, season, samples);
    if (set) out.set(id, set);
  }
  return out;
}
