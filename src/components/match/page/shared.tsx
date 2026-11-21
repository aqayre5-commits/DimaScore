import { Flag } from '@/components/shared/Flag';
import type { StatRow } from '@/lib/match/match-view';
import type { TeamView } from './types';

export function TeamBadge({
  team,
  size = 20,
  className,
}: {
  team: TeamView;
  size?: number;
  className?: string;
}) {
  return (
    <Flag
      countryCode={team.countryCode}
      logoUrl={team.logoUrl}
      isNational={team.isNational}
      size={size}
      label={team.name}
      className={className}
    />
  );
}

/**
 * Home value | label over a split bar | away value. Mirrors in RTL (home on the right).
 * `wide` (Overview key stats): from md up the bar runs the full card width under the values.
 */
export function StatBarRow({
  row,
  label,
  srLabel,
  wide = false,
}: {
  row: StatRow;
  label: string;
  srLabel: string;
  wide?: boolean;
}) {
  const value = `font-bold tabular-nums text-text-primary ${
    wide
      ? 'self-end text-[15px] leading-tight md:text-base md:leading-normal'
      : 'row-span-2 self-center text-base md:text-[19px]'
  }`;
  return (
    <div
      className={`grid grid-cols-[3.5rem_1fr_3.5rem] gap-x-2 ${wide ? 'py-0.5 md:py-2' : 'py-2.5'} ${
        wide
          ? 'md:grid-cols-[4.5rem_1fr_4.5rem]'
          : 'md:grid-cols-[minmax(4.5rem,1fr)_minmax(0,38rem)_minmax(4.5rem,1fr)]'
      }`}
    >
      <span className={value}>{row.homeText}</span>
      <span
        className={`col-start-2 row-start-1 text-center text-[13px] text-text-primary ${wide ? 'leading-tight md:text-sm md:leading-normal' : 'md:text-[15px]'}`}
      >
        {label}
      </span>
      <span className={`${value} col-start-3 row-start-1 text-end`}>{row.awayText}</span>
      {row.bar && (
        <div
          role="img"
          aria-label={srLabel}
          className={`col-start-2 row-start-2 flex h-[7px] overflow-hidden rounded-full bg-[var(--mp-bar-track)] md:h-2 ${wide ? 'mt-1' : 'mt-1.5'} ${
            wide ? 'md:col-span-3 md:col-start-1' : ''
          }`}
        >
          <span className="h-full bg-accent-green" style={{ width: `${row.homeShare * 100}%` }} />
          <span className="h-full flex-1 bg-[var(--mp-bar-away)]" />
        </div>
      )}
    </div>
  );
}

/** Home value | label | away value, no bar (Passing, Discipline). */
export function StatPlainRow({ row, label }: { row: StatRow; label: string }) {
  return (
    <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-baseline gap-x-2 py-2 text-sm md:grid-cols-[minmax(4.5rem,1fr)_minmax(0,38rem)_minmax(4.5rem,1fr)] md:text-base">
      <span className="font-bold tabular-nums text-text-primary md:text-lg">{row.homeText}</span>
      <span className="text-center text-text-primary">{label}</span>
      <span className="text-end font-bold tabular-nums text-text-primary md:text-lg">
        {row.awayText}
      </span>
    </div>
  );
}
