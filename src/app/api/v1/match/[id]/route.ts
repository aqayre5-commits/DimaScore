import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { getMatchDetail, getMatchCoverage, getMatchEvents } from '@/lib/db/queries/match-detail';

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

  const match = await getMatchDetail(db, fixtureId);
  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  // Fetch coverage + events (for goal scorers) in parallel
  const [coverage, events] = await Promise.all([
    getMatchCoverage(db, match.competition.id, match.seasonYear),
    getMatchEvents(db, fixtureId),
  ]);

  // Extract goal scorers from events
  const goalScorers = events
    .filter((e) => {
      const type = e.type?.toLowerCase() ?? '';
      const detail = (e.detail ?? '').toLowerCase();
      return type === 'goal' && !detail.includes('missed');
    })
    .map((e) => ({
      playerName: e.player?.name?.en ?? '',
      minute: e.minute,
      extraMinute: e.extraMinute,
      isOwnGoal: (e.detail ?? '').toLowerCase().includes('own goal'),
      isPenalty: (e.detail ?? '').toLowerCase().includes('penalty'),
      teamId: e.teamId,
    }));

  const body = {
    id: match.id,
    kickoffAt: match.kickoffAt.toISOString(),
    statusCode: match.statusCode,
    minute: match.minute,
    extraMinute: match.extraMinute,
    round: match.round,
    referee: match.referee,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    homeScoreHt: match.homeScoreHt,
    awayScoreHt: match.awayScoreHt,
    homeScoreFt: match.homeScoreFt,
    awayScoreFt: match.awayScoreFt,
    homeScoreEt: match.homeScoreEt,
    awayScoreEt: match.awayScoreEt,
    homeScorePen: match.homeScorePen,
    awayScorePen: match.awayScorePen,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    competition: match.competition,
    venue: match.venue,
    seasonYear: match.seasonYear,
    coverage,
    goalScorers,
  };

  return NextResponse.json(body, {
    headers: {
      'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=15',
    },
  });
}
