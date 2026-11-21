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
      <CardTitle id="mp-key-stats" size="md">
        {t('keyStats')}
      </CardTitle>
      <div className="mt-3 flex items-center justify-between gap-2 text-[15px] font-bold md:mt-2.5 md:text-sm">
        <span className="flex min-w-0 items-center gap-2 text-text-primary md:text-accent-green">
          <span className="md:hidden">
            <TeamBadge team={view.home} size={26} />
          </span>
          <span className="truncate">{view.home.name}</span>
        </span>
        <span className="flex min-w-0 items-center gap-2 text-text-primary md:text-text-secondary">
          <span className="truncate">{view.away.name}</span>
          <span className="md:hidden">
            <TeamBadge team={view.away} size={26} />
          </span>
        </span>
      </div>
      <div className="mt-1">
        {rows.map((r) => (
          <StatBarRow
            key={r.key}
            row={r}
            wide
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
      <ol className="mt-2 divide-y divide-border-subtle">
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
  const assistLine =
    (k === 'goal' || k === 'penaltyGoal') && assist ? t('assist', { name: assist }) : null;
  return (
    <li className="flex items-center gap-3 py-2.5 md:gap-4 md:py-3.5">
      <span className="w-9 shrink-0 text-end text-[15px] font-bold tabular-nums text-text-primary md:w-12 md:text-[19px]">
        {minuteLabel(event)}
      </span>
      <span aria-hidden className="h-8 w-px shrink-0 bg-border-subtle" />
      <EventIcon kind={k} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-text-primary md:text-[17px]">
          <span className="md:font-bold">{t(k === 'other' ? 'goal' : k)}</span>
          {player && ` · ${player}`}
        </span>
        {/* Second line: "Assist: …" when there is one; on desktop the team otherwise. Mobile
            shows the team next to the crest instead (as in the mockup). */}
        {assistLine ? (
          <span className="block truncate text-xs text-text-secondary md:text-[13px]">
            {assistLine}
          </span>
        ) : (
          <span className="block truncate text-[13px] text-text-secondary max-md:hidden">
            {team.name}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <TeamBadge team={team} size={28} className="max-md:!h-[22px] max-md:!w-[22px]" />
        <span className="max-w-[6.5rem] truncate text-[13px] text-text-primary md:hidden">
          {team.name}
        </span>
      </span>
    </li>
  );
}
