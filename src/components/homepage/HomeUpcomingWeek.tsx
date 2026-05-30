'use client';

import Link from 'next/link';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import type { RightRailFixture } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  fixtures: RightRailFixture[];
  locale: Locale;
  labels: {
    thisWeek: string;
  };
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HomeUpcomingWeek({ fixtures, locale, labels }: Props) {
  if (fixtures.length === 0) return null;

  // Group by date
  const dateGroups = new Map<string, RightRailFixture[]>();
  for (const f of fixtures) {
    const key = f.kickoffAt.toISOString().slice(0, 10);
    const arr = dateGroups.get(key) ?? [];
    arr.push(f);
    dateGroups.set(key, arr);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.thisWeek}
        </h2>
      </div>

      <div className="divide-y divide-border-subtle">
        {[...dateGroups.entries()].map(([dateKey, dayFixtures]) => (
          <div key={dateKey}>
            {/* Date header */}
            <div className="bg-bg-surface-2 px-4 py-1 text-[11px] font-semibold text-text-secondary">
              {formatDate(dayFixtures[0].kickoffAt, locale)}
            </div>

            {/* Fixtures */}
            {dayFixtures.map((f) => {
              const homeName = getTeamDisplayName(f.homeTeam, locale);
              const awayName = getTeamDisplayName(f.awayTeam, locale);
              return (
                <Link
                  key={f.id}
                  href={`/${locale}/match/${f.id}`}
                  className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-bg-surface-2"
                >
                  <span className="w-10 shrink-0 text-[11px] tabular-nums text-text-secondary">
                    {formatTime(f.kickoffAt, locale)}
                  </span>
                  <div className="flex flex-1 min-w-0 items-center gap-1">
                    {f.homeTeam?.logoUrl ? (
                      <img
                        src={f.homeTeam.logoUrl}
                        alt=""
                        className="size-3.5 shrink-0 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface-2" />
                    )}
                    <span className="truncate text-xs text-text-primary">{homeName}</span>
                    <span className="shrink-0 text-[10px] text-text-tertiary">vs</span>
                    <span className="truncate text-xs text-text-primary">{awayName}</span>
                    {f.awayTeam?.logoUrl ? (
                      <img
                        src={f.awayTeam.logoUrl}
                        alt=""
                        className="size-3.5 shrink-0 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface-2" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
