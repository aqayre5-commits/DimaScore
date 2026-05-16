'use client';

import { useRef } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { BracketColumn } from './BracketColumn';
import {
  BracketMatchCell,
  type BracketMatch,
  type KnockoutPhase,
  type BracketSide,
} from './BracketMatchCell';
import { BracketConnectors } from './BracketConnectors';

interface DesktopBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
}

/** Column config: grid column index, phase, side, row span per cell. */
const COLUMNS: Array<{
  col: number;
  phase: KnockoutPhase;
  side: BracketSide;
  rowSpan: number;
}> = [
  { col: 1, phase: 'r32', side: 'left', rowSpan: 2 },
  { col: 2, phase: 'r16', side: 'left', rowSpan: 4 },
  { col: 3, phase: 'qf', side: 'left', rowSpan: 8 },
  { col: 4, phase: 'sf', side: 'left', rowSpan: 16 },
  // col 5: Final + 3rd rendered explicitly below
  { col: 6, phase: 'sf', side: 'right', rowSpan: 16 },
  { col: 7, phase: 'qf', side: 'right', rowSpan: 8 },
  { col: 8, phase: 'r16', side: 'right', rowSpan: 4 },
  { col: 9, phase: 'r32', side: 'right', rowSpan: 2 },
];

/**
 * Desktop knockout bracket — 9-column x 16-row CSS Grid.
 * Left half converges rightward, right half converges leftward.
 * Final and 3rd-place occupy the center column (5) at offset
 * vertical positions: Final at rows 4–8 (upper), 3rd at rows
 * 10–14 (lower), framed by SF cells in columns 4 and 6.
 *
 * RTL (Arabic): dir="rtl" on grid reverses column visual order.
 * BracketConnectors reads computed direction for edge logic.
 */
export function DesktopBracket({ matches, thirdPlaceMatch, locale }: DesktopBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === 'ar';
  const finalMatch = matches.find((m) => m.phase === 'final');

  return (
    <div className="overflow-x-auto">
      <div
        ref={containerRef}
        dir={isRtl ? 'rtl' : undefined}
        className="relative grid min-w-[1500px] gap-x-2 gap-y-1"
        style={{
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'repeat(16, minmax(48px, auto))',
          transform: 'scale(var(--bracket-scale, 1))',
          transformOrigin: 'top left',
        }}
      >
        {COLUMNS.map(({ col, phase, side, rowSpan }) => {
          const colMatches = matches.filter((m) => m.phase === phase && m.side === side);
          if (colMatches.length === 0) return null;
          return (
            <BracketColumn
              key={`${phase}-${side}`}
              matches={colMatches}
              gridColumn={col}
              rowSpan={rowSpan}
            />
          );
        })}

        {/* Final — upper center column */}
        {finalMatch && (
          <div
            className="flex items-center justify-center self-center"
            style={{ gridColumn: 5, gridRow: '4 / span 5' }}
          >
            <BracketMatchCell match={finalMatch} />
          </div>
        )}

        {/* 3rd place — lower center column */}
        {thirdPlaceMatch && (
          <div
            className="flex items-center justify-center self-center"
            style={{ gridColumn: 5, gridRow: '10 / span 5' }}
          >
            <BracketMatchCell match={thirdPlaceMatch} />
          </div>
        )}

        <BracketConnectors containerRef={containerRef} matches={matches} />
      </div>
    </div>
  );
}
