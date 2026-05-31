import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncSquad } from '@/lib/ingestion/squads';
import * as schema from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

const DEFAULT_BATCH = 50;
const THROTTLE_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    return NextResponse.json({
      ok: true,
      teamsProcessed,
      totalPlayers,
      totalTeams,
      offset,
      batch,
      ...(hasMore ? { nextOffset } : {}),
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    console.error('Cron squads-refresh failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
