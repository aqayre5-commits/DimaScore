import { Flag } from '@/components/shared/Flag';
import type { StatRow } from '@/lib/match/match-view';
import type { TeamView } from './types';

export function TeamBadge({ team, size = 20 }: { team: TeamView; size?: number }) {
  return (
    <Flag
      countryCode={team.countryCode}
      logoUrl={team.logoUrl}
      isNational={team.isNational}
      size={size}
      label={team.name}
    />
  );
}

/** Home value | label over a split bar | away value. Mirrors in RTL (home on the right). */
export function StatBarRow({
  row,
  label,
  srLabel,
}: {
  row: StatRow;
  label: string;
  srLabel: string;
}) {
  const homeLeads = row.home > row.away;
  const awayLeads = row.away > row.home;
  return (
    <div className="py-2.5">
      <div className="mb-1.5 grid grid-cols-[3.5rem_1fr_3.5rem] items-baseline text-sm">
        <span
          className={`tabular-nums ${homeLeads ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary'}`}
        >
          {row.homeText}
        </span>
        <span className="text-center text-[13px] text-text-secondary">{label}</span>
        <span
          className={`text-end tabular-nums ${awayLeads ? 'font-bold text-text-primary' : 'font-semibold text-text-secondary'}`}
        >
          {row.awayText}
        </span>
      </div>
      {row.bar && (
        <div
          role="img"
          aria-label={srLabel}
          className="flex h-2 gap-1 overflow-hidden rounded-full bg-[var(--mp-bar-track)]"
        >
          <span
            className="h-full rounded-full bg-accent-green"
            style={{ width: `${row.homeShare * 100}%` }}
          />
          <span className="h-full flex-1 rounded-full bg-[var(--mp-bar-away)]" />
        </div>
      )}
    </div>
  );
}

/** Home value | label | away value, no bar (Passing, Discipline). */
export function StatPlainRow({ row, label }: { row: StatRow; label: string }) {
  return (
    <div className="grid grid-cols-[4rem_1fr_4rem] items-baseline py-3 text-sm">
      <span className="font-bold tabular-nums text-text-primary">{row.homeText}</span>
      <span className="text-center text-text-secondary">{label}</span>
      <span className="text-end font-bold tabular-nums text-text-primary">{row.awayText}</span>
    </div>
  );
}
