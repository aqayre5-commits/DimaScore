'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Flag } from '@/components/shared/Flag';
import { LocalTime } from '@/components/shared/LocalTime';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { goalMarker } from '@/lib/i18n/feed-labels';
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

const CENTRE =
  'flex items-center justify-center gap-2 self-stretch max-md:[&>*]:-translate-y-1.5 md:h-[78px] md:w-[267px] md:self-center md:[&>*]:-translate-y-4 text-[43px] font-extrabold leading-none tabular-nums text-text-primary md:gap-7 md:text-[83px]';

export interface HeaderStrip {
  /** In the h1 (sr-only suffix), so its text equals the server's matchH1. */
  competitionName: string;
  /** "0–1" once the server has the match finished (the h1 shows it); null otherwise. */
  h1Score: string | null;
  /** The h1's fixture separator when there is no final score ("vs" / "–" / "ضد"). */
  vsWord: string;
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
    if (statusCode === 'HT') return { text: t('statusHalfTime') };
    if (isLive)
      return { text: minute != null ? `${minute}${extra ? `+${extra}` : ''}′` : t('statusLive') };
    if (statusCode === 'AET') return { text: t('statusAfterExtraTime') };
    if (statusCode === 'PEN') return { text: t('statusAfterPenalties') };
    if (isFinished) return { text: t('statusFullTime') };
    if (interrupted) return { text: tD(interrupted as never) };
    return { text: t('statusUpcoming') };
  })();

  const goals = chronological(events).filter((e) => isGoalKind(eventKind(e)) && !isShootout(e));
  const scorers = (teamId: number) => goals.filter((g) => g.teamId === teamId);

  return (
    <div className="border-b border-border-subtle bg-bg-surface max-md:-mx-2 md:rounded-xl md:border md:shadow-[0_1px_2px_rgba(15,26,36,0.04)]">
      {/* No competition/date/venue strip (removed at Abdilahi's request, 21 Nov): the
          Overview "Match details" card shows competition, matchweek, date and venue. */}
      {/* Teams and score. The first row is the page's single h1, and its text is exactly the
          server's matchH1: "Home 0–1 Away — Competition" once finished, "Home vs Away —
          Competition" before and during play (as in the <title>). The live score or kick-off
          time then sits over the h1's centre cell, outside the h1, so live updates never change
          the heading. The h1 shares the columns of the row below (scorers | status | scorers)
          through subgrid, so the layout is unchanged. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-x-2 px-3 pb-4 pt-4 md:gap-x-[39px] md:px-24 md:pb-7 md:pt-9">
        <h1 className="col-span-3 col-start-1 row-start-1 grid grid-cols-subgrid items-center">
          <TeamHead team={view.home} side="home" />{' '}
          <span className={`${CENTRE} md:border-x md:border-border-subtle`}>
            {strip.h1Score ? (
              <>
                <span>{strip.h1Score.split('–')[0]}</span>
                <span className="text-[0.6em] font-semibold">–</span>
                <span>{strip.h1Score.split('–')[1]}</span>
              </>
            ) : (
              <span className="sr-only">{strip.vsWord}</span>
            )}
          </span>{' '}
          <TeamHead team={view.away} side="away" />
          <span className="sr-only"> — {strip.competitionName}</span>
        </h1>
        {!strip.h1Score && (
          <span className={`${CENTRE} col-start-2 row-start-1`} suppressHydrationWarning>
            {showScore ? (
              <>
                <span>{homeScore}</span>
                <span className="text-[0.6em] font-semibold">–</span>
                <span>{awayScore}</span>
              </>
            ) : (
              <span className="text-[32px] md:text-[44px]">
                <LocalTime date={view.kickoffAt} locale={view.locale} format="time" />
              </span>
            )}
          </span>
        )}

        <Scorers goals={scorers(view.home.id)} side="home" locale={view.locale} />
        <div className="-mt-[22px] flex flex-col items-center gap-2 md:-mt-[27px]">
          <span
            className="inline-flex items-center rounded-lg bg-[var(--mp-pill-bg)] px-3.5 py-0.5 text-[13px] font-semibold text-[var(--mp-pill-fg)] md:px-[25px] md:py-[3px] md:text-[20.5px] md:leading-tight"
            suppressHydrationWarning
          >
            {pill.text}
          </span>
          {statusCode === 'PEN' && view.homeScorePen != null && view.awayScorePen != null && (
            <span className="text-xs text-text-secondary">
              {t('penaltiesScore', { score: `${view.homeScorePen}–${view.awayScorePen}` })}
            </span>
          )}
        </div>
        <Scorers goals={scorers(view.away.id)} side="away" locale={view.locale} />
      </div>
    </div>
  );
}

/** Crest + name, inside the h1. Desktop: crest on the outside edge; mobile: crest above. */
function TeamHead({ team, side }: { team: TeamView; side: 'home' | 'away' }) {
  const crest = (
    <Flag
      countryCode={team.countryCode}
      logoUrl={team.logoUrl}
      isNational={team.isNational}
      size={112}
      label={team.name}
      className="max-md:!h-[62px] max-md:!w-[62px]"
    />
  );
  const name = (
    <span className="text-[17px] font-bold leading-tight text-text-primary md:-translate-y-[31px] md:text-[36px]">
      {team.name}
    </span>
  );
  return (
    <span
      className={`flex min-w-0 flex-col items-center gap-1 text-center md:flex-row md:gap-6 md:text-start ${
        side === 'away' ? 'md:justify-between' : ''
      }`}
    >
      {team.href ? (
        <Link
          href={team.href}
          prefetch={false}
          className={`shrink-0 rounded-md ${side === 'away' ? 'md:order-last' : ''}`}
          tabIndex={-1}
          aria-hidden
        >
          {crest}
        </Link>
      ) : (
        <span className={`shrink-0 ${side === 'away' ? 'md:order-last' : ''}`}>{crest}</span>
      )}
      {team.href ? (
        <Link href={team.href} prefetch={false} className="min-w-0 hover:underline">
          {name}
        </Link>
      ) : (
        name
      )}
    </span>
  );
}

/** Goal scorers under a team (ball icon + "Name 16′"). On desktop the home list lines up under
 *  the name, past the crest. */
function Scorers({
  goals,
  side,
  locale,
}: {
  goals: MatchEvent[];
  side: 'home' | 'away';
  locale: string;
}) {
  if (goals.length === 0) return <span />;
  return (
    <ul
      className={`flex min-w-0 flex-col items-center gap-0.5 pt-0.5 text-xs text-text-primary md:-mt-[38px] md:items-start md:pt-0 md:text-[21px] ${
        side === 'home' ? 'md:ps-[136px]' : ''
      }`}
    >
      {goals.map((g) => {
        const k = eventKind(g);
        const player = g.player?.name?.[locale] ?? g.player?.name?.en ?? '—';
        return (
          <li key={g.id} className="flex items-center gap-1.5 md:gap-2">
            <BallIcon className="size-[13.2px] text-text-primary md:size-[18.54px]" />
            <span>
              {player} {minuteLabel(g)}
              {k === 'penaltyGoal' && ` ${goalMarker('penalty', locale)}`}
              {k === 'ownGoal' && ` ${goalMarker('ownGoal', locale)}`}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
