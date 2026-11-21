'use client';

import { useTranslations } from 'next-intl';
import { eventKind, keyMoments, keyStatRows, minuteLabel } from '@/lib/match/match-view';
import type { MatchEvent } from '@/lib/db/queries/match-detail';
import { Card, CardTitle } from './Card';
import { EventIcon } from './icons';
import { StatBarRow, TeamBadge } from './shared';
import { useMatchData } from './useMatchData';
import type { MatchView } from './types';

/** Overview › Key stats: xG (when the feed has it), shots, shots on target, possession. */
export function KeyStatsCard({ view }: { view: MatchView }) {
  const t = useTranslations('matchPage');
  const { teamStats } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const home = teamStats.find((s) => s.teamId === view.home.id);
  const away = teamStats.find((s) => s.teamId === view.away.id);
  const rows = home && away ? keyStatRows(home, away) : [];
  if (rows.length === 0) return null;
  return (
    <Card labelledBy="mp-key-stats">
      <CardTitle id="mp-key-stats">{t('keyStats')}</CardTitle>
      <div className="mt-4 flex items-center justify-between gap-2 border-b border-border-subtle pb-3 text-xs font-bold">
        <span className="flex min-w-0 items-center gap-2 text-accent-green">
          <TeamBadge team={view.home} size={20} />
          <span className="truncate">{view.home.name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2 text-text-secondary">
          <span className="truncate">{view.away.name}</span>
          <TeamBadge team={view.away} size={20} />
        </span>
      </div>
      <div className="divide-y divide-border-subtle">
        {rows.map((r) => (
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
        ))}
      </div>
    </Card>
  );
}

/** Overview › Key moments: goals, missed penalties and cards, newest first. */
export function KeyMomentsCard({ view }: { view: MatchView }) {
  const t = useTranslations('matchPage');
  const { events } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const moments = keyMoments(events);
  if (moments.length === 0) return null;
  return (
    <Card labelledBy="mp-key-moments">
      <CardTitle id="mp-key-moments">{t('keyMoments')}</CardTitle>
      <ol className="mt-3 divide-y divide-border-subtle">
        {moments.map((e) => (
          <MomentRow key={e.id} event={e} view={view} />
        ))}
      </ol>
    </Card>
  );
}

function MomentRow({ event, view }: { event: MatchEvent; view: MatchView }) {
  const t = useTranslations('matchPage');
  const k = eventKind(event);
  const team = event.teamId === view.home.id ? view.home : view.away;
  const player = event.player?.name?.[view.locale] ?? event.player?.name?.en ?? null;
  const assist = event.assist?.name?.[view.locale] ?? event.assist?.name?.en ?? null;
  const second =
    (k === 'goal' || k === 'penaltyGoal') && assist ? t('assist', { name: assist }) : team.name;
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="w-11 shrink-0 text-[15px] font-bold tabular-nums text-text-primary">
        {minuteLabel(event)}
      </span>
      <span aria-hidden className="h-8 w-px shrink-0 bg-border-subtle" />
      <EventIcon kind={k} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-text-primary">
          {t(k === 'other' ? 'goal' : k)}
          {player && ` · ${player}`}
        </span>
        <span className="block truncate text-xs text-text-secondary">{second}</span>
      </span>
      <TeamBadge team={team} size={22} />
    </li>
  );
}
