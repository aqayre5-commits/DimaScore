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

const LEAGUE_GROUP_RE = /^League ([A-Z]) - Group ([A-Z])$/;

/** Parse "League A - Group C" → { league: 'A', display: 'Group A3' } (UEFA A1–A4 naming). */
function parseLeagueGroup(label: string): { league: string; display: string } | null {
  const m = LEAGUE_GROUP_RE.exec(label);
  if (!m) return null;
  const league = m[1];
  const pos = m[2].charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  return { league, display: `Group ${league}${pos}` };
}

function groupByLabel(standings: StandingRow[]): Map<string, StandingRow[]> {
  const byGroup = new Map<string, StandingRow[]>();
  for (const row of standings) {
    const key = row.groupLabel || '';
    const arr = byGroup.get(key) ?? [];
    arr.push(row);
    byGroup.set(key, arr);
  }
  return byGroup;
}

/**
 * Grouped standings for generic cup pages that have no curated CupMetadata. Two layouts:
 *  - League mode (UEFA Nations League, where every label is "League X - Group Y"): a League A–D
 *    tab selector; the selected league's groups render stacked as "Group A1…A4" (WC-style free).
 *  - Flat mode (World Cup, etc.): a per-group chip selector with the Morocco group highlighted.
 */
export function GenericGroupStandings({ standings, locale }: GenericGroupStandingsProps) {
  const byGroup = groupByLabel(standings);
  const groupLabels = [...byGroup.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  const parsed = groupLabels.map((raw) => ({ raw, meta: parseLeagueGroup(raw) }));
  const isLeagueMode = parsed.length > 0 && parsed.every((p) => p.meta !== null);

  if (isLeagueMode) {
    return (
      <LeagueGroupStandings
        byGroup={byGroup}
        groups={parsed.map((p) => ({ raw: p.raw, meta: p.meta! }))}
        locale={locale}
      />
    );
  }
  return <FlatGroupStandings byGroup={byGroup} groupLabels={groupLabels} locale={locale} />;
}

/** League A–D selector → the selected league's groups stacked, labelled "Group A1…". */
function LeagueGroupStandings({
  byGroup,
  groups,
  locale,
}: {
  byGroup: Map<string, StandingRow[]>;
  groups: { raw: string; meta: { league: string; display: string } }[];
  locale: Locale;
}) {
  const live = useLiveFixtures();
  const leagues = [...new Set(groups.map((g) => g.meta.league))].sort();
  const [selectedLeague, setSelectedLeague] = useState(leagues[0]);

  const leagueGroups = groups
    .filter((g) => g.meta.league === selectedLeague)
    .sort((a, b) => a.meta.display.localeCompare(b.meta.display, undefined, { numeric: true }));

  return (
    <div className="space-y-4">
      {/* League tab selector */}
      <div className="flex flex-wrap gap-1.5">
        {leagues.map((lg) => (
          <button
            key={lg}
            onClick={() => setSelectedLeague(lg)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              selectedLeague === lg
                ? 'border-accent-crimson bg-accent-crimson/5 text-accent-crimson'
                : 'border-border-subtle text-text-secondary hover:border-border-strong hover:text-text-primary',
            )}
          >
            League {lg}
          </button>
        ))}
      </div>

      {/* Selected league's group tables */}
      <div className="space-y-4">
        {leagueGroups.map(({ raw, meta }) => {
          const { rows, liveTeamIds } = overlayLiveStandings(byGroup.get(raw) ?? [], live.values());
          return (
            <GroupTable
              key={raw}
              groupLabel={meta.display}
              rows={rows}
              locale={locale}
              isMoroccoGroup={false}
              qualificationZones={[]}
              liveTeamIds={liveTeamIds}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Per-group chip selector (All + each group), Morocco group highlighted. */
function FlatGroupStandings({
  byGroup,
  groupLabels,
  locale,
}: {
  byGroup: Map<string, StandingRow[]>;
  groupLabels: string[];
  locale: Locale;
}) {
  const t = useTranslations('tournament');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const live = useLiveFixtures();

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
