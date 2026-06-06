import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { DataProvider } from '@/lib/data/provider';
import type { NormalizedFixture } from '@/lib/data/types';
import * as schema from '@/lib/db/schema';
import { runWrites } from '@/lib/db/client';
import type { SyncStats } from './types';
import { parseRoundNumber } from './round';

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

// ─── Sync ───

export async function syncFixtures(
  provider: DataProvider,
  db: NeonHttpDatabase<typeof schema>,
  params: { leagueId: number; season: number },
): Promise<SyncStats> {
  const fixtures = await provider.getFixtures({
    league: params.leagueId,
    season: params.season,
  });
  const inserted = 0;
  let updated = 0;

  await runWrites(async (tx) => {
    for (const f of fixtures) {
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
