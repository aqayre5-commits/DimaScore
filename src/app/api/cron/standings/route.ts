import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncStandings } from '@/lib/ingestion/standings';
import { getCurrentSeasons } from '@/lib/db/queries';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const currentSeasons = await getCurrentSeasons(db);
    const withStandings = currentSeasons.filter((cs) => cs.hasStandingsCoverage);

    const results: { competitionId: number; season: number; updated: number }[] = [];

    for (const cs of withStandings) {
      const stats = await syncStandings(provider, db, {
        leagueId: cs.competitionId,
        season: cs.year,
      });
      results.push({
        competitionId: cs.competitionId,
        season: cs.year,
        updated: stats.updated,
      });
    }

    return NextResponse.json({ ok: true, synced: results.length, results });
  } catch (error) {
    console.error('Cron standings failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
