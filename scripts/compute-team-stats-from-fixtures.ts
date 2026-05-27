/**
 * Compute team_season_stats from fixture results for competitions where
 * the API-Football /teams/statistics endpoint returns no data (qualifiers, cups, etc.).
 *
 * Only inserts rows for (team, competition, season) combos that don't already exist
 * in team_season_stats, so API-sourced rich stats are never overwritten.
 *
 * Run:
 *   pnpm tsx scripts/compute-team-stats-from-fixtures.ts              # dry-run
 *   pnpm tsx scripts/compute-team-stats-from-fixtures.ts --apply      # apply
 *
 * Requires: .env.local with DATABASE_URL
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

const dryRun = !process.argv.includes('--apply');

const FINISHED_CODES = new Set(['FT', 'AET', 'PEN', 'WO', 'AWD']);

function log(msg: string) {
  console.log(`[compute-stats] ${new Date().toISOString()} ${msg}`);
}

interface FixtureRow {
  competition_id: number;
  season_year: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  status_code: string;
}

interface TeamCompSeason {
  teamId: number;
  competitionId: number;
  seasonYear: number;
}

function buildStatsJson(teamId: number, fixtures: FixtureRow[]): Record<string, unknown> {
  let homeWins = 0,
    awayWins = 0;
  let homeDraws = 0,
    awayDraws = 0;
  let homeLosses = 0,
    awayLosses = 0;
  let homePlayed = 0,
    awayPlayed = 0;
  let goalsForHome = 0,
    goalsForAway = 0;
  let goalsAgainstHome = 0,
    goalsAgainstAway = 0;
  let cleanSheetHome = 0,
    cleanSheetAway = 0;
  let failedToScoreHome = 0,
    failedToScoreAway = 0;
  const formChars: string[] = [];

  for (const f of fixtures) {
    if (f.home_score == null || f.away_score == null) continue;
    if (!FINISHED_CODES.has(f.status_code)) continue;

    const isHome = f.home_team_id === teamId;
    const gf = isHome ? f.home_score : f.away_score;
    const ga = isHome ? f.away_score : f.home_score;

    if (isHome) {
      homePlayed++;
      goalsForHome += gf;
      goalsAgainstHome += ga;
      if (ga === 0) cleanSheetHome++;
      if (gf === 0) failedToScoreHome++;
      if (gf > ga) {
        homeWins++;
        formChars.push('W');
      } else if (gf === ga) {
        homeDraws++;
        formChars.push('D');
      } else {
        homeLosses++;
        formChars.push('L');
      }
    } else {
      awayPlayed++;
      goalsForAway += gf;
      goalsAgainstAway += ga;
      if (ga === 0) cleanSheetAway++;
      if (gf === 0) failedToScoreAway++;
      if (gf > ga) {
        awayWins++;
        formChars.push('W');
      } else if (gf === ga) {
        awayDraws++;
        formChars.push('D');
      } else {
        awayLosses++;
        formChars.push('L');
      }
    }
  }

  const totalPlayed = homePlayed + awayPlayed;

  return {
    fixtures: {
      played: { home: homePlayed, away: awayPlayed, total: totalPlayed },
      wins: { home: homeWins, away: awayWins, total: homeWins + awayWins },
      draws: { home: homeDraws, away: awayDraws, total: homeDraws + awayDraws },
      loses: { home: homeLosses, away: awayLosses, total: homeLosses + awayLosses },
    },
    goals: {
      for: {
        total: { home: goalsForHome, away: goalsForAway, total: goalsForHome + goalsForAway },
      },
      against: {
        total: {
          home: goalsAgainstHome,
          away: goalsAgainstAway,
          total: goalsAgainstHome + goalsAgainstAway,
        },
      },
    },
    clean_sheet: {
      home: cleanSheetHome,
      away: cleanSheetAway,
      total: cleanSheetHome + cleanSheetAway,
    },
    failed_to_score: {
      home: failedToScoreHome,
      away: failedToScoreAway,
      total: failedToScoreHome + failedToScoreAway,
    },
    form: formChars.join(''),
  };
}

async function main() {
  log(`Mode: ${dryRun ? 'DRY-RUN' : 'APPLY'}`);

  // Find all (team, competition, season) combos from fixtures that are NOT in team_season_stats
  const gaps = await db.execute(
    sql`SELECT DISTINCT fc.team_id, fc.competition_id, fc.season_year
        FROM (
          SELECT home_team_id AS team_id, competition_id, season_year FROM fixtures
          WHERE status_code IN ('FT','AET','PEN','WO','AWD') AND home_score IS NOT NULL
          UNION
          SELECT away_team_id AS team_id, competition_id, season_year FROM fixtures
          WHERE status_code IN ('FT','AET','PEN','WO','AWD') AND away_score IS NOT NULL
        ) fc
        WHERE NOT EXISTS (
          SELECT 1 FROM team_season_stats tss
          WHERE tss.team_id = fc.team_id
            AND tss.competition_id = fc.competition_id
            AND tss.season_year = fc.season_year
        )
        AND EXISTS (SELECT 1 FROM teams t WHERE t.id = fc.team_id)
        ORDER BY fc.team_id, fc.competition_id, fc.season_year`,
  );

  const combos: TeamCompSeason[] = (
    gaps.rows as { team_id: string; competition_id: string; season_year: string }[]
  ).map((r) => ({
    teamId: Number(r.team_id),
    competitionId: Number(r.competition_id),
    seasonYear: Number(r.season_year),
  }));

  log(`Found ${combos.length} (team, competition, season) gaps to fill`);

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < combos.length; i++) {
    const { teamId, competitionId, seasonYear } = combos[i];

    // Fetch finished fixtures for this combo
    const rows = await db.execute(
      sql`SELECT competition_id, season_year, home_team_id, away_team_id,
                 home_score, away_score, status_code
          FROM fixtures
          WHERE competition_id = ${competitionId}
            AND season_year = ${seasonYear}
            AND (home_team_id = ${teamId} OR away_team_id = ${teamId})
            AND status_code IN ('FT','AET','PEN','WO','AWD')
            AND home_score IS NOT NULL AND away_score IS NOT NULL
          ORDER BY kickoff_at ASC`,
    );

    const fixtures = rows.rows as unknown as FixtureRow[];
    if (fixtures.length === 0) {
      skipped++;
      continue;
    }

    const stats = buildStatsJson(teamId, fixtures);
    const totalPlayed = (stats.fixtures as { played: { total: number } }).played.total;

    if (totalPlayed === 0) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      await db.insert(schema.teamSeasonStats).values({
        teamId,
        competitionId,
        seasonYear,
        stats,
      });
    }

    inserted++;

    if ((i + 1) % 100 === 0) {
      log(`Progress: ${i + 1}/${combos.length}, inserted ${inserted}, skipped ${skipped}`);
    }
  }

  log('=== COMPLETE ===');
  log(`Inserted: ${inserted}`);
  log(`Skipped: ${skipped}`);
  log(`Total combos: ${combos.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
