import { cn } from '@/lib/utils';

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
 */
export function BracketMatchCell({ match, className }: BracketMatchCellProps) {
  const showScores = match.status === 'finished' || match.status === 'live';

  return (
    <div
      data-match-id={match.matchId}
      aria-label={match.ariaLabel}
      title={match.ariaLabel}
      className={cn(
        'w-[160px] rounded-lg border border-border-subtle bg-bg-surface p-2 text-center',
        className,
      )}
    >
      {/* Header: match number */}
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
        M{match.fifaMatchNumber ?? match.matchNumber}
      </p>

      {/* Teams — horizontal layout */}
      {showScores ? (
        <div className="flex items-center gap-1 text-xs">
          <span className="truncate font-medium text-text-primary">{match.homeLabel}</span>
          <span className="shrink-0 font-semibold tabular-nums text-text-primary">
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
        <p className="mt-1 truncate text-[10px] text-text-tertiary">
          {match.statusLabel}
          {match.venue && ` · ${match.venue}`}
        </p>
      )}
    </div>
  );
}
