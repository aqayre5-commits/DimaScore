'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { GroupStandingsBlock } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';

interface Props {
  groups: GroupStandingsBlock[];
  locale: Locale;
  labels: {
    liveGroupStandings: string;
    matchesToday: string;
    viewFullGroup: string;
    team: string;
    played: string;
    won: string;
    drawn: string;
    lost: string;
    goalDiff: string;
    points: string;
  };
}

export function HomeLiveGroupStandings({ groups, locale, labels }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (groups.length === 0) return null;

  const group = groups[activeIdx];

  const prev = () => setActiveIdx((i) => (i === 0 ? groups.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === groups.length - 1 ? 0 : i + 1));

  const compName = group.competitionName[locale] ?? group.competitionName['en'] ?? '';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {group.competitionLogoUrl && (
            <CompetitionLogo
              src={group.competitionLogoUrl}
              size={16}
              className="size-4 shrink-0 object-contain"
            />
          )}
          <h2 className="truncate text-xs font-semibold text-text-primary">
            {compName} · Group {group.groupLabel}
          </h2>
        </div>
        {groups.length > 1 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={prev}
              className="rounded p-0.5 text-text-tertiary hover:bg-bg-surface-2 hover:text-text-primary transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] tabular-nums text-text-tertiary">
              {activeIdx + 1}/{groups.length}
            </span>
            <button
              onClick={next}
              className="rounded p-0.5 text-text-tertiary hover:bg-bg-surface-2 hover:text-text-primary transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-2 pb-2">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-text-tertiary">
              <th className="pb-1 pl-2 text-left font-medium">{labels.team}</th>
              <th className="pb-1 w-6 text-center font-medium">{labels.played}</th>
              <th className="pb-1 w-5 text-center font-medium">{labels.won}</th>
              <th className="pb-1 w-5 text-center font-medium">{labels.drawn}</th>
              <th className="pb-1 w-5 text-center font-medium">{labels.lost}</th>
              <th className="pb-1 w-7 text-center font-medium">{labels.goalDiff}</th>
              <th className="pb-1 w-7 text-center font-semibold">{labels.points}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {group.rows.map((row) => {
              const teamName = getTeamDisplayName(row.team, locale);
              return (
                <tr key={row.teamId ?? row.rank} className="text-text-primary">
                  <td className="py-1.5 pl-2">
                    <div className="flex items-center gap-1.5">
                      {row.team?.logoUrl ? (
                        <TeamLogo
                          src={row.team.logoUrl}
                          size={16}
                          className="size-4 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
                      )}
                      <span className="truncate font-medium">{teamName}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-text-secondary">
                    {row.played}
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-text-secondary">
                    {row.won ?? '-'}
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-text-secondary">
                    {row.drawn ?? '-'}
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-text-secondary">
                    {row.lost ?? '-'}
                  </td>
                  <td className="py-1.5 text-center tabular-nums text-text-secondary">
                    {row.goalDiff != null
                      ? row.goalDiff > 0
                        ? `+${row.goalDiff}`
                        : row.goalDiff
                      : '-'}
                  </td>
                  <td className="py-1.5 text-center tabular-nums font-semibold">{row.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dots + link */}
      <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2">
        {groups.length > 1 ? (
          <div className="flex items-center gap-1">
            {groups.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`size-1.5 rounded-full transition-colors ${
                  i === activeIdx ? 'bg-accent-azure' : 'bg-border-subtle hover:bg-text-tertiary'
                }`}
              />
            ))}
          </div>
        ) : (
          <div />
        )}
        <Link
          href={`/${locale}/competition/${getCountrySlug(group.competitionSlug, locale) ?? group.competitionSlug}/${group.competitionSlug}`}
          className="text-[11px] font-medium text-accent-azure hover:underline"
        >
          {labels.viewFullGroup} →
        </Link>
      </div>
    </div>
  );
}
