import { cn } from '@/lib/utils';

// ── Shared bracket types (re-exported for sibling components) ──────────────

export type KnockoutPhase = 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';
export type BracketSide = 'left' | 'right' | 'center';

export interface BracketMatch {
  matchId: string;
  phase: KnockoutPhase;
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
  homeScore?: number | null;
  awayScore?: number | null;
  status: 'upcoming' | 'live' | 'finished' | 'placeholder';
  statusLabel?: string;
  feedsInto?: string;
  side: BracketSide;
  venue?: string | null;
  date?: string | null;
  roundLabel: string;
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
      className={cn(
        'w-[140px] rounded-lg border border-border-subtle bg-bg-surface p-2',
        className,
      )}
    >
      {/* Header: round · match number · date */}
      <p className="mb-1 truncate text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
        {match.roundLabel} · M{match.matchNumber}
        {match.date && ` · ${match.date}`}
      </p>

      {/* Teams */}
      <div className="space-y-px">
        <div className="flex items-center justify-between gap-1 text-xs">
          <span className="truncate text-text-secondary">{match.homeLabel}</span>
          {showScores && (
            <span className="shrink-0 font-semibold tabular-nums text-text-primary">
              {match.homeScore ?? '–'}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 text-xs">
          <span className="truncate text-text-secondary">{match.awayLabel}</span>
          {showScores && (
            <span className="shrink-0 font-semibold tabular-nums text-text-primary">
              {match.awayScore ?? '–'}
            </span>
          )}
        </div>
      </div>

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
