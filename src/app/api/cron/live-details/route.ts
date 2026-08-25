import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { runLiveDetailsFallback } from '@/lib/ingestion/live-details-fallback';

// Safety net for in-play match details. The Railway poller is primary; this catches
// live fixtures it misses (lineups/events) and fetches lineups just before kickoff.
// Staleness-gated, so it does ≈nothing when the poller is healthy.
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const result = await runLiveDetailsFallback(provider, db);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Cron live-details failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
