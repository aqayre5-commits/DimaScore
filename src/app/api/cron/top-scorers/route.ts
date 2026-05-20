import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncTopScorers, syncTopAssists } from '@/lib/ingestion/top-scorers';
import { eq, and } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();

    // Find all current seasons with topScorers coverage
    const coverageRows = await db
      .select({
        leagueId: schema.leagueCoverage.leagueId,
        season: schema.leagueCoverage.season,
        topScorers: schema.leagueCoverage.topScorers,
        topAssists: schema.leagueCoverage.topAssists,
      })
      .from(schema.leagueCoverage)
      .innerJoin(
        schema.seasons,
        and(
          eq(schema.seasons.competitionId, schema.leagueCoverage.leagueId),
          eq(schema.seasons.year, schema.leagueCoverage.season),
          eq(schema.seasons.isCurrent, true),
        ),
      );

    const results: { leagueId: number; season: number; scorers: number; assists: number }[] = [];

    for (const row of coverageRows) {
      let scorersCount = 0;
      let assistsCount = 0;

      if (row.topScorers) {
        const stats = await syncTopScorers(provider, db, {
          leagueId: row.leagueId,
          season: row.season,
        });
        scorersCount = stats.updated;
      }

      if (row.topAssists) {
        const stats = await syncTopAssists(provider, db, {
          leagueId: row.leagueId,
          season: row.season,
        });
        assistsCount = stats.updated;
      }

      results.push({
        leagueId: row.leagueId,
        season: row.season,
        scorers: scorersCount,
        assists: assistsCount,
      });
    }

    return NextResponse.json({ ok: true, synced: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
