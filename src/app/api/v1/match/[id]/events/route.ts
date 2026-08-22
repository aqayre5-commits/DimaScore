import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getMatchEvents } from '@/lib/db/queries/match-detail';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (
    !Number.isFinite(fixtureId) ||
    !Number.isInteger(fixtureId) ||
    fixtureId <= 0 ||
    fixtureId >= 2_000_000_000
  ) {
    return NextResponse.json({ error: 'Invalid fixture ID' }, { status: 400 });
  }

  const events = await getMatchEvents(db, fixtureId);

  return NextResponse.json(events, {
    headers: {
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
    },
  });
}
