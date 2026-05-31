import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncCountries, syncCompetitionsWithSeasons } from '@/lib/ingestion/reference-data';
import { VERIFIED_COMPETITIONS } from '@/lib/constants/competitions';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();

    const countryStats = await syncCountries(provider, db);
    const compResult = await syncCompetitionsWithSeasons(provider, db, VERIFIED_COMPETITIONS);

    return NextResponse.json({
      ok: true,
      countries: countryStats,
      competitions: compResult.competitions,
      seasons: compResult.seasons,
      coverage: compResult.coverage,
    });
  } catch (error) {
    console.error('Cron reference-data failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
