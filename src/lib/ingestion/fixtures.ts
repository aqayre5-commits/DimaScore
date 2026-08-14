import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedFixture } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';
import { parseRoundNumber } from './round';
import { slugify } from './slug';

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

  await runWrites(async (tx) => {
    for (const f of fixtures) {
      // Upsert stub team rows before the fixture. The fixture payload carries id/name/logo, which
      // covers every NOT NULL column on `teams`. Without this, a club that has never been through
      // `syncTeams` (e.g. a promoted side at season rollover) has no `teams` row and the UI renders
      // the opponent as "—". onConflictDoNothing so the richer `syncTeams` data is never clobbered.
      for (const t of [f.homeTeam, f.awayTeam]) {
        await tx
          .insert(schema.teams)
          .values({
            id: t.id,
            slug: `${slugify(t.name)}-${t.id}`,
            name: { en: t.name } as Record<string, string>,
            shortName: { en: t.name } as Record<string, string>,
            logoUrl: t.logo,
            isWomen: params.isWomen ?? false,
          })
          .onConflictDoNothing({ target: schema.teams.id });
      }

      // Upsert venue as side-effect (match venue)
      if (f.venue.id) {
        await tx
          .insert(schema.venues)
          .values({
            id: f.venue.id,
            name: f.venue.name,
            city: f.venue.city,
          })
          .onConflictDoUpdate({
            target: schema.venues.id,
            set: { name: f.venue.name, city: f.venue.city },
          });
      }

      const row = mapFixtureToInsert(f);
      await tx
        .insert(schema.fixtures)
        .values(row)
        .onConflictDoUpdate({
          target: schema.fixtures.id,
          set: {
            competitionId: row.competitionId,
            seasonYear: row.seasonYear,
            round: row.round,
            roundNumber: row.roundNumber,
            kickoffAt: row.kickoffAt,
            statusCode: row.statusCode,
            minute: row.minute,
            homeTeamId: row.homeTeamId,
            awayTeamId: row.awayTeamId,
            homeScore: row.homeScore,
            awayScore: row.awayScore,
            homeScoreHt: row.homeScoreHt,
            awayScoreHt: row.awayScoreHt,
            homeScoreFt: row.homeScoreFt,
            awayScoreFt: row.awayScoreFt,
            homeScoreEt: row.homeScoreEt,
            awayScoreEt: row.awayScoreEt,
            homeScorePen: row.homeScorePen,
            awayScorePen: row.awayScorePen,
            venueId: row.venueId,
            referee: row.referee,
          },
        });
      updated++;
    }
  });

  return { inserted, updated };
}
