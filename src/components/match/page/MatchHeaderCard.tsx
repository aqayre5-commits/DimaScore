'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/shared/Flag';
import { CompetitionLogo } from '@/components/shared/Logo';
import { LocalTime } from '@/components/shared/LocalTime';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { crestAlt, goalMarker } from '@/lib/i18n/feed-labels';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import {
  chronological,
  eventKind,
  isGoalKind,
  isShootout,
  minuteLabel,
} from '@/lib/match/match-view';
import type { MatchEvent } from '@/lib/db/queries/match-detail';
import { BallIcon } from './icons';
import { useMatchData } from './useMatchData';
import type { MatchView, TeamView } from './types';

const LIVE = new Set<string>(LIVE_CODES_ARRAY);
const FINISHED = new Set(['FT', 'AET', 'PEN']);
const INTERRUPTED: Record<string, string> = {
  SUSP: 'suspended',
  INT: 'interrupted',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'abandoned',
  AWD: 'awarded',
  WO: 'walkover',
};

export interface HeaderStrip {
  competitionName: string;
  competitionHref: string | null;
  competitionLogo: string | null;
  /** "Matchweek 11" / round name; null when unknown. */
  roundLabel: string | null;
  /** Long date in the page language (site zone). */
  dateLabel: string;
  venueLabel: string | null;
}

export function MatchHeaderCard({ view, strip }: { view: MatchView; strip: HeaderStrip }) {
  const t = useTranslations('matchPage');
  const tD = useTranslations('matchDetail');
  const live = useLiveMatch();
  const { events } = useMatchData(view.matchId, view.coverage, view.isUpcoming);

  const statusCode = live?.statusCode ?? view.statusCode;
  const homeScore = live?.homeScore ?? view.homeScore;
  const awayScore = live?.awayScore ?? view.awayScore;
  const minute = live?.minute ?? view.minute;
  const extra = live?.extraMinute ?? view.extraMinute;
  const isLive = LIVE.has(statusCode);
  const isFinished = FINISHED.has(statusCode);
  const interrupted = INTERRUPTED[statusCode];
  const showScore = (isLive || isFinished || interrupted) && homeScore != null && awayScore != null;

  const pill = (() => {
    if (statusCode === 'HT') return { text: t('statusHalfTime'), live: false };
    if (isLive)
      return {
        text: minute != null ? `${minute}${extra ? `+${extra}` : ''}′` : t('statusLive'),
        live: true,
      };
    if (statusCode === 'AET') return { text: t('statusAfterExtraTime'), live: false };
    if (statusCode === 'PEN') return { text: t('statusAfterPenalties'), live: false };
    if (isFinished) return { text: t('statusFullTime'), live: false };
    if (interrupted) return { text: tD(interrupted as never), live: false };
    return { text: t('statusUpcoming'), live: false };
  })();

  const goals = chronological(events).filter((e) => isGoalKind(eventKind(e)) && !isShootout(e));
  const scorers = (teamId: number) => goals.filter((g) => g.teamId === teamId);

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-surface shadow-[0_1px_2px_rgba(15,26,36,0.04)]">
      {/* Strip: competition | matchweek | date | venue */}
      {/* Mobile: competition | round on line 1, date | venue on line 2 (one line, the venue
          truncates). Desktop: one row. Dividers only ever sit between two items. */}
      <div className="flex flex-col gap-1 border-b border-border-subtle px-4 py-3 text-xs text-text-secondary md:flex-row md:items-center md:gap-3 md:border-b-0 md:px-6 md:pb-0 md:pt-4 md:text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-2 font-bold text-text-primary">
            <CompetitionLogo src={strip.competitionLogo} size={20} />
            {strip.competitionHref ? (
              <Link href={strip.competitionHref} prefetch={false} className="hover:underline">
                {strip.competitionName}
              </Link>
            ) : (
              strip.competitionName
            )}
          </span>
          {strip.roundLabel && (
            <>
              <StripDivider />
              <span className="min-w-0 truncate">{strip.roundLabel}</span>
            </>
          )}
        </div>
        <StripDivider className="max-md:hidden" />
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 whitespace-nowrap">{strip.dateLabel}</span>
          {strip.venueLabel && (
            <>
              <StripDivider />
              <span className="min-w-0 truncate">{strip.venueLabel}</span>
            </>
          )}
        </div>
      </div>

      {/* Teams and score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-2 px-3 py-5 md:items-center md:gap-6 md:px-8 md:py-7">
        <TeamSide team={view.home} goals={scorers(view.home.id)} side="home" locale={view.locale} />

        <div className="flex flex-col items-center gap-2 self-center md:border-x md:border-border-subtle md:px-8">
          {showScore ? (
            <p
              className="flex items-center gap-2 text-[44px] font-black leading-none tabular-nums text-text-primary md:gap-3 md:text-[60px]"
              suppressHydrationWarning
            >
              <span>{homeScore}</span>
              <span aria-hidden className="font-bold">
                –
              </span>
              <span>{awayScore}</span>
            </p>
          ) : (
            <p className="text-[32px] font-black leading-none tabular-nums text-text-primary md:text-[44px]">
              <LocalTime date={view.kickoffAt} locale={view.locale} format="time" />
            </p>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold md:text-sm ${
              pill.live
                ? 'bg-score-live-bg text-score-live'
                : 'bg-[var(--mp-pill-bg)] text-[var(--mp-pill-fg)]'
            }`}
            suppressHydrationWarning
          >
            {pill.live && (
              <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-score-live" />
            )}
            {pill.text}
          </span>
          {statusCode === 'PEN' && view.homeScorePen != null && view.awayScorePen != null && (
            <span className="text-xs text-text-secondary">
              {t('penaltiesScore', { score: `${view.homeScorePen}–${view.awayScorePen}` })}
            </span>
          )}
        </div>

        <TeamSide team={view.away} goals={scorers(view.away.id)} side="away" locale={view.locale} />
      </div>
    </div>
  );
}

function StripDivider({ className = '' }: { className?: string }) {
  return <span aria-hidden className={`h-4 w-px shrink-0 bg-border-subtle ${className}`} />;
}

function TeamSide({
  team,
  goals,
  side,
  locale,
}: {
  team: TeamView;
  goals: MatchEvent[];
  side: 'home' | 'away';
  locale: string;
}) {
  const crest = (
    <Flag
      countryCode={team.countryCode}
      logoUrl={team.logoUrl}
      isNational={team.isNational}
      size={88}
      label={team.name}
      alt={crestAlt(team.name, locale, !!team.isNational)}
      className="max-md:!h-14 max-md:!w-14"
    />
  );
  const name = (
    <span className="text-[15px] font-bold leading-tight text-text-primary md:text-[26px]">
      {team.name}
    </span>
  );
  // Desktop: crest on the outside, name towards the score. Mobile: crest above the name.
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 text-center md:flex-row md:gap-5 md:text-start ${
        side === 'away' ? 'md:justify-between' : ''
      }`}
    >
      {team.href ? (
        <Link
          href={team.href}
          prefetch={false}
          className={`shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-accent-green ${
            side === 'away' ? 'md:order-last' : ''
          }`}
          tabIndex={-1}
          aria-hidden
        >
          {crest}
        </Link>
      ) : (
        <span className={`shrink-0 ${side === 'away' ? 'md:order-last' : ''}`}>{crest}</span>
      )}
      <div className="flex min-w-0 flex-col items-center gap-1.5 md:items-start">
        {team.href ? (
          <Link href={team.href} prefetch={false} className="hover:underline">
            {name}
          </Link>
        ) : (
          name
        )}
        {goals.length > 0 && (
          <ul className="flex flex-col gap-0.5 text-xs text-text-secondary md:text-sm">
            {goals.map((g) => {
              const k = eventKind(g);
              const player = g.player?.name?.[locale] ?? g.player?.name?.en ?? '—';
              return (
                <li
                  key={g.id}
                  className={`flex items-center gap-1.5 ${side === 'home' ? 'md:justify-start' : 'md:justify-end'} justify-center`}
                >
                  <BallIcon className="size-3.5 text-text-primary" />
                  <span>
                    {player} {minuteLabel(g)}
                    {k === 'penaltyGoal' && ` ${goalMarker('penalty', locale)}`}
                    {k === 'ownGoal' && ` ${goalMarker('ownGoal', locale)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
