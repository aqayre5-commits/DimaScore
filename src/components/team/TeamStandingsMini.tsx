'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface TeamStandingsMiniProps {
  standings: StandingRow[];
  highlightTeamId: number;
  competitionName: string;
  locale: Locale;
}

function resolveTeamName(team: StandingRow['team'], locale: Locale): string {
  if (!team) return '—';
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.name[locale] ??
    team.name['en'] ??
    team.code ??
    '—'
  );
}

export function TeamStandingsMini({
  standings,
  highlightTeamId,
  competitionName,
  locale,
}: TeamStandingsMiniProps) {
  const t = useTranslations('teamPage');
  if (standings.length === 0) return null;

  // If multiple groups, only show the group containing the highlighted team
  const groups = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const label = row.groupLabel || t('league');
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(row);
  }

  let displayRows = standings;
  if (groups.size > 1) {
    for (const [, rows] of groups) {
      if (rows.some((r) => r.teamId === highlightTeamId)) {
        displayRows = rows;
        break;
      }
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{competitionName}</h3>
      </div>
      <div className="px-3 py-1">
        {displayRows.map((row) => {
          const isCurrent = row.teamId === highlightTeamId;
          return (
            <div
              key={`${row.groupLabel}-${row.teamId}`}
              className={cn(
                'flex items-center gap-2.5 border-b border-border-subtle/50 py-2 text-[13px] last:border-b-0',
                isCurrent && 'text-accent-green font-semibold',
                !isCurrent && 'text-text-secondary',
              )}
            >
              <span className="w-5 shrink-0 text-center text-[11px] font-semibold text-text-tertiary">
                {row.rank}
              </span>
              {row.team?.logoUrl && (
                <img
                  src={row.team.logoUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 object-contain"
                  loading="lazy"
                />
              )}
              <span className="flex-1 truncate">{resolveTeamName(row.team, locale)}</span>
              <span className="shrink-0 tabular-nums text-[11px] font-semibold text-text-tertiary">
                {row.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
