import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncCountries, syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';
import { syncRoundNumbers } from '@/lib/ingestion/rounds-sync';

/**
 * Daily catalog sync. Scheduled as the 03:00 London job
 * (`0 3 * * *` → /api/cron/reference-data in cf/worker.ts).
 * Also runs `syncRoundNumbers` in-process (no new cron, no hosting change).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();

    const countryStats = await syncCountries(provider, db);
    const compResult = await syncCompetitionsWithSeasons(provider, db, VERIFIED_COMPETITIONS);

    // Chained onto the 03:00 London daily job (`0 3 * * *` → /api/cron/reference-data
    // in cf/worker.ts). Isolated so a rounds failure does not fail catalog sync.
    let rounds: { examined: number; updated: number } | { error: string };
    try {
      rounds = await syncRoundNumbers(db);
    } catch (roundsError) {
      const message = roundsError instanceof Error ? roundsError.message : String(roundsError);
      console.error('Cron reference-data: chained rounds failed:', roundsError);
      rounds = { error: message };
    }

    return NextResponse.json({
      ok: true,
      countries: countryStats,
      competitions: compResult.competitions,
      seasons: compResult.seasons,
      coverage: compResult.coverage,
      rounds,
    });
  } catch (error) {
    console.error('Cron reference-data failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
