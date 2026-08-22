import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncTopScorers, syncTopAssists } from '@/lib/ingestion/top-scorers';
import { getCurrentSeasons } from '@/lib/db/queries';
import { and, eq, inArray } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();

    // Includes the changeover-gap fallback (leagues with no is_current row).
    const currentSeasons = await getCurrentSeasons(db);
    const coverageRows =
      currentSeasons.length === 0
        ? []
        : await db
            .select({
              leagueId: schema.leagueCoverage.leagueId,
              season: schema.leagueCoverage.season,
              topScorers: schema.leagueCoverage.topScorers,
              topAssists: schema.leagueCoverage.topAssists,
            })
            .from(schema.leagueCoverage)
            .where(
              and(
                inArray(
                  schema.leagueCoverage.leagueId,
                  currentSeasons.map((s) => s.competitionId),
                ),
                inArray(schema.leagueCoverage.season, [
                  ...new Set(currentSeasons.map((s) => s.year)),
                ]),
              ),
            )
            .then((rows) =>
              rows.filter((r) =>
                currentSeasons.some((s) => s.competitionId === r.leagueId && s.year === r.season),
              ),
            );

    const results: {
      leagueId: number;
      season: number;
      scorers: number;
      assists: number;
      error?: string;
    }[] = [];

    for (const row of coverageRows) {
      try {
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
      } catch (err) {
        // One league's failure must not abort the rest of the run.
        console.error(`Cron top-scorers failed for league ${row.leagueId}/${row.season}:`, err);
        results.push({
          leagueId: row.leagueId,
          season: row.season,
          scorers: 0,
          assists: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({ ok: true, synced: results.length, results });
  } catch (error) {
    console.error('Cron top-scorers failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
