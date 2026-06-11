'use client';

import { useEffect, useRef } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { BracketColumn } from './BracketColumn';
import { type BracketMatch, type KnockoutPhase, type BracketSide } from './BracketMatchCell';
import { BracketCardNode } from './BracketCardNode';
import { BracketConnectors } from './BracketConnectors';
import { ROUND_LABELS } from '@/lib/constants/wc2026-bracket-builder';

interface DesktopBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  activePhase?: KnockoutPhase;
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

/** Header labels per grid column (1-indexed). */
const HEADER_COLUMNS: Array<{ col: number; phase: KnockoutPhase }> = [
  { col: 1, phase: 'r32' },
  { col: 2, phase: 'r16' },
  { col: 3, phase: 'qf' },
  { col: 4, phase: 'sf' },
  { col: 5, phase: 'final' },
  { col: 6, phase: 'sf' },
  { col: 7, phase: 'qf' },
  { col: 8, phase: 'r16' },
  { col: 9, phase: 'r32' },
];

/**
 * Desktop knockout bracket — 9-column CSS Grid.
 * Row 1: header labels. Rows 2-17: match cells (16 data rows).
 * Left half converges rightward, right half converges leftward.
 * Final and 3rd-place occupy the center column (5).
 *
 * Cells are BracketCardNode (the AFCON card design); the grid is widened to fit its
 * ~280px width. BracketConnectors reads [data-match-id] positions, so it follows the
 * wider cells automatically.
 *
 * RTL (Arabic): dir="rtl" on grid reverses column visual order.
 */
export function DesktopBracket({
  matches,
  thirdPlaceMatch,
  locale,
  activePhase,
}: DesktopBracketProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const isRtl = locale === 'ar';
  const finalMatch = matches.find((m) => m.phase === 'final');
  const labels = ROUND_LABELS[locale] ?? ROUND_LABELS.en;

  // Scroll to active phase column on chip click (skip initial mount)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!activePhase || !containerRef.current) return;
    const target = containerRef.current.querySelector<HTMLElement>(`[data-phase="${activePhase}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activePhase]);

  return (
    <div ref={scrollRef} className="relative overflow-x-auto">
      <div
        ref={containerRef}
        dir={isRtl ? 'rtl' : undefined}
        className="relative grid min-w-[2600px] gap-x-2 gap-y-1"
        style={{
          gridTemplateColumns: 'repeat(9, 1fr)',
          gridTemplateRows: 'auto repeat(16, minmax(48px, auto))',
          transform: 'scale(var(--bracket-scale, 1))',
          transformOrigin: 'top left',
        }}
      >
        {/* Header row — grid row 1 */}
        {HEADER_COLUMNS.map(({ col, phase }) => (
          <div
            key={`hdr-${col}`}
            className="flex items-center justify-center py-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary"
            style={{ gridColumn: col, gridRow: 1 }}
          >
            {labels[phase]}
          </div>
        ))}

        {/* Match columns — grid rows 2+ */}
        {COLUMNS.map(({ col, phase, side, rowSpan }) => {
          const colMatches = matches.filter((m) => m.phase === phase && m.side === side);
          if (colMatches.length === 0) return null;
          return (
            <BracketColumn
              key={`${phase}-${side}`}
              matches={colMatches}
              gridColumn={col}
              rowSpan={rowSpan}
              phase={phase}
              locale={locale}
            />
          );
        })}

        {/* Final — upper center column */}
        {finalMatch && (
          <div
            data-phase="final"
            className="flex items-center justify-center self-center"
            style={{ gridColumn: 5, gridRow: '5 / span 5' }}
          >
            <BracketCardNode match={finalMatch} locale={locale} />
          </div>
        )}

        {/* 3rd place — lower center column */}
        {thirdPlaceMatch && (
          <div
            data-phase="3rd"
            className="flex items-center justify-center self-center"
            style={{ gridColumn: 5, gridRow: '11 / span 5' }}
          >
            <BracketCardNode match={thirdPlaceMatch} locale={locale} />
          </div>
        )}

        <BracketConnectors containerRef={containerRef} matches={matches} />
      </div>
    </div>
  );
}
