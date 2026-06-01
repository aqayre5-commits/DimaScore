import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getMatchStatistics, getMatchPlayerStats } from '@/lib/db/queries/match-detail';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: 'Invalid fixture ID' }, { status: 400 });
  }

  const [teamStats, playerStats] = await Promise.all([
    getMatchStatistics(db, fixtureId),
    getMatchPlayerStats(db, fixtureId),
  ]);

  return NextResponse.json(
    { teamStats, playerStats },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    },
  );
}
