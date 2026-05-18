import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { competitions } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const rows = await db
    .select({
      id: competitions.id,
      name: competitions.name,
    })
    .from(competitions)
    .orderBy(sql`${competitions.name}->>'en'`);

  const items = rows.map((r) => ({
    id: r.id,
    label: (r.name as Record<string, string>)?.en ?? `Competition ${r.id}`,
  }));

  return NextResponse.json(items);
}
