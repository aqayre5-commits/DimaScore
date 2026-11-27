import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncFixtures } from '@/lib/ingestion/fixtures';
import { getCurrentSeasons } from '@/lib/db/queries';
import { getIdleSeasonKeys, selectSeasonsToSync } from '@/lib/ingestion/idle-seasons';

/**
 * Stop starting new competitions after this long, so the run always returns well inside the platform
 * limit (Cloudflare cron: 15 min wall; a cancelled cron is retried by Cloudflare, adding duplicate
 * API calls). Unstarted competitions are reported in `skipped` and picked up by later runs: the start
 * position rotates every half hour so the same tail is not starved.
 */
const TIME_BUDGET_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const startedAt = Date.now();
    // Idle seasons (nothing within -3/+30 days) sync once a day instead of every 30 minutes.
    const { run: allSeasons, idleSkipped } = selectSeasonsToSync(
      await getCurrentSeasons(db),
      await getIdleSeasonKeys(db, new Date(startedAt)),
      new Date(startedAt),
    );
    const offset = allSeasons.length ? Math.floor(startedAt / 1_800_000) % allSeasons.length : 0;
    const currentSeasons = [...allSeasons.slice(offset), ...allSeasons.slice(0, offset)];
    const skipped: { competitionId: number; season: number }[] = [];

    const results: { competitionId: number; season: number; updated: number }[] = [];
    const errors: { competitionId: number; season: number; error: string }[] = [];

    // Per-competition isolation: one failing competition must not abort the whole run — critical at
    // season rollover, when several leagues switch season at once.
    for (const cs of currentSeasons) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) {
        skipped.push({ competitionId: cs.competitionId, season: cs.year });
        continue;
      }
      try {
        const stats = await syncFixtures(provider, db, {
          leagueId: cs.competitionId,
          season: cs.year,
          isWomen: cs.isWomen,
        });
        results.push({
          competitionId: cs.competitionId,
          season: cs.year,
          updated: stats.updated,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `Cron fixtures-schedule: competition ${cs.competitionId} season ${cs.year} failed:`,
          error,
        );
        errors.push({ competitionId: cs.competitionId, season: cs.year, error: message });
      }
    }

    return NextResponse.json({
      ok: true,
      synced: results.length,
      failed: errors.length,
      skipped: skipped.length,
      idleSkipped: idleSkipped.length,
      results,
      errors,
      skippedCompetitions: skipped,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Cron fixtures-schedule failed:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
