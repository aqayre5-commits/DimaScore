import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { teams } from '@/lib/db/schema';
import { ilike, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
    })
    .from(teams)
    .where(q.trim() ? ilike(sql`${teams.name}->>'en'`, `%${q.trim()}%`) : undefined)
    .orderBy(sql`${teams.name}->>'en'`)
    .limit(30);

  const items = rows.map((r) => ({
    id: r.id,
    label: (r.name as Record<string, string>)?.en ?? `Team ${r.id}`,
  }));

  return NextResponse.json(items);
}
