import { useTranslations } from 'next-intl';
import type { MatchLineup, LineupPlayer } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface LineupPitchProps {
  homeLineup: MatchLineup;
  awayLineup: MatchLineup;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
}

// SVG dimensions
const W = 360;
const H = 520;
const HALF_H = H / 2;
const PADDING_X = 30;
const PADDING_Y = 30;

const POS_LABEL_KEY: Record<string, string> = {
  G: 'goalkeeper',
  D: 'defender',
  M: 'midfielder',
  F: 'attacker',
};

/**
 * Parse grid string "line:column" into { line, col }.
 * API-Football: line 1 = GK, higher = further forward.
 */
function parseGrid(grid: string | null): { line: number; col: number } | null {
  if (!grid) return null;
  const parts = grid.split(':');
  if (parts.length !== 2) return null;
  const line = parseInt(parts[0], 10);
  const col = parseInt(parts[1], 10);
  if (isNaN(line) || isNaN(col)) return null;
  return { line, col };
}

/**
 * Parse formation string like "4-3-3" into row sizes [4, 3, 3].
 */
function parseFormation(formation: string | null): number[] {
  if (!formation) return [];
  return formation
    .split('-')
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));
}

/**
 * Compute (x, y) within a team's half of the pitch.
 * Returns coordinates in SVG space where (0,0) is top-left of that half.
 * halfHeight is the available vertical space for the half.
 *
 * For home team (top half): GK at top, attackers at middle.
 * For away team (bottom half): positions are mirrored.
 */
function gridToPosition(
  grid: { line: number; col: number },
  totalLines: number,
  colsInLine: number,
  isAway: boolean,
): { x: number; y: number } {
  const usableW = W - 2 * PADDING_X;
  const usableH = HALF_H - 2 * PADDING_Y;

  // X: spread columns evenly across width
  const x = PADDING_X + (usableW / (colsInLine + 1)) * grid.col;

  // Y: spread lines across half height (line 1 = near own goal)
  const yRatio = (grid.line - 1) / Math.max(totalLines - 1, 1);
  let y = PADDING_Y + yRatio * usableH;

  if (isAway) {
    // Mirror: line 1 (GK) at bottom, attackers at middle
    y = HALF_H - y;
  }

  return { x, y };
}

/**
 * Build position map for a team's starters.
 * Uses grid coordinates when available, falls back to formation-based positioning.
 */
function computePositions(
  starters: LineupPlayer[],
  formation: string | null,
  isAway: boolean,
): Array<{ player: LineupPlayer; x: number; y: number }> {
  const formationRows = parseFormation(formation);
  // Total lines = GK row + formation rows
  const totalLines = 1 + formationRows.length;

  // Build a map of how many columns per line (for grid-based positioning)
  const colsPerLine = new Map<number, number>();
  colsPerLine.set(1, 1); // GK
  formationRows.forEach((count, i) => {
    colsPerLine.set(i + 2, count);
  });

  // Try grid-based first
  const withGrid = starters.filter((p) => parseGrid(p.grid) != null);

  if (withGrid.length === starters.length) {
    // All have grid coordinates
    return starters.map((p) => {
      const g = parseGrid(p.grid)!;
      const cols = colsPerLine.get(g.line) ?? g.col;
      const pos = gridToPosition(g, totalLines, cols, isAway);
      return { player: p, ...pos };
    });
  }

  // Fallback: position based on formation string
  const positions: Array<{ player: LineupPlayer; x: number; y: number }> = [];
  let playerIdx = 0;

  // GK (line 1)
  if (playerIdx < starters.length) {
    const pos = gridToPosition({ line: 1, col: 1 }, totalLines, 1, isAway);
    positions.push({ player: starters[playerIdx], ...pos });
    playerIdx++;
  }

  // Outfield rows
  for (let rowIdx = 0; rowIdx < formationRows.length; rowIdx++) {
    const count = formationRows[rowIdx];
    for (let c = 1; c <= count && playerIdx < starters.length; c++) {
      const pos = gridToPosition({ line: rowIdx + 2, col: c }, totalLines, count, isAway);
      positions.push({ player: starters[playerIdx], ...pos });
      playerIdx++;
    }
  }

  return positions;
}

/** Extract a short display name (prefer lastname). */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return parts[parts.length - 1];
}

export function LineupPitch({
  homeLineup,
  awayLineup,
  homeTeamName,
  awayTeamName,
  locale,
}: LineupPitchProps) {
  const t = useTranslations('matchDetail');

  if (homeLineup.starters.length === 0 && awayLineup.starters.length === 0) return null;

  const homePositions = computePositions(homeLineup.starters, homeLineup.formation, false);
  const awayPositions = computePositions(awayLineup.starters, awayLineup.formation, true);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      {/* Formation labels */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
        <div className="text-xs text-text-secondary">
          <span className="font-medium text-text-primary">{homeTeamName}</span>
          {homeLineup.formation && (
            <span className="ms-2 text-text-tertiary">{homeLineup.formation}</span>
          )}
        </div>
        <div className="text-xs text-text-secondary">
          {awayLineup.formation && (
            <span className="me-2 text-text-tertiary">{awayLineup.formation}</span>
          )}
          <span className="font-medium text-text-primary">{awayTeamName}</span>
        </div>
      </div>

      {/* SVG Pitch */}
      <div className="overflow-hidden px-2 py-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mx-auto w-full max-w-[400px]"
          role="img"
          aria-label={`${homeTeamName} vs ${awayTeamName} ${t('lineups').toLowerCase()}`}
        >
          {/* Pitch background */}
          <rect x="0" y="0" width={W} height={H} rx="8" className="fill-[#1a8a3e]" />

          {/* Pitch markings */}
          <PitchMarkings />

          {/* Home team (top half) */}
          {homePositions.map(({ player, x, y }) => (
            <PlayerDot key={player.id} x={x} y={y} player={player} variant="home" />
          ))}

          {/* Away team (bottom half, offset by HALF_H) */}
          {awayPositions.map(({ player, x, y }) => (
            <PlayerDot key={player.id} x={x} y={y + HALF_H} player={player} variant="away" />
          ))}
        </svg>
      </div>

      {/* Coaches */}
      {(homeLineup.coach || awayLineup.coach) && (
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2">
          <div className="text-xs text-text-tertiary">
            {homeLineup.coach && (
              <>
                <span className="font-medium text-text-secondary">{t('coach')}:</span>{' '}
                {homeLineup.coach.name}
              </>
            )}
          </div>
          <div className="text-xs text-text-tertiary">
            {awayLineup.coach && (
              <>
                <span className="font-medium text-text-secondary">{t('coach')}:</span>{' '}
                {awayLineup.coach.name}
              </>
            )}
          </div>
        </div>
      )}

      {/* Substitutes */}
      {(homeLineup.substitutes.length > 0 || awayLineup.substitutes.length > 0) && (
        <div className="border-t border-border-subtle px-4 py-3">
          <h4 className="mb-2 text-xs font-medium text-text-secondary">{t('substitutes')}</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <SubList players={homeLineup.substitutes} locale={locale} t={t} />
            <SubList players={awayLineup.substitutes} locale={locale} t={t} />
          </div>
        </div>
      )}
    </div>
  );
}

function PitchMarkings() {
  const cx = W / 2;
  const cy = H / 2;

  return (
    <g stroke="white" strokeOpacity="0.3" strokeWidth="1.5" fill="none">
      {/* Outline */}
      <rect x="10" y="10" width={W - 20} height={H - 20} rx="2" />
      {/* Halfway line */}
      <line x1="10" y1={cy} x2={W - 10} y2={cy} />
      {/* Center circle */}
      <circle cx={cx} cy={cy} r="40" />
      <circle cx={cx} cy={cy} r="2" fill="white" fillOpacity="0.3" />
      {/* Top penalty area */}
      <rect x={cx - 65} y="10" width="130" height="55" />
      <rect x={cx - 30} y="10" width="60" height="20" />
      {/* Bottom penalty area */}
      <rect x={cx - 65} y={H - 65} width="130" height="55" />
      <rect x={cx - 30} y={H - 30} width="60" height="20" />
    </g>
  );
}

function PlayerDot({
  x,
  y,
  player,
  variant,
}: {
  x: number;
  y: number;
  player: LineupPlayer;
  variant: 'home' | 'away';
}) {
  const isHome = variant === 'home';

  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="14"
        className={isHome ? 'fill-white' : 'fill-[#1e293b]'}
        stroke={isHome ? '#1e293b' : 'white'}
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        className={`text-[10px] font-bold ${isHome ? 'fill-[#1e293b]' : 'fill-white'}`}
      >
        {player.number}
      </text>
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[8px]"
        fillOpacity="0.9"
      >
        {shortName(player.name)}
      </text>
    </g>
  );
}

function SubList({
  players,
  locale,
  t,
}: {
  players: Omit<LineupPlayer, 'grid'>[];
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  if (players.length === 0) return <div />;

  return (
    <ul className="space-y-0.5">
      {players.map((p) => (
        <li key={p.id} className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="w-5 shrink-0 text-end tabular-nums text-text-tertiary">{p.number}</span>
          <span className="truncate">{p.name}</span>
          {p.pos && (
            <span className="shrink-0 text-text-tertiary">
              {t(POS_LABEL_KEY[p.pos] as never) ?? p.pos}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
