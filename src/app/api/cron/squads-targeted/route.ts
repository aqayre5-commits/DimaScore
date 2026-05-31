import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncSquad } from '@/lib/ingestion/squads';
import * as schema from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

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
    const raw = url.searchParams.get('teamIds') ?? '';
    const teamIds = raw
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (teamIds.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid teamIds param' }, { status: 400 });
    }

    if (teamIds.length > 100) {
      return NextResponse.json({ error: 'Max 100 team IDs per request' }, { status: 400 });
    }

    const provider = getDataProvider();

    // Fetch isWomen flag for requested teams
    const teamRows = await db
      .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
      .from(schema.teams)
      .where(inArray(schema.teams.id, teamIds));

    const teamMap = new Map(teamRows.map((t) => [t.id, t.isWomen ?? false]));

    const results: { teamId: number; players: number; error?: string }[] = [];

    for (let i = 0; i < teamIds.length; i++) {
      const teamId = teamIds[i];
      const isWomen = teamMap.get(teamId);

      if (isWomen === undefined) {
        results.push({ teamId, players: 0, error: 'Team not found in DB' });
        continue;
      }

      try {
        const stats = await syncSquad(provider, db, { teamId, isWomen });
        results.push({ teamId, players: stats.updated });
      } catch (err) {
        results.push({
          teamId,
          players: 0,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      if (i < teamIds.length - 1) {
        await sleep(THROTTLE_MS);
      }
    }

    const totalPlayers = results.reduce((sum, r) => sum + r.players, 0);

    return NextResponse.json({
      ok: true,
      teamsProcessed: results.length,
      totalPlayers,
      results,
    });
  } catch (error) {
    console.error('Cron squads-targeted failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
