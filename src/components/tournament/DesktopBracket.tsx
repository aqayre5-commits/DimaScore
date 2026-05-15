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
  { col: 5, phase: 'final', side: 'center', rowSpan: 16 },
  { col: 6, phase: 'sf', side: 'right', rowSpan: 16 },
  { col: 7, phase: 'qf', side: 'right', rowSpan: 8 },
  { col: 8, phase: 'r16', side: 'right', rowSpan: 4 },
  { col: 9, phase: 'r32', side: 'right', rowSpan: 2 },
];

/**
 * Desktop knockout bracket — 9-column x 16-row CSS Grid.
 * Left half converges rightward, right half converges leftward,
 * Final at center column. 3rd-place match sits below the grid
 * with a visual divider.
 *
 * RTL (Arabic): dir="rtl" on grid reverses column visual order.
 * BracketConnectors reads computed direction for edge logic.
 */
export function DesktopBracket({ matches, thirdPlaceMatch, locale }: DesktopBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isRtl = locale === 'ar';

  return (
    <div className="space-y-4">
      {/* Scrollable bracket area */}
      <div className="overflow-x-auto">
        <div
          ref={containerRef}
          dir={isRtl ? 'rtl' : undefined}
          className="relative grid min-w-[1100px] gap-x-2 gap-y-1"
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

          <BracketConnectors containerRef={containerRef} matches={matches} />
        </div>
      </div>

      {/* 3rd-place match — outside main bracket grid */}
      {thirdPlaceMatch && (
        <div className="flex flex-col items-center gap-2">
          <div className="h-px w-48 bg-border-subtle" />
          <BracketMatchCell match={thirdPlaceMatch} />
        </div>
      )}
    </div>
  );
}
