import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncTeams } from '@/lib/ingestion/teams';
import { getCurrentSeasons } from '@/lib/db/queries';

/**
 * Populates `teams` for every current season, with full metadata (country, venue, founded,
 * national/women flags, logo). Scheduled ahead of `fixtures-schedule` so a season's teams exist
 * before its fixtures reference them — otherwise a club new to the DB (e.g. promoted at rollover)
 * has no `teams` row and the UI renders its opponent as "—".
 *
 * `syncFixtures` also upserts stub team rows as a safety net, but this cron is the source of the
 * complete record (and backfills teams for fixtures already ingested).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const currentSeasons = await getCurrentSeasons(db);

    const results: { competitionId: number; season: number; updated: number }[] = [];
    const errors: { competitionId: number; season: number; error: string }[] = [];

    // Per-competition isolation: one failing competition must not abort the whole run.
    for (const cs of currentSeasons) {
      try {
        const stats = await syncTeams(provider, db, {
          leagueId: cs.competitionId,
          season: cs.year,
          isWomen: cs.isWomen,
        });
        results.push({ competitionId: cs.competitionId, season: cs.year, updated: stats.updated });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `Cron teams: competition ${cs.competitionId} season ${cs.year} failed:`,
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
    console.error('Cron teams failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
