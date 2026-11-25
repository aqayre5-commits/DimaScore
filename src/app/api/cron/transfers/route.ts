import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import {
  runLeagueTransfers,
  TRANSFER_CRON_MARGIN_MS,
  TRANSFER_CRON_WALL_MS,
} from '@/lib/ingestion/transfers';

/**
 * Weekly club-transfer sync. Also chained from `/api/cron/squads-refresh`
 * (Sunday 04:00 London / `0 4 * * SUN` in cf/worker.ts). Keep this route for
 * a manual run; do not register a new cron.
 *
 * Infra: not in vercel.json. Scheduled only via the Sunday squads-refresh job.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const deadline = Date.now() + TRANSFER_CRON_WALL_MS - TRANSFER_CRON_MARGIN_MS;
    const result = await runLeagueTransfers(provider, db, { deadline });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron transfers failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
