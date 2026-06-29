'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { buildCompetitionHrefById } from '@/lib/constants/competitions-mega-menu';
import type { GroupStandingsBlock } from '@/lib/db/queries/right-rail';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import { getTeamFlagUrl } from '@/lib/team-display';
import { applyResult } from '@/lib/standings/apply-result';

interface Labels {
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
}

interface Props {
  groups: GroupStandingsBlock[];
  locale: Locale;
  labels: Labels;
}

// In-progress statuses (not finished) — only these are overlaid; finished matches are already in
// the standings, so applying them too would double-count.
const LIVE_STATUSES = new Set<string>(LIVE_CODES_ARRAY);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);

/** 0 = a match is live now, 1 = a match just finished today, 2 = upcoming only. Lower sorts first. */
function groupTier(group: GroupStandingsBlock, live: ReturnType<typeof useLiveFixtures>): number {
  let anyLive = false;
  let anyFinished = false;
  for (const fx of group.fixtures) {
    const status = live.get(fx.id)?.statusCode ?? fx.statusCode;
    if (LIVE_STATUSES.has(status)) anyLive = true;
    else if (FINISHED_STATUSES.has(status)) anyFinished = true;
  }
  return anyLive ? 0 : anyFinished ? 1 : 2;
}

/**
 * Overlay each in-progress group fixture (freshest score from the live poll, snapshot fallback)
 * onto a clone of the official rows, then re-sort.
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

/**
 * One standings table per group playing today. No switcher — every today's group renders, ordered
 * by kickoff (the server sorts the blocks). Each table live-updates via the in-progress overlay.
 */
export function HomeLiveGroupStandings({ groups, locale, labels }: Props) {
  const live = useLiveFixtures();
  // Live group(s) first, then just-finished, then upcoming — preserving the server's kickoff order
  // within each tier (the server already sorts blocks by earliest kickoff today).
  const ordered = useMemo(
    () =>
      groups
        .map((group, i) => ({ group, i, tier: groupTier(group, live) }))
        .sort((a, b) => a.tier - b.tier || a.i - b.i)
        .map((x) => x.group),
    [groups, live],
  );
  if (groups.length === 0) return null;
  return (
    <div className="space-y-3">
      {ordered.map((group) => (
        <GroupCard
          key={`${group.competitionId}-${group.groupLabel}`}
          group={group}
          live={live}
          locale={locale}
          labels={labels}
        />
      ))}
    </div>
  );
}

function GroupCard({
  group,
  live,
  locale,
  labels,
}: {
  group: GroupStandingsBlock;
  live: ReturnType<typeof useLiveFixtures>;
  locale: Locale;
  labels: Labels;
}) {
  const { rows, liveTeamIds, hasLive } = useMemo(
    () => computeProvisional(group, live),
    [group, live],
  );
  const compName = group.competitionName[locale] ?? group.competitionName['en'] ?? '';
  const href = buildCompetitionHrefById(group.competitionId, locale);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex min-w-0 items-center gap-1.5 px-4 py-2.5">
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
                      {row.team?.logoUrl ? (
                        <TeamLogo
                          src={getTeamFlagUrl(row.team)}
                          size={16}
                          className="size-4 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
                      )}
                      <span className="truncate font-medium">{teamName}</span>
                      {isLiveRow && (
                        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-score-live" />
                      )}
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

      {/* Link */}
      <div className="flex items-center justify-end border-t border-border-subtle px-4 py-2">
        {href && (
          <Link
            href={`${href}#standings`}
            className="text-[11px] font-medium text-accent-azure hover:underline"
          >
            {labels.viewFullGroup} →
          </Link>
        )}
      </div>
    </div>
  );
}
