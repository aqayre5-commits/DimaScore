import { BracketMatchCell, type BracketMatch } from './BracketMatchCell';

interface BracketColumnProps {
  matches: BracketMatch[];
  gridColumn: number;
  rowSpan: number;
}

/**
 * Renders BracketMatchCells for one round + side as direct grid
 * children. Returns a Fragment — cells are placed into the parent
 * DesktopBracket grid via explicit gridColumn / gridRow styles.
 *
 * gridColumn: 1-indexed CSS grid column for this round/side.
 * rowSpan: grid rows each cell spans (R32=2, R16=4, QF=8, SF=16).
 *
 * NOTE: Row span math assumes the parent grid has 16 rows = R32 cell
 * count per side. For non-WC2026 brackets (e.g. AFCON with different
 * structure), this needs generalization. Log to Sub-task 6.6 retro
 * for tracking.
 */
export function BracketColumn({ matches, gridColumn, rowSpan }: BracketColumnProps) {
  return (
    <>
      {matches.map((match, i) => (
        <div
          key={match.matchId}
          className="flex items-center justify-center self-center"
          style={{
            gridColumn,
            gridRow: `${i * rowSpan + 1} / span ${rowSpan}`,
          }}
        >
          <BracketMatchCell match={match} />
        </div>
      ))}
    </>
  );
}
