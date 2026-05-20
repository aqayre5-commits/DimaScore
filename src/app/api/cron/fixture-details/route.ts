import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncFixtureDetails, getFixturesMissingDetails } from '@/lib/ingestion/fixture-details';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const fixtureIds = await getFixturesMissingDetails(db, 50);

    if (fixtureIds.length === 0) {
      return NextResponse.json({ ok: true, message: 'No fixtures missing details', processed: 0 });
    }

    const results: {
      fixtureId: number;
      events: number;
      lineups: number;
      statistics: number;
      playerStats: number;
    }[] = [];

    for (const fixtureId of fixtureIds) {
      const counts = await syncFixtureDetails(provider, db, fixtureId);
      results.push({ fixtureId, ...counts });
    }

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
