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
    <Card labelledBy="mp-key-stats" pad="pb-1 pt-1 md:px-[18px] md:pb-4 md:pt-[9px]">
      <CardTitle id="mp-key-stats" size="md">
        {t('keyStats')}
      </CardTitle>
      <div className="mt-[3px] flex items-center justify-between gap-2 text-[15px] font-bold md:mt-[11px] md:text-[16.5px] md:leading-tight">
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
      <div className="mt-1 md:mt-[8.5px]">
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
    <Card labelledBy="mp-key-moments" pad="pb-1 pt-1 md:px-[18px] md:pb-4 md:pt-[9px]">
      <CardTitle id="mp-key-moments">{t('keyMoments')}</CardTitle>
      <ol className="mt-[3px] divide-y divide-border-subtle md:mt-[13px]">
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
    <li className="flex items-center gap-2 py-[5px] md:gap-6 md:py-3 md:pe-4">
      <span className="w-[34px] shrink-0 text-start text-sm font-bold tabular-nums text-text-primary md:w-12 md:text-end md:text-[22px]">
        {minuteLabel(event)}
      </span>
      <span aria-hidden className="h-6 w-px shrink-0 bg-border-subtle max-md:hidden" />
      <span className="flex w-3.5 shrink-0 justify-center md:w-[22px]">
        <EventIcon kind={k} large />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-text-primary md:text-xl md:leading-[1.2]">
          <span className="md:font-bold">{t(k === 'other' ? 'goal' : k)}</span>
          {player && ` · ${player}`}
        </span>
        {/* Second line: "Assist: …" when there is one; on desktop the team otherwise. Mobile
            shows the team next to the crest instead (as in the mockup). */}
        {assistLine ? (
          <span className="block truncate text-xs text-text-secondary md:text-[17px] md:leading-[1.2]">
            {assistLine}
          </span>
        ) : (
          <span className="block truncate text-[13px] text-text-secondary max-md:hidden md:text-[17px] md:leading-[1.2]">
            {team.name}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <TeamBadge team={team} size={36} className="max-md:!h-[22px] max-md:!w-[22px]" />
        <span className="max-w-[6.5rem] truncate text-[13px] text-text-primary md:hidden">
          {team.name}
        </span>
      </span>
    </li>
  );
}
