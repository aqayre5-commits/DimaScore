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
    const errors: { competitionId: number; season: number; error: string }[] = [];

    // Per-competition isolation: one failing competition must not abort the whole run
    // (which previously left every competition's standings stale).
    for (const cs of withStandings) {
      try {
        const stats = await syncStandings(provider, db, {
          leagueId: cs.competitionId,
          season: cs.year,
        });
        results.push({ competitionId: cs.competitionId, season: cs.year, updated: stats.updated });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `Cron standings: competition ${cs.competitionId} season ${cs.year} failed:`,
          error,
        );
        errors.push({ competitionId: cs.competitionId, season: cs.year, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      synced: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron standings failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
