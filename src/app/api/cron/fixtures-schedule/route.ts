import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { getCurrentSeasons } from '@/lib/db/queries';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const currentSeasons = await getCurrentSeasons(db);

    const results: { competitionId: number; season: number; updated: number }[] = [];

    for (const cs of currentSeasons) {
      const stats = await syncFixtures(provider, db, {
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
