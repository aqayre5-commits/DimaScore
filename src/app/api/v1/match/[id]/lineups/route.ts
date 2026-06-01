import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getMatchLineups } from '@/lib/db/queries/match-detail';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: 'Invalid fixture ID' }, { status: 400 });
  }

  const lineups = await getMatchLineups(db, fixtureId);

  return NextResponse.json(lineups, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
