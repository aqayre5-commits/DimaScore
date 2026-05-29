import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

// ── Shared bracket types (re-exported for sibling components) ──────────────

export type KnockoutPhase = 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';
export type BracketSide = 'left' | 'right' | 'center';

export interface BracketMatch {
  matchId: string;
  phase: KnockoutPhase;
  matchNumber: number;
  fifaMatchNumber?: number;
  homeLabel: string;
  awayLabel: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeLeg1Score?: number | null;
  homeLeg2Score?: number | null;
  awayLeg1Score?: number | null;
  awayLeg2Score?: number | null;
  homeLogoUrl?: string | null;
  awayLogoUrl?: string | null;
  status: 'upcoming' | 'live' | 'finished' | 'placeholder';
  statusLabel?: string;
  feedsInto?: string;
  loserFeedsInto?: string;
  side: BracketSide;
  venue?: string | null;
  date?: string | null;
  roundLabel: string;
  ariaLabel: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface BracketMatchCellProps {
  match: BracketMatch;
  className?: string;
}

/**
 * Single match cell for the knockout bracket.
 * Used by both DesktopBracket and MobileBracket.
 *
 * data-match-id enables BracketConnectors to query cell positions
 * for SVG connector lines without ref-drilling.
 *
 * Radix Tooltip shows the localized expanded form of the FIFA slot
 * codes on hover/focus (e.g. "Winner of M97 vs Winner of M98").
 */
export function BracketMatchCell({ match, className }: BracketMatchCellProps) {
  const showScores = match.status === 'finished' || match.status === 'live';

  const cell = (
    <div
      data-match-id={match.matchId}
      aria-label={match.ariaLabel}
      className={cn(
        'w-[160px] rounded-lg border border-border-subtle bg-bg-surface p-2 text-center',
        className,
      )}
    >
      {/* Teams + score */}
      {showScores ? (
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate font-medium text-text-primary">{match.homeLabel}</span>
          <span className="shrink-0 font-bold tabular-nums text-text-primary">
            {match.homeScore ?? '–'}–{match.awayScore ?? '–'}
          </span>
          <span className="truncate font-medium text-text-primary">{match.awayLabel}</span>
        </div>
      ) : (
        <div className="truncate text-xs">
          <span className="font-medium text-text-primary">{match.homeLabel}</span>
          <span className="mx-1 text-text-tertiary">vs</span>
          <span className="font-medium text-text-primary">{match.awayLabel}</span>
        </div>
      )}

      {/* Footer: status + venue (rendered only when data exists) */}
      {match.statusLabel && (
        <p className="mt-1 truncate text-xs text-text-tertiary">
          {match.statusLabel}
          {match.venue && ` · ${match.venue}`}
        </p>
      )}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{cell}</TooltipTrigger>
        <TooltipContent>{match.ariaLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
