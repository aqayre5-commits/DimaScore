import Image from 'next/image';
import { Clock, Radio, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import type { BracketMatch } from './BracketMatchCell';
import type { Locale } from '@/lib/i18n/config';

/**
 * Knockout-bracket node — the 4-state match card. Left: two team rows (flag + 3-letter code +
 * score, with a reserved penalty slot so main scores stay aligned). Right: a state-tinted status
 * panel with an icon, a label (kickoff time / LIVE / FT / AET) and the date beneath:
 *   • upcoming → azure tint, clock, kickoff time
 *   • live     → red tint, live icon, LIVE (minute pending a data field)
 *   • finished → gray tint, check, FT / AET
 *   • shootout → green tint, check, FT (pens shown inline on the rows)
 * `w-full` so it fills the desktop tree column and the mobile slide. `data-match-id` kept for parity.
 */
export function BracketCardNode({ match, locale }: { match: BracketMatch; locale: Locale }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const showScore = isLive || isFinished;
  const hasPens = match.homeScorePen != null && match.awayScorePen != null;
  const isAet = match.statusCode === 'AET';
  const ftLabel = isAet ? 'AET' : 'FT';

  const kickoff = match.kickoffISO ? new Date(match.kickoffISO) : null;
  const timeStr = kickoff ? formatMatchTime(kickoff, locale) : '';
  const dateStr = kickoff
    ? formatMatchDate(kickoff, locale, { weekday: 'short', month: 'short', day: 'numeric' })
    : (match.date ?? '');

  const panelTint = isLive
    ? 'bg-score-live/[0.06]'
    : isFinished
      ? hasPens
        ? 'bg-accent-emerald/[0.08]'
        : 'bg-bg-surface-2'
      : 'bg-accent-azure/[0.06]';

  return (
    <div
      data-match-id={match.matchId}
      className="flex w-full items-stretch overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
    >
      {/* Teams + scores */}
      <div className="min-w-0 flex-1 divide-y divide-border-subtle/60">
        <NodeRow
          logoUrl={match.homeLogoUrl}
          code={match.homeLabel}
          score={match.homeScore}
          pen={match.homeScorePen}
          showScore={showScore}
          isLive={isLive}
        />
        <NodeRow
          logoUrl={match.awayLogoUrl}
          code={match.awayLabel}
          score={match.awayScore}
          pen={match.awayScorePen}
          showScore={showScore}
          isLive={isLive}
        />
      </div>

      {/* Status panel */}
      <div
        className={cn(
          'flex w-[92px] shrink-0 flex-col items-center justify-center gap-1 border-l border-border-subtle px-2 text-center',
          panelTint,
        )}
      >
        {isLive ? (
          <Radio className="size-5 animate-pulse text-score-live" strokeWidth={2.5} />
        ) : isFinished ? (
          <CircleCheck className="size-5 text-text-secondary" strokeWidth={2} />
        ) : (
          <Clock className="size-5 text-accent-azure" strokeWidth={2.5} />
        )}

        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            isLive ? 'text-score-live' : 'text-text-primary',
          )}
          suppressHydrationWarning
        >
          {isLive ? 'LIVE' : isFinished ? ftLabel : timeStr}
        </span>

        {dateStr && (
          <span className="text-[10px] leading-tight text-text-tertiary" suppressHydrationWarning>
            {dateStr}
          </span>
        )}
      </div>
    </div>
  );
}

function NodeRow({
  logoUrl,
  code,
  score,
  pen,
  showScore,
  isLive,
}: {
  logoUrl?: string | null;
  code: string;
  score?: number | null;
  pen?: number | null;
  showScore: boolean;
  isLive: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={36}
          height={24}
          className="h-6 w-9 shrink-0 rounded-[3px] border border-border-subtle/60 object-cover"
        />
      ) : (
        <span className="h-6 w-9 shrink-0 rounded-[3px] bg-bg-surface-2" />
      )}
      <span className="text-base font-bold tabular-nums text-text-primary">{code}</span>
      <span className="ml-auto flex items-baseline tabular-nums">
        <span
          className={cn(
            'w-6 text-right text-2xl font-bold',
            !showScore ? 'text-text-quaternary' : isLive ? 'text-score-live' : 'text-text-primary',
          )}
        >
          {showScore ? (score ?? '–') : '–'}
        </span>
        {/* Reserved penalty slot (kept even when empty) so main scores align across cards */}
        <span className="w-9 pl-1.5 text-left text-sm font-medium text-text-tertiary">
          {pen != null ? `(${pen})` : ''}
        </span>
      </span>
    </div>
  );
}
