import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { searchAll } from '@/lib/db/queries/search';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '5', 10) || 5, 20);

  if (q.trim().length < 2) {
    return NextResponse.json({ teams: [], players: [], competitions: [] });
  }

  const results = await searchAll(db, q, limit);
  return NextResponse.json(results);
}
