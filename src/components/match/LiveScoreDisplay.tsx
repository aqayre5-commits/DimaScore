'use client';

import { useTranslations } from 'next-intl';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import type { Locale } from '@/lib/i18n/config';

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_CODES = new Set(['FT', 'AET', 'PEN']);
const INTERRUPTED_CODES = new Set(['SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO']);

type RenderState = 'upcoming' | 'live' | 'finished' | 'interrupted';

function getRenderState(statusCode: string): RenderState {
  if (LIVE_CODES.has(statusCode)) return 'live';
  if (FINISHED_CODES.has(statusCode)) return 'finished';
  if (INTERRUPTED_CODES.has(statusCode)) return 'interrupted';
  return 'upcoming';
}

const INTERRUPTED_LABEL_KEY: Record<string, string> = {
  SUSP: 'suspended',
  INT: 'interrupted',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'abandoned',
  AWD: 'awarded',
  WO: 'walkover',
};

interface LiveScoreDisplayProps {
  statusCode: string;
  homeScore: number | null;
  awayScore: number | null;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScoreEt: number | null;
  awayScoreEt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  minute: number | null;
  extraMinute: number | null;
  kickoffAt: string;
  locale: Locale;
}

export function LiveScoreDisplay({
  statusCode: serverStatus,
  homeScore: serverHome,
  awayScore: serverAway,
  homeScoreHt,
  awayScoreHt,
  homeScoreEt,
  awayScoreEt,
  homeScorePen,
  awayScorePen,
  minute: serverMinute,
  extraMinute: serverExtra,
  kickoffAt,
  locale,
}: LiveScoreDisplayProps) {
  const t = useTranslations('matchDetail');
  const live = useLiveMatch();

  // Use live data if available, fall back to server-rendered props
  const statusCode = live?.statusCode ?? serverStatus;
  const homeScore = live?.homeScore ?? serverHome;
  const awayScore = live?.awayScore ?? serverAway;
  const minute = live?.minute ?? serverMinute;
  const extraMinute = live?.extraMinute ?? serverExtra;
  const scoreFlash = live?.scoreFlash ?? false;

  const state = getRenderState(statusCode);
  const kickoff = new Date(kickoffAt);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      {state === 'upcoming' && (
        <>
          <p className="text-2xl font-bold tabular-nums text-text-tertiary">&ndash;</p>
          <p
            className="text-sm font-semibold tabular-nums text-text-primary"
            suppressHydrationWarning
          >
            {formatMatchTime(kickoff, locale)}
          </p>
          <p className="text-xs text-text-secondary" suppressHydrationWarning>
            {formatMatchDate(kickoff, locale, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </>
      )}

      {state === 'live' && (
        <>
          <p
            className={`text-3xl font-bold tabular-nums text-text-primary transition-all duration-500 ${
              scoreFlash ? 'scale-125 text-accent-emerald' : ''
            }`}
          >
            {homeScore ?? 0} &ndash; {awayScore ?? 0}
          </p>
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-score-live opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-score-live" />
            </span>
            <span className="text-xs font-bold text-score-live">
              {statusCode === 'HT'
                ? t('halfTime')
                : minute != null
                  ? `${minute}'${extraMinute ? `+${extraMinute}` : ''}`
                  : statusCode}
            </span>
          </span>
        </>
      )}

      {state === 'finished' && (
        <>
          <p className="text-3xl font-bold tabular-nums text-text-primary">
            {homeScore ?? 0} &ndash; {awayScore ?? 0}
          </p>
          <span className="text-xs font-medium text-text-tertiary">
            {statusCode === 'AET'
              ? t('extraTime')
              : statusCode === 'PEN'
                ? t('penalties')
                : t('fullTime')}
          </span>
          <ScoreBreakdown
            statusCode={statusCode}
            homeScoreHt={homeScoreHt}
            awayScoreHt={awayScoreHt}
            homeScoreEt={homeScoreEt}
            awayScoreEt={awayScoreEt}
            homeScorePen={homeScorePen}
            awayScorePen={awayScorePen}
            t={t}
          />
        </>
      )}

      {state === 'interrupted' && (
        <>
          {homeScore != null && awayScore != null ? (
            <p className="text-3xl font-bold tabular-nums text-text-primary">
              {homeScore} &ndash; {awayScore}
            </p>
          ) : (
            <p className="text-2xl font-bold tabular-nums text-text-tertiary">&ndash;</p>
          )}
          <span className="text-xs font-medium text-status-warning">
            {t(INTERRUPTED_LABEL_KEY[statusCode] as never)}
          </span>
        </>
      )}
    </div>
  );
}

function ScoreBreakdown({
  statusCode,
  homeScoreHt,
  awayScoreHt,
  homeScoreEt,
  awayScoreEt,
  homeScorePen,
  awayScorePen,
  t,
}: {
  statusCode: string;
  homeScoreHt: number | null;
  awayScoreHt: number | null;
  homeScoreEt: number | null;
  awayScoreEt: number | null;
  homeScorePen: number | null;
  awayScorePen: number | null;
  t: ReturnType<typeof useTranslations>;
}) {
  const parts: string[] = [];

  if (homeScoreHt != null && awayScoreHt != null) {
    parts.push(`${t('halfTime')} ${homeScoreHt}-${awayScoreHt}`);
  }

  if (statusCode === 'AET' && homeScoreEt != null && awayScoreEt != null) {
    parts.push(`${t('extraTime')} ${homeScoreEt}-${awayScoreEt}`);
  }

  if (statusCode === 'PEN' && homeScorePen != null && awayScorePen != null) {
    parts.push(`${t('penalties')} ${homeScorePen}-${awayScorePen}`);
  }

  if (parts.length === 0) return null;

  return <p className="mt-0.5 text-xs tabular-nums text-text-tertiary">({parts.join(' · ')})</p>;
}
