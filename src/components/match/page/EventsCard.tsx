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
    <span className="flex shrink-0 items-center gap-1 rounded-md bg-bg-surface px-2 py-0.5 text-xs font-bold tabular-nums md:gap-1.5 md:rounded-lg md:px-3 md:py-1 md:text-sm text-text-primary ring-1 ring-border-subtle">
      <span>{h}</span>
      <span aria-hidden>–</span>
      <span>{a}</span>
    </span>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <li
      className="flex items-center gap-3 py-3"
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <span aria-hidden className="h-px flex-1 bg-border-subtle" />
      <span className="rounded-full border border-border-subtle bg-bg-surface-2 px-3 py-1 text-xs font-semibold text-text-primary md:px-5 md:text-sm">
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
    <Card labelledBy="mp-events">
      <CardTitle id="mp-events">{t('matchEvents')}</CardTitle>
      <div role="group" aria-label={t('filterLabel')} className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-lg border px-3.5 py-1 text-[13px] font-semibold md:px-5 md:py-1.5 md:text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-green ${
              filter === f
                ? 'border-accent-green bg-accent-green text-[var(--mp-on-accent)]'
                : 'border-border-strong bg-bg-surface text-text-primary hover:border-accent-green'
            }`}
          >
            {t(FILTER_KEY[f])}
          </button>
        ))}
      </div>

      <ol className="relative mt-4">
        {secondHalf.map(row)}
        {showHt && (
          <Divider>
            {htScore ? t('halfTimeScore', { score: htScore }) : t('statusHalfTime')}
          </Divider>
        )}
        {firstHalf.map(row)}
        <li className="flex items-center gap-2 px-1 py-2.5 md:gap-4 md:px-4 md:py-3">
          <span className="w-11 shrink-0 md:w-14" />
          <span
            aria-hidden
            className="relative flex w-4 items-center justify-center self-stretch before:absolute before:-top-3 before:bottom-1/2 before:start-1/2 before:w-px before:bg-border-subtle"
          >
            <span className="relative size-3.5 rounded-full border-2 border-accent-green bg-bg-surface" />
          </span>
          <span className="text-sm font-bold text-text-primary md:text-[17px]">{t('kickOff')}</span>
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
      className={`flex items-center gap-2 border-b border-border-subtle px-1 py-2.5 md:gap-4 md:px-4 md:py-3 ${goal ? 'rounded-xl border-transparent bg-[var(--mp-goal-bg)]' : ''}`}
    >
      <span className="w-11 shrink-0 text-end text-sm font-bold tabular-nums text-text-primary md:w-14 md:text-[17px]">
        {minuteLabel(event)}
      </span>
      <span
        aria-hidden
        className="relative flex w-4 items-center justify-center self-stretch before:absolute before:-inset-y-3 before:start-1/2 before:w-px before:bg-border-subtle"
      >
        <span className="relative size-2 rounded-full bg-text-tertiary" />
      </span>
      <EventIcon kind={k} accentGoal />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-text-primary md:text-[17px]">
          {t(k === 'other' ? 'goal' : k)}
          {player && ` · ${player}`}
        </span>
        <span className="block truncate text-xs text-text-secondary md:text-sm">{second}</span>
      </span>
      {goal && score && <ScoreChip h={score[0]} a={score[1]} />}
      <TeamBadge team={team} size={26} className="max-md:!h-[22px] max-md:!w-[22px]" />
    </li>
  );
}
