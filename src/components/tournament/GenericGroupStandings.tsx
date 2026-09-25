'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { GroupTable } from './GroupTable';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { overlayLiveStandings } from '@/lib/standings/overlay-live';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface GenericGroupStandingsProps {
  standings: StandingRow[];
  locale: Locale;
}

const MOROCCO_CC = 'MA';

/**
 * Grouped standings for generic cup pages that have no curated CupMetadata (e.g. UEFA Nations
 * League). Derives the groups from each row's `groupLabel` and renders a GroupTable per group
 * (WC-style — every group free, not stacked into one list), with a group chip selector and the
 * shared live overlay. Used when a cup's standings span more than one group.
 */
export function GenericGroupStandings({ standings, locale }: GenericGroupStandingsProps) {
  const t = useTranslations('tournament');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const live = useLiveFixtures();

  const byGroup = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const key = row.groupLabel || '';
    const arr = byGroup.get(key) ?? [];
    arr.push(row);
    byGroup.set(key, arr);
  }
  const groupLabels = [...byGroup.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  const moroccoGroup = groupLabels.find((label) =>
    (byGroup.get(label) ?? []).some((r) => r.team?.countryCode === MOROCCO_CC),
  );
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
              ? 'bg-accent-azure text-white'
              : 'text-text-tertiary hover:text-accent-azure/70',
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
                ? 'bg-accent-azure text-white'
                : label === moroccoGroup
                  ? 'text-accent-azure/70 hover:text-accent-azure'
                  : 'text-text-tertiary hover:text-accent-azure/70',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Group tables — one per group */}
      <div className="space-y-4">
        {visibleGroups.map((label) => {
          const { rows, liveTeamIds } = overlayLiveStandings(
            byGroup.get(label) ?? [],
            live.values(),
          );
          return (
            <GroupTable
              key={label}
              groupLabel={label}
              rows={rows}
              locale={locale}
              isMoroccoGroup={label === moroccoGroup}
              qualificationZones={[]}
              liveTeamIds={liveTeamIds}
            />
          );
        })}
      </div>
    </div>
  );
}
