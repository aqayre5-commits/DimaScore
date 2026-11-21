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
      ? 'self-end text-[15px] leading-tight md:text-xl md:leading-none'
      : 'row-span-2 self-center text-[19px] md:text-[22.5px] md:leading-[1.2]'
  }`;
  return (
    <div
      className={`grid grid-cols-[minmax(2.25rem,auto)_1fr_minmax(2.25rem,auto)] md:gap-x-2 ${wide ? 'py-0.5 md:py-[5.5px]' : 'py-1.5 md:pb-1 md:pt-[4.5px]'} ${
        wide
          ? 'md:grid-cols-[4.5rem_1fr_4.5rem]'
          : 'md:grid-cols-[minmax(4.5rem,1fr)_minmax(0,545px)_minmax(4.5rem,1fr)]'
      }`}
    >
      <span className={value}>{row.homeText}</span>
      <span
        className={`col-start-2 row-start-1 text-center text-text-primary ${wide ? 'text-[13px] leading-tight md:text-[17px] md:leading-none' : 'text-base leading-tight md:text-[18.5px] md:leading-[1.2]'}`}
      >
        {label}
      </span>
      <span className={`${value} col-start-3 row-start-1 text-end`}>{row.awayText}</span>
      {row.bar && (
        <div
          role="img"
          aria-label={srLabel}
          className={`col-start-2 row-start-2 flex overflow-hidden rounded-full bg-[var(--mp-bar-track)] ${wide ? 'mt-1 h-[7px] md:mt-[4px] md:h-2.5' : 'mt-1.5 h-2 md:mt-[5px]'} ${
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
    <div className="grid grid-cols-[3.5rem_1fr_3.5rem] items-baseline gap-x-2 py-[7px] text-base md:grid-cols-[minmax(4.5rem,1fr)_minmax(0,545px)_minmax(4.5rem,1fr)] md:py-1 md:text-[18.5px] md:leading-[1.2]">
      <span className="text-[19.5px] font-bold leading-tight tabular-nums text-text-primary md:text-[21.5px] md:leading-[1.2]">
        {row.homeText}
      </span>
      <span className="text-center text-text-primary">{label}</span>
      <span className="text-end text-[19.5px] font-bold leading-tight tabular-nums text-text-primary md:text-[21.5px] md:leading-[1.2]">
        {row.awayText}
      </span>
    </div>
  );
}
