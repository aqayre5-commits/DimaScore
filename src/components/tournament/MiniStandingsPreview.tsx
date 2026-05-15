'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

import { cn } from '@/lib/utils';

interface MiniStandingsPreviewProps {
  standings: StandingRow[];
  locale: Locale;
  defaultGroup: string;
  groupLabels: string[];
  standingsHash: string;
}

/**
 * Overview Block 2 — Mini standings preview with group selector.
 * Per competition-cup.md Section 7 Tab 1 Block 2.
 * Defaults to Morocco's group. "Voir tous les groupes" links to Standings tab.
 */
export function MiniStandingsPreview({
  standings,
  locale,
  defaultGroup,
  groupLabels,
  standingsHash,
}: MiniStandingsPreviewProps) {
  const t = useTranslations('tournament');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Group standings by normalized label
  const standingsByGroup = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const arr = standingsByGroup.get(row.groupLabel) ?? [];
    arr.push(row);
    standingsByGroup.set(row.groupLabel, arr);
  }

  const visibleGroups = selectedGroup ? [selectedGroup] : groupLabels;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
          {t('standingsPreview')}
        </h3>
        <select
          value={selectedGroup ?? ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          className="rounded border border-border-subtle bg-bg-surface-2 px-2 py-1 text-xs text-text-secondary"
        >
          <option value="">{t('all')}</option>
          {groupLabels.map((label) => (
            <option key={label} value={label}>
              {t('groupLabel', { label })}
              {label === defaultGroup ? ' \u2605' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-4 px-4 py-2">
        {visibleGroups.map((groupLabel) => {
          const groupRows = standingsByGroup.get(groupLabel) ?? [];
          const isMoroccoGroup = groupLabel === defaultGroup;

          return (
            <div key={groupLabel}>
              {/* Group header */}
              <div
                className={cn(
                  'mb-1.5 text-xs font-semibold',
                  isMoroccoGroup ? 'text-accent-gold' : 'text-text-primary',
                )}
              >
                {t('groupLabel', { label: groupLabel })}
                {isMoroccoGroup && ' \u2605'}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border-subtle text-[10px] text-text-tertiary">
                      <th className="w-5 py-1 text-start font-medium">#</th>
                      <th className="py-1 text-start font-medium">{t('team')}</th>
                      <th className="w-6 py-1 text-center font-medium">P</th>
                      <th className="w-6 py-1 text-center font-medium">W</th>
                      <th className="w-6 py-1 text-center font-medium">D</th>
                      <th className="w-6 py-1 text-center font-medium">L</th>
                      <th className="w-6 py-1 text-center font-medium">GF</th>
                      <th className="w-6 py-1 text-center font-medium">GA</th>
                      <th className="w-7 py-1 text-center font-medium">GD</th>
                      <th className="w-7 py-1 text-center font-semibold">Pts</th>
                      <th className="w-16 py-1 text-center font-medium">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupRows.map((row) => {
                      const teamName =
                        row.team?.name[locale] ??
                        row.team?.name['en'] ??
                        row.team?.shortName[locale] ??
                        row.team?.code ??
                        '\u2014';
                      const flag =
                        row.team?.isNational && row.team.countryCode
                          ? codeToFlag(row.team.countryCode)
                          : null;
                      const isMorocco = row.team?.code === 'MA';
                      const formChars = row.form
                        ? row.form.split('').slice(-5)
                        : ['\u2014', '\u2014', '\u2014', '\u2014', '\u2014'];

                      return (
                        <tr
                          key={row.teamId}
                          className={cn(
                            'border-b border-border-subtle last:border-b-0',
                            isMorocco && 'font-semibold',
                          )}
                        >
                          <td className="py-1.5 text-start tabular-nums text-text-tertiary">
                            {row.rank}
                          </td>
                          <td className="py-1.5">
                            <span className="flex items-center gap-1.5">
                              {flag && (
                                <span className="shrink-0 text-sm leading-none">{flag}</span>
                              )}
                              <span
                                className={cn(
                                  'overflow-hidden text-ellipsis whitespace-nowrap',
                                  isMorocco ? 'text-accent-gold' : 'text-text-secondary',
                                )}
                              >
                                {teamName}
                              </span>
                            </span>
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.played}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.won ?? 0}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.drawn ?? 0}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.lost ?? 0}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.goalsFor ?? 0}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.goalsAgainst ?? 0}
                          </td>
                          <td className="py-1.5 text-center tabular-nums text-text-tertiary">
                            {row.goalDiff ?? 0}
                          </td>
                          <td
                            className={cn(
                              'py-1.5 text-center tabular-nums font-semibold',
                              isMorocco ? 'text-accent-gold' : 'text-text-primary',
                            )}
                          >
                            {row.points}
                          </td>
                          <td className="py-1.5 text-center font-mono text-[10px] text-text-tertiary">
                            {formChars.join(' ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border-subtle px-4 py-2">
        <button
          onClick={() => {
            window.location.hash = standingsHash;
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }}
          className="text-xs font-medium text-accent-gold hover:text-accent-gold-bright"
        >
          {t('viewAllGroups')} &rarr;
        </button>
      </div>
    </div>
  );
}
