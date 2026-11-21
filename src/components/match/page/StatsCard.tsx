'use client';

import { useTranslations } from 'next-intl';
import { statGroups } from '@/lib/match/match-view';
import { Card, CardTitle } from './Card';
import { StatBarRow, StatPlainRow, TeamBadge } from './shared';
import { useMatchData } from './useMatchData';
import type { MatchView } from './types';

const GROUP_KEY = {
  attack: 'groupAttack',
  passing: 'groupPassing',
} as const;

/**
 * Stats tab, as in the mockup: Attack (split bars) and Passing. Full-match figures only (no
 * per-half stats are stored, so no "1st half" toggle). Nothing renders without data.
 */
export function StatsCard({ view }: { view: MatchView }) {
  const t = useTranslations('matchPage');
  const { teamStats } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const home = teamStats.find((s) => s.teamId === view.home.id);
  const away = teamStats.find((s) => s.teamId === view.away.id);
  const groups = home && away ? statGroups(home, away) : [];

  if (groups.length === 0) return null;
  return (
    <Card labelledBy="mp-stats" pad="md:px-[17.5px] md:pb-[13px] md:pt-[14px]">
      <CardTitle id="mp-stats" size="stats">
        {t('matchStatistics')}
      </CardTitle>
      <div className="mt-5 flex items-center justify-between gap-2 px-[3px] text-[17.5px] font-bold text-text-primary md:mt-[15.5px] md:px-[5px] md:text-xl">
        <span className="flex min-w-0 items-center gap-4">
          <TeamBadge team={view.home} size={45} className="max-md:!h-8 max-md:!w-8" />
          <span className="truncate">{view.home.name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-4">
          <span className="truncate">{view.away.name}</span>
          <TeamBadge team={view.away} size={45} className="max-md:!h-8 max-md:!w-8" />
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.id} className="mt-5 [&+&]:mt-5 md:mt-[11px] md:[&+&]:mt-[13px]">
          <h3 className="-mx-1.5 rounded-lg bg-[var(--mp-band)] px-2.5 py-1 text-[18.5px] font-bold leading-tight text-text-primary md:mx-0 md:px-[13.5px] md:py-[5px] md:text-[20.5px] md:leading-[1.2]">
            {t(GROUP_KEY[g.id])}
          </h3>
          <div className="mt-1.5 divide-y divide-border-subtle px-2 md:mt-[5px] md:px-[18px]">
            {g.rows.map((r) =>
              r.bar ? (
                <StatBarRow
                  key={r.key}
                  row={r}
                  label={t(r.key)}
                  srLabel={t('statsBarLabel', {
                    label: t(r.key),
                    home: view.home.name,
                    homeValue: r.homeText,
                    away: view.away.name,
                    awayValue: r.awayText,
                  })}
                />
              ) : (
                <StatPlainRow key={r.key} row={r} label={t(r.key)} />
              ),
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
