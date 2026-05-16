interface KnockoutMatchCellProps {
  matchNumber: number;
  homeLabel: string;
  awayLabel: string;
  roundLabel: string;
}

/**
 * Single knockout bracket match cell (pre-tournament placeholder).
 * Per competition-cup.md Section 7 Tab 3.
 * Shows placeholder team labels like "[1er Groupe A] vs [2ème Groupe B]".
 *
 * @deprecated Use BracketMatchCell instead. Retained for potential non-WC2026 bracket use.
 */
export function KnockoutMatchCell({
  matchNumber,
  homeLabel,
  awayLabel,
  roundLabel,
}: KnockoutMatchCellProps) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-3">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
        {roundLabel} &middot; Match {matchNumber}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{homeLabel}</span>
          <span className="text-xs text-text-tertiary">&ndash;</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{awayLabel}</span>
          <span className="text-xs text-text-tertiary">&ndash;</span>
        </div>
      </div>
    </div>
  );
}
