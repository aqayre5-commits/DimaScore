'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import { Flag } from '@/components/shared/Flag';
import { TeamLogo } from '@/components/shared/Logo';
import { useFollows } from '@/hooks/useFollows';
import type { LeagueSnapshot } from '@/lib/db/queries/home-rail';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  leagues: LeagueSnapshot[];
  locale: Locale;
  labels: {
    tableTab: string;
    scorersTab: string;
    viewFullStandings: string;
    topScorers: string;
    team: string;
    played: string;
    won: string;
    lost: string;
    goalDiff: string;
    points: string;
  };
}

/**
 * One rail card that merges the old standings + scorers widgets: switchable Table / Scorers with a
 * league switcher. Defaults to a followed competition (else the first league). Client-only follow
 * state resolves after mount (useFollows / useSyncExternalStore), so there's no hydration mismatch.
 */
export function HomeLeagueSnapshot({ leagues, locale, labels }: Props) {
  const { followedComps } = useFollows();
  const [tab, setTab] = useState<'table' | 'scorers'>('table');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (leagues.length === 0) return null;

  const followedDefault = leagues.find((l) => followedComps.has(l.compId));
  const activeId =
    selectedId != null && leagues.some((l) => l.compId === selectedId)
      ? selectedId
      : (followedDefault?.compId ?? leagues[0].compId);
  const league = leagues.find((l) => l.compId === activeId) ?? leagues[0];

  const country = getCountrySlug(league.countryKey, locale);
  const viewAllHref = `/${locale}/competition/${country}/${league.slug[locale]}#${
    tab === 'table' ? 'standings' : 'scorers'
  }`;

  const top6 = league.rows.slice(0, 6);
  const topScorers = league.scorers.slice(0, 5);

  const tabClass = (active: boolean) =>
    `flex-1 border-b-2 px-3 py-2.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
      active
        ? 'border-accent-green text-accent-green'
        : 'border-transparent text-text-tertiary hover:text-text-secondary'
    }`;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Table / Scorers tabs */}
      <div className="flex">
        <button type="button" onClick={() => setTab('table')} className={tabClass(tab === 'table')}>
          {labels.tableTab}
        </button>
        <button
          type="button"
          onClick={() => setTab('scorers')}
          className={tabClass(tab === 'scorers')}
        >
          {labels.scorersTab}
        </button>
      </div>

      {/* League switcher */}
      <div className="border-b border-border-subtle px-3 py-2">
        <select
          value={activeId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          aria-label={league.compName}
          className="w-full rounded-md bg-bg-surface-2 px-2 py-1.5 text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
        >
          {leagues.map((l) => (
            <option key={l.compId} value={l.compId}>
              {l.compName}
            </option>
          ))}
        </select>
      </div>

      {/* Body */}
      {tab === 'table' ? (
        top6.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="w-6 py-2 text-center font-medium">#</th>
                  <th className="py-2 text-start font-medium">{labels.team}</th>
                  <th className="w-7 py-2 text-center font-medium">{labels.played}</th>
                  <th className="w-7 py-2 text-center font-medium">{labels.won}</th>
                  <th className="w-7 py-2 text-center font-medium">{labels.lost}</th>
                  <th className="w-8 py-2 text-center font-medium">{labels.goalDiff}</th>
                  <th className="w-8 py-2 pe-3 text-center font-medium">{labels.points}</th>
                </tr>
              </thead>
              <tbody>
                {top6.map((row, idx) => {
                  const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
                  return (
                    <tr
                      key={row.teamId ?? idx}
                      className="border-b border-border-subtle transition-colors last:border-b-0 hover:bg-bg-surface-2"
                    >
                      <td className="py-2 text-center tabular-nums text-text-tertiary">
                        {row.rank}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <Flag
                            countryCode={row.team?.countryCode}
                            logoUrl={row.team?.logoUrl}
                            isNational={row.team?.isNational}
                            size={16}
                            label={row.team?.code}
                            className="shrink-0"
                          />
                          <span className="truncate text-text-primary">
                            {getTeamDisplayName(row.team, locale)}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 text-center tabular-nums text-text-secondary">
                        {row.played}
                      </td>
                      <td className="py-2 text-center tabular-nums text-text-secondary">
                        {row.won}
                      </td>
                      <td className="py-2 text-center tabular-nums text-text-secondary">
                        {row.lost}
                      </td>
                      <td className="py-2 text-center tabular-nums text-text-secondary">
                        {gd > 0 ? '+' : ''}
                        {gd}
                      </td>
                      <td className="py-2 pe-3 text-center tabular-nums font-semibold text-text-primary">
                        {row.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-text-tertiary">&mdash;</p>
        )
      ) : topScorers.length > 0 ? (
        <div className="divide-y divide-border-subtle">
          {topScorers.map((s, i) => (
            <Link
              key={s.playerId}
              href={`/${locale}/joueur/${s.playerSlug}`}
              className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-bg-surface-2"
            >
              <span className="w-4 shrink-0 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
              {s.playerPhoto ? (
                <Image
                  src={s.playerPhoto}
                  alt=""
                  className="size-6 shrink-0 rounded-full object-cover"
                  width={24}
                  height={24}
                />
              ) : (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-[10px] font-bold text-text-tertiary">
                  {s.playerName.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-text-primary">{s.playerName}</p>
                <div className="flex items-center gap-1">
                  {s.teamLogo && (
                    <TeamLogo src={s.teamLogo} size={12} className="size-3 object-contain" />
                  )}
                  <span className="truncate text-[10px] text-text-tertiary">{s.teamName}</span>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-text-primary">
                {s.goals}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-xs text-text-tertiary">&mdash;</p>
      )}

      {/* View full */}
      <div className="border-t border-border-subtle">
        <Link
          href={viewAllHref}
          className="flex items-center px-4 py-2.5 text-xs font-medium text-accent-green transition-colors hover:bg-bg-surface-2"
        >
          {tab === 'table' ? labels.viewFullStandings : labels.topScorers} &rarr;
        </Link>
      </div>
    </div>
  );
}
