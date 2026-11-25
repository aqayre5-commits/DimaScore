import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncSquad } from '@/lib/ingestion/squads';
import {
  runLeagueTransfers,
  TRANSFER_CRON_MARGIN_MS,
  TRANSFER_CRON_WALL_MS,
} from '@/lib/ingestion/transfers';
import * as schema from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

const DEFAULT_BATCH = 50;
const THROTTLE_MS = 200;

/**
 * Weekly squad refresh. Scheduled as the Sunday 04:00 London job
 * (`0 4 * * SUN` → /api/cron/squads-refresh in cf/worker.ts).
 * Also runs `runLeagueTransfers` in-process afterwards if time remains
 * inside the ~15-minute Cloudflare cron wall (60s margin). No new cron.
 */

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const deadline = startedAt + TRANSFER_CRON_WALL_MS - TRANSFER_CRON_MARGIN_MS;

  try {
    const url = new URL(request.url);
    const batch = Math.min(
      Math.max(parseInt(url.searchParams.get('batch') ?? '', 10) || DEFAULT_BATCH, 1),
      200,
    );
    const offset = Math.max(parseInt(url.searchParams.get('offset') ?? '', 10) || 0, 0);

    const provider = getDataProvider();
    const allTeams = await db
      .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
      .from(schema.teams)
      .orderBy(asc(schema.teams.id));

    const totalTeams = allTeams.length;
    const slice = allTeams.slice(offset, offset + batch);

    let totalPlayers = 0;
    let teamsProcessed = 0;
    const errors: { teamId: number; error: string }[] = [];

    for (const team of slice) {
      try {
        const stats = await syncSquad(provider, db, {
          teamId: team.id,
          isWomen: team.isWomen ?? false,
        });
        totalPlayers += stats.updated;
      } catch (err) {
        errors.push({ teamId: team.id, error: err instanceof Error ? err.message : String(err) });
      }
      teamsProcessed++;

      if (teamsProcessed < slice.length) {
        await sleep(THROTTLE_MS);
      }
    }

    const nextOffset = offset + batch;
    const hasMore = nextOffset < totalTeams;

    // Chained onto the Sunday 04:00 London job (`0 4 * * SUN` → /api/cron/squads-refresh
    // in cf/worker.ts). Isolated; stops if the 15-minute wall (minus a 60s margin) is near.
    let transfers:
      | Awaited<ReturnType<typeof runLeagueTransfers>>
      | { error: string; skipped: true }
      | { skipped: true; reason: string };
    try {
      if (Date.now() >= deadline) {
        transfers = {
          skipped: true,
          reason: `No time left after squads (${Date.now() - startedAt}ms used; wall ${TRANSFER_CRON_WALL_MS}ms minus ${TRANSFER_CRON_MARGIN_MS}ms margin)`,
        };
      } else {
        transfers = await runLeagueTransfers(provider, db, { deadline });
      }
    } catch (transfersError) {
      const message = transfersError instanceof Error ? transfersError.message : String(transfersError);
      console.error('Cron squads-refresh: chained transfers failed:', transfersError);
      transfers = { error: message, skipped: true };
    }

    return NextResponse.json({
      ok: true,
      teamsProcessed,
      totalPlayers,
      totalTeams,
      offset,
      batch,
      transfers,
      ...(hasMore ? { nextOffset } : {}),
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    console.error('Cron squads-refresh failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
