import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getMatchDetail, getHeadToHead, getNextFixtures } from '@/lib/db/queries/match-detail';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const fixtureId = Number(id);
  if (!Number.isFinite(fixtureId) || fixtureId <= 0) {
    return NextResponse.json({ error: 'Invalid fixture ID' }, { status: 400 });
  }

  const match = await getMatchDetail(db, fixtureId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;

  const [h2h, nextFixtures] = await Promise.all([
    homeTeamId > 0 && awayTeamId > 0 ? getHeadToHead(db, homeTeamId, awayTeamId, fixtureId) : [],
    homeTeamId > 0 && awayTeamId > 0 ? getNextFixtures(db, homeTeamId, awayTeamId, fixtureId) : [],
  ]);

  // Serialize dates to ISO strings
  const body = {
    h2h: h2h.map((f) => ({ ...f, kickoffAt: f.kickoffAt.toISOString() })),
    nextFixtures: nextFixtures.map((f) => ({ ...f, kickoffAt: f.kickoffAt.toISOString() })),
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
