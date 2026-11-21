'use client';

import { useTranslations } from 'next-intl';
import { PlayerRatingsPanel } from '@/components/match/PlayerRatingBadge';
import { statGroups } from '@/lib/match/match-view';
import { Card, CardTitle } from './Card';
import { StatBarRow, StatPlainRow, TeamBadge } from './shared';
import { useMatchData } from './useMatchData';
import type { MatchView } from './types';

const GROUP_KEY = {
  attack: 'groupAttack',
  passing: 'groupPassing',
  defence: 'groupDefence',
  discipline: 'groupDiscipline',
} as const;

/**
 * Stats tab: Attack (split bars), Passing, Defence, Discipline. Full-match figures only: the
 * feed is ingested without per-half stats, so there is no "1st half" toggle.
 */
export function StatsCard({ view }: { view: MatchView }) {
  const t = useTranslations('matchPage');
  const tD = useTranslations('matchDetail');
  const { teamStats, playerStats } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const home = teamStats.find((s) => s.teamId === view.home.id);
  const away = teamStats.find((s) => s.teamId === view.away.id);
  const groups = home && away ? statGroups(home, away) : [];

  return (
    <div className="space-y-4">
      <Card labelledBy="mp-stats">
        <CardTitle id="mp-stats">{t('matchStatistics')}</CardTitle>
        {groups.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">{t('noDataYet')}</p>
        ) : (
          <>
            <div className="mt-5 flex items-center justify-between gap-2 text-sm font-bold text-text-primary">
              <span className="flex min-w-0 items-center gap-2">
                <TeamBadge team={view.home} size={24} />
                <span className="truncate">{view.home.name}</span>
              </span>
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate">{view.away.name}</span>
                <TeamBadge team={view.away} size={24} />
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
          </>
        )}
      </Card>
      {playerStats.length > 0 && (
        <Card labelledBy="mp-ratings">
          <CardTitle id="mp-ratings">{tD('playerRatings')}</CardTitle>
          <div className="mt-3 -mx-4 md:-mx-6">
            <PlayerRatingsPanel
              playerStats={playerStats}
              homeTeamId={view.home.id}
              awayTeamId={view.away.id}
              homeTeamName={view.home.name}
              awayTeamName={view.away.name}
              locale={view.locale}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
