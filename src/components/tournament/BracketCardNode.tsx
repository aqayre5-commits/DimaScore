import Image from 'next/image';
import { cn } from '@/lib/utils';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import type { BracketMatch } from './BracketMatchCell';
import type { Locale } from '@/lib/i18n/config';

/**
 * Knockout-bracket node — the match card. Left: two team rows (flag + 3-letter code + score, with
 * a reserved penalty slot so main scores stay aligned). Right: a plain status panel (same card
 * background, no tint or icons) showing kickoff time (upcoming) / a pulsing LIVE dot (live) /
 * FT with a stacked PEN line on shootouts (finished) / the date (placeholder), with the date beneath.
 * Placeholder ties (WC pre-tournament: slot codes like 1A / 3ABCDF / W73, no team yet) render the
 * slot label as the "code", a TBD flag box, no score, and just the date in the panel.
 * Type scale: score + code are 16px (text-base); everything else is 12px (text-xs).
 * `w-full` so it fills the desktop tree column and the mobile slide. `data-match-id` kept for parity.
 */
export function BracketCardNode({ match, locale }: { match: BracketMatch; locale: Locale }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isPlaceholder = match.status === 'placeholder';
  const showScore = isLive || isFinished;
  const hasPens = match.homeScorePen != null && match.awayScorePen != null;
  // AET folded into FT per spec — all finished ties read FT; PEN still stacks beneath on shootouts.
  const ftLabel = 'FT';

  const kickoff = match.kickoffISO ? new Date(match.kickoffISO) : null;
  const timeStr = kickoff ? formatMatchTime(kickoff, locale) : '';
  const dateStr = kickoff
    ? formatMatchDate(kickoff, locale, { weekday: 'short', month: 'short', day: 'numeric' })
    : (match.date ?? '');

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

      {/* Status panel — plain, no tint or icons */}
      <div className="flex w-[92px] shrink-0 flex-col items-center justify-center gap-0.5 border-l border-border-subtle px-[5px] py-[2px] text-center">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-xs font-bold text-score-live">
            <span className="size-2 animate-pulse rounded-full bg-score-live" />
            {match.statusCode === 'HT' ? 'HT' : 'LIVE'}
          </span>
        ) : isFinished ? (
          <span className="leading-tight">
            <span className="block text-xs font-bold text-text-primary">{ftLabel}</span>
            {hasPens && (
              <span className="block text-xs font-semibold uppercase text-text-tertiary">PEN</span>
            )}
          </span>
        ) : isPlaceholder ? (
          <span className="text-xs font-medium text-text-tertiary">{match.statusLabel}</span>
        ) : (
          <span
            className="text-xs font-bold tabular-nums text-text-primary"
            suppressHydrationWarning
          >
            {timeStr}
          </span>
        )}

        {!isPlaceholder && dateStr && (
          <span className="text-xs leading-tight text-text-tertiary" suppressHydrationWarning>
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
    <div className="flex items-center gap-2.5 px-[5px] py-2.5">
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
      <span className="min-w-0 truncate text-base font-bold tabular-nums text-text-primary">
        {code}
      </span>
      <span className="ml-auto flex shrink-0 items-baseline tabular-nums">
        <span
          className={cn(
            'w-6 text-right text-base font-bold',
            !showScore ? 'text-text-quaternary' : isLive ? 'text-score-live' : 'text-text-primary',
          )}
        >
          {showScore ? (score ?? '–') : '–'}
        </span>
        {/* Reserved penalty slot (kept even when empty) so main scores align across cards */}
        <span className="w-9 pl-1.5 text-left text-xs font-medium text-text-tertiary">
          {pen != null ? `(${pen})` : ''}
        </span>
      </span>
    </div>
  );
}
