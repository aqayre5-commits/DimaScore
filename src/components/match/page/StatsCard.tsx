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
    <Card labelledBy="mp-stats">
      <CardTitle id="mp-stats">{t('matchStatistics')}</CardTitle>
      <div className="mt-5 flex items-center justify-between gap-2 text-sm font-bold text-text-primary md:text-lg">
        <span className="flex min-w-0 items-center gap-2">
          <TeamBadge team={view.home} size={30} />
          <span className="truncate">{view.home.name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{view.away.name}</span>
          <TeamBadge team={view.away} size={30} />
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.id} className="mt-4">
          <h3 className="rounded-lg bg-[var(--mp-band)] px-4 py-2 text-sm font-bold text-text-primary">
            {t(GROUP_KEY[g.id])}
          </h3>
          <div className="divide-y divide-border-subtle px-1">
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
