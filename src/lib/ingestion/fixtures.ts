import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedFixture } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';
import { parseRoundNumber } from './round';
import { slugify } from './slug';
import { getTableColumns, sql, type SQL } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/** Rows per multi-row INSERT (keeps each statement well under Postgres' 65,535 bind-parameter limit). */
const WRITE_CHUNK = 200;

/** Columns refreshed on conflict — the same set the per-row upsert used. */
const FIXTURE_UPDATE_COLUMNS = [
  'competitionId',
  'seasonYear',
  'round',
  'roundNumber',
  'kickoffAt',
  'statusCode',
  'minute',
  'homeTeamId',
  'awayTeamId',
  'homeScore',
  'awayScore',
  'homeScoreHt',
  'awayScoreHt',
  'homeScoreFt',
  'awayScoreFt',
  'homeScoreEt',
  'awayScoreEt',
  'homeScorePen',
  'awayScorePen',
  'venueId',
  'referee',
] as const;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** `SET col = excluded.col` for a multi-row upsert. */
function excluded<T extends PgTable>(table: T, keys: readonly string[]): Record<string, SQL> {
  const cols = getTableColumns(table) as Record<string, { name: string }>;
  return Object.fromEntries(keys.map((k) => [k, sql.raw(`excluded."${cols[k].name}"`)]));
}

// ─── Mapper (exported for testing) ───

export function mapFixtureToInsert(f: NormalizedFixture) {
  return {
    id: f.id,
    competitionId: f.league.id,
    seasonYear: f.league.season,
    round: f.league.round,
    roundNumber: f.league.round ? parseRoundNumber(f.league.round) : null,
    kickoffAt: new Date(f.date),
    statusCode: f.status.short,
    minute: f.status.elapsed,
    homeTeamId: f.homeTeam.id,
    awayTeamId: f.awayTeam.id,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    homeScoreHt: f.score.halftime.home,
    awayScoreHt: f.score.halftime.away,
    homeScoreFt: f.score.fulltime.home,
    awayScoreFt: f.score.fulltime.away,
    homeScoreEt: f.score.extratime.home,
    awayScoreEt: f.score.extratime.away,
    homeScorePen: f.score.penalty.home,
    awayScorePen: f.score.penalty.away,
    venueId: f.venue.id || null,
    referee: f.referee,
  };
}

/**
 * API-Football files a cup's 5th–8th place classification matches under round "Final" too, which
 * makes them show up as extra "finals" on the match page, breadcrumb and bracket. When a season has
 * more than one "Final" and semi-finals exist, the real final(s) are the ones contested by
 * semi-finalists; every other "Final" is a placement game — relabel it. Mutates round in place.
 * No-op for normal single-final cups (UCL/WC/AFCON) and before the semis exist in the batch.
 */
export function normalizeClassificationFinals(fixtures: NormalizedFixture[]): void {
  const finals = fixtures.filter((f) => f.league.round === 'Final');
  if (finals.length <= 1) return;

  const semiFinalTeamIds = new Set<number>();
  for (const f of fixtures) {
    const round = f.league.round;
    if (round === 'Semi-finals' || round === 'Semi-Finals') {
      semiFinalTeamIds.add(f.homeTeam.id);
      semiFinalTeamIds.add(f.awayTeam.id);
    }
  }
  if (semiFinalTeamIds.size === 0) return;

  for (const f of finals) {
    const bothSemifinalists =
      semiFinalTeamIds.has(f.homeTeam.id) && semiFinalTeamIds.has(f.awayTeam.id);
    if (!bothSemifinalists) {
      f.league.round = '5th–8th Place Play-off';
    }
  }
}

// ─── Sync ───

export async function syncFixtures(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number; isWomen?: boolean },
): Promise<SyncStats> {
  const fixtures = await provider.getFixtures({
    league: params.leagueId,
    season: params.season,
  });
  // Correct API-Football's "Final"-labeled 5th–8th place classification games before persisting.
  normalizeClassificationFinals(fixtures);
  const inserted = 0;
  let updated = 0;

  // One multi-row upsert per table per chunk instead of 3–4 single-row statements per fixture.
  // neon-http sends every statement as its own HTTPS round trip; serially that was ~800 round trips per
  // league; on Workers (≈0.13 s per round trip, estimated from the 20 Nov 15:00 run) that ran past
  // the 15-minute cron wall limit.
  // Rows are de-duplicated by id because one INSERT … ON CONFLICT DO UPDATE cannot touch a row twice.
  const teamRows = new Map<number, typeof schema.teams.$inferInsert>();
  const venueRows = new Map<number, typeof schema.venues.$inferInsert>();
  const fixtureRows = new Map<number, ReturnType<typeof mapFixtureToInsert>>();
  for (const f of fixtures) {
    // Stub team rows before the fixture (see syncTeams); onConflictDoNothing so richer data is kept.
    for (const t of [f.homeTeam, f.awayTeam]) {
      if (!teamRows.has(t.id)) {
        teamRows.set(t.id, {
          id: t.id,
          slug: `${slugify(t.name)}-${t.id}`,
          name: { en: t.name } as Record<string, string>,
          shortName: { en: t.name } as Record<string, string>,
          logoUrl: t.logo,
          isWomen: params.isWomen ?? false,
        });
      }
    }
    if (f.venue.id) {
      venueRows.set(f.venue.id, { id: f.venue.id, name: f.venue.name, city: f.venue.city });
    }
    fixtureRows.set(f.id, mapFixtureToInsert(f));
  }

  await runWrites(async (tx) => {
    for (const rows of chunk([...teamRows.values()], WRITE_CHUNK)) {
      await tx.insert(schema.teams).values(rows).onConflictDoNothing({ target: schema.teams.id });
    }
    for (const rows of chunk([...venueRows.values()], WRITE_CHUNK)) {
      await tx
        .insert(schema.venues)
        .values(rows)
        .onConflictDoUpdate({
          target: schema.venues.id,
          set: excluded(schema.venues, ['name', 'city']),
        });
    }
    for (const rows of chunk([...fixtureRows.values()], WRITE_CHUNK)) {
      await tx
        .insert(schema.fixtures)
        .values(rows)
        .onConflictDoUpdate({
          target: schema.fixtures.id,
          set: excluded(schema.fixtures, FIXTURE_UPDATE_COLUMNS),
        });
      updated += rows.length;
    }
  });

  return { inserted, updated };
}
