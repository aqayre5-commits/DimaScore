import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncRoundNumbers } from '@/lib/ingestion/rounds-sync';

/**
 * Fills fixtures.round_number for rows the expanded parser can now score
 * (e.g. "Knockout Round Play-offs"). No paid API call.
 *
 * Infra: register this route after deploy (daily is enough). Not in vercel.json.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncRoundNumbers(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron rounds failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
