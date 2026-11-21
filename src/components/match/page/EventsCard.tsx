'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import {
  chronological,
  eventGroup,
  eventKind,
  isGoalKind,
  minuteLabel,
  runningScores,
  type EventFilter,
} from '@/lib/match/match-view';
import type { MatchEvent } from '@/lib/db/queries/match-detail';
import { Card, CardTitle } from './Card';
import { EventIcon } from './icons';
import { TeamBadge } from './shared';
import { useMatchData } from './useMatchData';
import type { MatchView } from './types';

const FILTERS: EventFilter[] = ['all', 'goals', 'cards', 'subs'];
const FILTER_KEY = {
  all: 'filterAll',
  goals: 'filterGoals',
  cards: 'filterCards',
  subs: 'filterSubs',
} as const;
const SECOND_HALF_CODES = new Set(['2H', 'ET', 'BT', 'P', 'FT', 'AET', 'PEN']);

function ScoreChip({ h, a }: { h: number; a: number }) {
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-md bg-bg-surface px-2 py-0.5 text-base font-bold tabular-nums md:gap-1.5 md:rounded-lg md:px-[14px] md:py-[3px] md:text-xl md:leading-[25px] text-text-primary ring-1 ring-border-subtle">
      <span>{h}</span>
      <span aria-hidden>–</span>
      <span>{a}</span>
    </span>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="flex items-center gap-3 py-3 md:pb-3 md:pt-[19px]"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <span aria-hidden className="h-px flex-1 bg-border-subtle" />
      <span className="rounded-full border border-border-subtle bg-bg-surface-2 px-6 py-1 text-[17px] font-semibold text-text-primary md:px-[29px] md:text-[20.5px] md:leading-6">
        {children}
      </span>
      <span aria-hidden className="h-px flex-1 bg-border-subtle" />
    </li>
  );
}

/**
 * Events tab: goals, cards and substitutions, newest first, with the Half-time marker and the
 * kick-off at the end. The chips filter on the client; every row stays in the HTML (hidden).
 */
export function EventsCard({ view }: { view: MatchView }) {
  const t = useTranslations('matchPage');
  const live = useLiveMatch();
  const { events } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const [filter, setFilter] = useState<EventFilter>('all');
  const statusCode = live?.statusCode ?? view.statusCode;

  // Goals, cards and substitutions only (the mockup's chips); VAR and other feed rows are left out.
  const shown = events.filter((e) => eventGroup(eventKind(e)) != null);
  if (shown.length === 0) return null;

  const scores = runningScores(events, view.home.id);
  const ordered = chronological(shown).reverse();
  const firstHalf = ordered.filter((e) => e.minute <= 45);
  const secondHalf = ordered.filter((e) => e.minute > 45);
  const htScore =
    view.homeScoreHt != null && view.awayScoreHt != null
      ? `${view.homeScoreHt} – ${view.awayScoreHt}`
      : null;
  const showHt = statusCode === 'HT' || SECOND_HALF_CODES.has(statusCode);

  const row = (e: MatchEvent) => (
    <EventRow
      key={e.id}
      event={e}
      view={view}
      score={scores.get(e.id) ?? null}
      hidden={filter !== 'all' && eventGroup(eventKind(e)) !== filter}
    />
  );

  return (
    <Card labelledBy="mp-events" pad="md:px-7 md:pb-3 md:pt-[11px]">
      <CardTitle id="mp-events" size="events" className="max-md:ps-1">
        {t('matchEvents')}
      </CardTitle>
      <div
        role="group"
        aria-label={t('filterLabel')}
        className="mt-[17px] flex flex-wrap gap-3 max-md:ps-1.5 md:mt-[17.5px] md:gap-3.5"
      >
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-4 py-[3px] text-[16.5px] md:min-w-20 md:rounded-[10px] md:px-[21px] md:py-[5px] md:text-[19.5px] md:leading-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green ${
              filter === f
                ? 'border-accent-green bg-accent-green font-bold text-[var(--mp-on-accent)]'
                : 'border-border-strong bg-bg-surface font-medium text-text-primary hover:border-accent-green'
            }`}
          >
            {t(FILTER_KEY[f])}
          </button>
        ))}
      </div>

      <ol className="relative mt-[15px] md:mt-4">
        {secondHalf.map(row)}
        {showHt && (
          <Divider>
            {htScore ? t('halfTimeScore', { score: htScore }) : t('statusHalfTime')}
          </Divider>
        )}
        {firstHalf.map(row)}
        <li className="flex items-center gap-2 px-0.5 py-4 md:gap-0 md:px-0 md:py-[13px]">
          <span className="w-[34px] shrink-0 md:w-[55px]" />
          <span
            aria-hidden
            className="relative flex w-[9px] shrink-0 items-center justify-center self-stretch before:absolute before:-top-4 before:bottom-1/2 before:start-1/2 before:w-px before:bg-border-subtle md:ms-6 md:w-[22px] md:before:-top-[13px] md:before:w-0.5 md:before:-translate-x-1/2"
          >
            <span className="relative size-[15.5px] shrink-0 rounded-full border-2 border-accent-green bg-bg-surface md:size-[19.2px] md:border-[2.5px]" />
          </span>
          <span className="ms-3 text-lg font-bold text-text-primary md:ms-[21px] md:text-[21px] md:leading-[1.2]">
            {t('kickOff')}
          </span>
        </li>
      </ol>
    </Card>
  );
}

function EventRow({
  event,
  view,
  score,
  hidden,
}: {
  event: MatchEvent;
  view: MatchView;
  score: [number, number] | null;
  hidden: boolean;
}) {
  const t = useTranslations('matchPage');
  const k = eventKind(event);
  const team = event.teamId === view.home.id ? view.home : view.away;
  const player = event.player?.name?.[view.locale] ?? event.player?.name?.en ?? null;
  const other = event.assist?.name?.[view.locale] ?? event.assist?.name?.en ?? null;
  const goal = isGoalKind(k);
  const minute = minuteLabel(event);
  const second =
    k === 'substitution' && other
      ? t('replaces', { name: other })
      : (k === 'goal' || k === 'penaltyGoal') && other
        ? t('assist', { name: other })
        : k === 'var' && event.detail
          ? event.detail
          : team.name;
  return (
    <li
      hidden={hidden}
      className={`relative flex items-center gap-2 px-0.5 py-4 md:gap-0 md:py-[13px] md:pe-[27px] md:ps-0 ${goal ? 'rounded-xl bg-[var(--mp-goal-bg)]' : 'after:absolute after:bottom-0 after:end-0 after:start-[60px] after:h-px after:bg-border-subtle md:after:start-[102px]'}`}
    >
      <span
        className={`w-[34px] shrink-0 whitespace-nowrap text-start font-bold tabular-nums text-text-primary md:w-[55px] md:-translate-y-[5px] md:text-end ${
          minute.includes('+') ? 'text-[12px] md:text-[17px]' : 'text-lg md:text-[22.5px]'
        }`}
      >
        {minute}
      </span>
      <span
        aria-hidden
        className="relative flex w-[9px] shrink-0 items-center justify-center self-stretch before:absolute before:-inset-y-4 before:start-1/2 before:w-px before:bg-border-subtle md:ms-6 md:w-[22px] md:before:-inset-y-[13px] md:before:w-0.5 md:before:-translate-x-1/2"
      >
        <span className="relative size-[10.8px] shrink-0 rounded-full bg-text-tertiary md:size-[14.73px] md:-translate-y-1" />
      </span>
      <span className="-me-1 flex w-[33px] shrink-0 justify-center md:me-0 md:ms-[21px] md:w-[22px]">
        <EventIcon kind={k} accentGoal large="xl" />
      </span>
      <span className="min-w-0 flex-1 md:ms-[27px]">
        <span className="block truncate text-[17.5px] font-bold leading-[1.2] text-text-primary md:text-[21px]">
          {t(k === 'other' ? 'goal' : k)}
          {player && ` · ${player}`}
        </span>
        <span className="block truncate text-[14.5px] leading-[1.2] text-text-secondary md:text-[16.5px]">
          {second}
        </span>
      </span>
      {goal && score && (
        <span className="md:me-8">
          <ScoreChip h={score[0]} a={score[1]} />
        </span>
      )}
      <TeamBadge team={team} size={36} className="max-md:!h-[26px] max-md:!w-[26px]" />
    </li>
  );
}
