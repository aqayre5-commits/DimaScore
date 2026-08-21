import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { finalizeStaleFixtures } from '@/lib/ingestion/finalize-stale';
import { submitToIndexNow } from '@/lib/seo/indexnow';
import { BASE_URL } from '@/lib/constants/site';
import { locales } from '@/lib/i18n/config';

/**
 * Finalizes matches the live poller lost track of (stuck in a live/NS status
 * past kickoff). Safety net for the poller's "drops off the live feed → never
 * written to FT" gap. Scheduled in vercel.json.
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const result = await finalizeStaleFixtures(provider, db);

    // Instant-index the freshly-finalized matches (best-effort, prod-only).
    if (result.finalizedIds.length > 0) {
      const urls = result.finalizedIds.flatMap((id) =>
        locales.map((l) => `${BASE_URL}/${l}/match/${id}`),
      );
      await submitToIndexNow(urls);
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
