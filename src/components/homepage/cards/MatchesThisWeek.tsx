import Link from 'next/link';
import { db } from '@/lib/db/client';
import { asc, and, eq, gte, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import type { Locale } from '@/lib/i18n/config';

interface MatchesThisWeekProps {
  locale: Locale;
}

function getTeamLabel(
  team: {
    shortName: Record<string, string>;
    name: Record<string, string>;
    code: string | null;
  } | null,
  locale: string,
): string {
  if (!team) return '???';
  return (
    team.shortName[locale] ||
    team.name[locale] ||
    team.shortName.en ||
    team.name.en ||
    team.code ||
    '???'
  );
}

export async function MatchesThisWeek({ locale }: MatchesThisWeekProps) {
  const now = new Date();
  const weekOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: schema.fixtures.id,
      kickoffAt: schema.fixtures.kickoffAt,
      homeTeamId: schema.fixtures.homeTeamId,
      awayTeamId: schema.fixtures.awayTeamId,
      compName: schema.competitions.name,
    })
    .from(schema.fixtures)
    .innerJoin(schema.competitions, eq(schema.fixtures.competitionId, schema.competitions.id))
    .where(
      and(
        eq(schema.fixtures.statusCode, 'NS'),
        gte(schema.fixtures.kickoffAt, now),
        lt(schema.fixtures.kickoffAt, weekOut),
      ),
    )
    .orderBy(asc(schema.competitions.displayPriority), asc(schema.fixtures.kickoffAt))
    .limit(5);

  if (rows.length === 0) return null;

  // Hydrate teams
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.homeTeamId != null) teamIds.add(r.homeTeamId);
    if (r.awayTeamId != null) teamIds.add(r.awayTeamId);
  }

  type TeamSnap = {
    id: number;
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
  };
  const teamsMap = new Map<number, TeamSnap>();

  if (teamIds.size > 0) {
    const teams = await db
      .select({
        id: schema.teams.id,
        name: schema.teams.name,
        shortName: schema.teams.shortName,
        code: schema.teams.code,
      })
      .from(schema.teams)
      .where(
        sql`${schema.teams.id} IN (${sql.join(
          [...teamIds].map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    for (const t of teams) {
      teamsMap.set(t.id, t);
    }
  }

  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const home = teamsMap.get(row.homeTeamId ?? -1) ?? null;
        const away = teamsMap.get(row.awayTeamId ?? -1) ?? null;
        const compName = row.compName[locale] || row.compName.en || '';
        const dayLabel = row.kickoffAt.toLocaleDateString(locale, { weekday: 'short' });
        const timeLabel = row.kickoffAt.toLocaleTimeString(locale, {
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <li key={row.id}>
            <Link
              href={`/${locale}/match/${row.id}`}
              className="block rounded-lg px-3 py-2 transition-colors hover:bg-bg-surface-2"
            >
              <p className="text-sm font-medium text-text-primary">
                {getTeamLabel(home, locale)} – {getTeamLabel(away, locale)}
              </p>
              <p className="mt-0.5 text-xs text-text-tertiary">
                {compName} · {dayLabel} {timeLabel}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
