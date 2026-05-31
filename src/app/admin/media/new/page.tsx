import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { competitions, teams } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { AddVideoForm } from '@/components/admin/AddVideoForm';
import { getAdminSession } from '@/lib/auth/admin';

export default async function AdminMediaNewPage() {
  const cookieStore = await cookies();
  if (!getAdminSession(cookieStore)) redirect('/admin/login');
  const [compRows, teamRows] = await Promise.all([
    db
      .select({ id: competitions.id, name: competitions.name })
      .from(competitions)
      .orderBy(sql`${competitions.name}->>'en'`),
    db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .orderBy(sql`${teams.name}->>'en'`)
      .limit(30),
  ]);

  const competitionItems = compRows.map((r) => ({
    id: r.id,
    label: (r.name as Record<string, string>)?.en ?? `Competition ${r.id}`,
  }));

  const teamItems = teamRows.map((r) => ({
    id: r.id,
    label: (r.name as Record<string, string>)?.en ?? `Team ${r.id}`,
  }));

  return <AddVideoForm competitions={competitionItems} initialTeams={teamItems} />;
}
