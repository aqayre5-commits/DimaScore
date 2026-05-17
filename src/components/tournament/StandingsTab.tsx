'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GroupTable } from './GroupTable';
import type { StandingRow } from '@/lib/db/queries';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface StandingsTabProps {
  standings: StandingRow[];
  metadata: CupMetadata;
  locale: Locale;
}

/**
 * Standings tab — group selector chip strip + group tables.
 * Per competition-cup.md Section 7 Tab 2.
 * "Tous" shows all groups stacked; selecting a group shows only that group.
 */
export function StandingsTab({ standings, metadata, locale }: StandingsTabProps) {
  const t = useTranslations('tournament');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const groupLabels = metadata.groups.map((g) => g.label);
  const moroccoGroup = metadata.groups.find((g) => g.isMoroccoGroup);

  // Group standings by groupLabel
  const standingsByGroup = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const arr = standingsByGroup.get(row.groupLabel) ?? [];
    arr.push(row);
    standingsByGroup.set(row.groupLabel, arr);
  }

  const visibleGroups = selectedGroup ? [selectedGroup] : groupLabels;

  return (
    <div className="space-y-4">
      {/* Group selector chip strip */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedGroup(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            selectedGroup === null
              ? 'bg-accent-gold/15 text-accent-gold ring-1 ring-accent-gold/30'
              : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          {t('all')}
        </button>
        {groupLabels.map((label) => (
          <button
            key={label}
            onClick={() => setSelectedGroup(label)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selectedGroup === label
                ? 'bg-accent-gold/15 text-accent-gold ring-1 ring-accent-gold/30'
                : label === moroccoGroup?.label
                  ? 'text-accent-gold/70 hover:text-accent-gold'
                  : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            {label}
            {label === moroccoGroup?.label && ' \u2605'}
          </button>
        ))}
      </div>

      {/* Group tables */}
      <div className="space-y-4">
        {visibleGroups.map((label) => {
          const rows = standingsByGroup.get(label) ?? [];
          const isMoroccoGroup = label === moroccoGroup?.label;

          return (
            <GroupTable
              key={label}
              groupLabel={label}
              rows={rows}
              locale={locale}
              isMoroccoGroup={isMoroccoGroup}
              qualificationZones={metadata.qualificationZones}
            />
          );
        })}
      </div>
    </div>
  );
}
