import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getDataProvider } from '@/lib/data';
import { verifyCronSecret } from '@/lib/cron/auth';
import { syncSquad } from '@/lib/ingestion/squads';
import * as schema from '@/lib/db/schema';

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = getDataProvider();
    const allTeams = await db
      .select({ id: schema.teams.id, isWomen: schema.teams.isWomen })
      .from(schema.teams);

    let totalPlayers = 0;
    let teamsProcessed = 0;

    for (const team of allTeams) {
      const stats = await syncSquad(provider, db, {
        teamId: team.id,
        isWomen: team.isWomen ?? false,
      });
      totalPlayers += stats.updated;
      teamsProcessed++;
    }

    return NextResponse.json({
      ok: true,
      teamsProcessed,
      totalPlayers,
    });
  } catch (error) {
    console.error('Cron squads-refresh failed:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
