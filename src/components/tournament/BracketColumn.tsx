import { BracketMatchCell, type BracketMatch, type KnockoutPhase } from './BracketMatchCell';

interface BracketColumnProps {
  matches: BracketMatch[];
  gridColumn: number;
  rowSpan: number;
  phase: KnockoutPhase;
}

/**
 * Renders BracketMatchCells for one round + side as direct grid
 * children. Each cell is placed into the parent DesktopBracket
 * grid via explicit gridColumn / gridRow styles.
 *
 * gridColumn: 1-indexed CSS grid column for this round/side.
 * rowSpan: grid rows each cell spans (R32=2, R16=4, QF=8, SF=16).
 *
 * Row indices are offset by +1 to account for the header row at
 * grid-row 1.
 */
export function BracketColumn({ matches, gridColumn, rowSpan, phase }: BracketColumnProps) {
  return (
    <>
      {matches.map((match, i) => (
        <div
          key={match.matchId}
          data-phase={phase}
          className="flex items-center justify-center self-center"
          style={{
            gridColumn,
            gridRow: `${i * rowSpan + 2} / span ${rowSpan}`,
          }}
        >
          <BracketMatchCell match={match} />
        </div>
      ))}
    </>
  );
}
