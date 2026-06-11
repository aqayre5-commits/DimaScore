'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { GroupStandingsBlock } from '@/lib/db/queries/right-rail';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';

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
    live: string;
  };
}

// In-progress statuses (not finished) — only these are overlaid; finished matches are already in
// the official standings, so applying them too would double-count.
const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT']);

function applyResult(row: StandingRow, scored: number, conceded: number) {
  row.played = (row.played ?? 0) + 1;
  row.goalsFor = (row.goalsFor ?? 0) + scored;
  row.goalsAgainst = (row.goalsAgainst ?? 0) + conceded;
  row.goalDiff = (row.goalDiff ?? 0) + (scored - conceded);
  if (scored > conceded) {
    row.won = (row.won ?? 0) + 1;
    row.points = (row.points ?? 0) + 3;
  } else if (scored < conceded) {
    row.lost = (row.lost ?? 0) + 1;
  } else {
    row.drawn = (row.drawn ?? 0) + 1;
    row.points = (row.points ?? 0) + 1;
  }
}

/**
 * Overlay each in-progress group fixture (freshest score from the live poll, snapshot fallback)
 * onto a clone of the official rows, then re-sort. Returns the (possibly provisional) rows, the
 * set of teams with a live adjustment, and whether any live match applied.
 */
function computeProvisional(
  group: GroupStandingsBlock,
  live: ReturnType<typeof useLiveFixtures>,
): { rows: StandingRow[]; liveTeamIds: Set<number>; hasLive: boolean } {
  const clone = group.rows.map((r) => ({ ...r }));
  const byTeam = new Map<number, StandingRow>();
  for (const r of clone) if (r.teamId != null) byTeam.set(r.teamId, r);

  const liveTeamIds = new Set<number>();
  for (const fx of group.fixtures) {
    if (fx.homeTeamId == null || fx.awayTeamId == null) continue;
    const patch = live.get(fx.id);
    const status = patch?.statusCode ?? fx.statusCode;
    if (!LIVE_STATUSES.has(status)) continue;
    const hs = patch?.homeScore ?? fx.homeScore;
    const as = patch?.awayScore ?? fx.awayScore;
    if (hs == null || as == null) continue;
    const home = byTeam.get(fx.homeTeamId);
    const away = byTeam.get(fx.awayTeamId);
    if (!home || !away) continue;
    applyResult(home, hs, as);
    applyResult(away, as, hs);
    liveTeamIds.add(fx.homeTeamId);
    liveTeamIds.add(fx.awayTeamId);
  }

  if (liveTeamIds.size === 0) return { rows: group.rows, liveTeamIds, hasLive: false };

  clone.sort(
    (a, b) =>
      (b.points ?? 0) - (a.points ?? 0) ||
      (b.goalDiff ?? 0) - (a.goalDiff ?? 0) ||
      (b.goalsFor ?? 0) - (a.goalsFor ?? 0),
  );
  return { rows: clone, liveTeamIds, hasLive: true };
}

export function HomeLiveGroupStandings({ groups, locale, labels }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const live = useLiveFixtures();

  const group = groups[activeIdx];
  const { rows, liveTeamIds, hasLive } = useMemo(
    () =>
      group
        ? computeProvisional(group, live)
        : { rows: [], liveTeamIds: new Set<number>(), hasLive: false },
    [group, live],
  );

  if (groups.length === 0 || !group) return null;

  const prev = () => setActiveIdx((i) => (i === 0 ? groups.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === groups.length - 1 ? 0 : i + 1));

  const compName = group.competitionName[locale] ?? group.competitionName['en'] ?? '';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5">
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
          {hasLive && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-score-live/10 px-1.5 py-0.5 text-[10px] font-bold text-score-live">
              <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
              {labels.live}
            </span>
          )}
        </div>
        {groups.length > 1 && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={prev}
              className="rounded p-0.5 text-text-tertiary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] tabular-nums text-text-tertiary">
              {activeIdx + 1}/{groups.length}
            </span>
            <button
              onClick={next}
              className="rounded p-0.5 text-text-tertiary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-2 pb-2">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="text-text-tertiary">
              <th className="pb-1 pl-2 text-left font-medium">{labels.team}</th>
              <th className="w-6 pb-1 text-center font-medium">{labels.played}</th>
              <th className="w-5 pb-1 text-center font-medium">{labels.won}</th>
              <th className="w-5 pb-1 text-center font-medium">{labels.drawn}</th>
              <th className="w-5 pb-1 text-center font-medium">{labels.lost}</th>
              <th className="w-7 pb-1 text-center font-medium">{labels.goalDiff}</th>
              <th className="w-7 pb-1 text-center font-semibold">{labels.points}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => {
              const teamName = getTeamDisplayName(row.team, locale);
              const isLiveRow = row.teamId != null && liveTeamIds.has(row.teamId);
              return (
                <tr key={row.teamId ?? row.rank} className="text-text-primary">
                  <td className="py-1.5 pl-2">
                    <div className="flex items-center gap-1.5">
                      {isLiveRow && (
                        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-score-live" />
                      )}
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
                  <td
                    className={`py-1.5 text-center tabular-nums font-semibold ${isLiveRow ? 'text-score-live' : ''}`}
                  >
                    {row.points}
                  </td>
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
