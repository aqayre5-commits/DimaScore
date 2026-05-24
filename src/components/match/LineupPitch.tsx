import { useTranslations } from 'next-intl';
import type { MatchLineup, LineupPlayer } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface LineupPitchProps {
  homeLineup: MatchLineup;
  awayLineup: MatchLineup;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
  pitchOnly?: boolean;
}

// SVG viewBox matches rendered width (~624px) so 1 SVG unit ≈ 1 screen pixel
const W = 624;
const H = 405;
const HALF_W = W / 2;
const PADDING_X = 40;
const PADDING_Y = 0;
// Gap from the center line so attackers from both teams don't overlap
const CENTER_GAP = 28;

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
 * Compute (x, y) within a team's half of the pitch (horizontal layout).
 *
 * Home team (left half): GK at left edge, attackers toward center.
 * Away team (right half): GK at right edge, attackers toward center.
 *
 * "line" maps to horizontal position (x-axis).
 * "col" maps to vertical position (y-axis).
 */
function gridToPosition(
  grid: { line: number; col: number },
  totalLines: number,
  colsInLine: number,
  isAway: boolean,
): { x: number; y: number } {
  // Usable width per half: from edge padding to center gap
  const usableW = HALF_W - PADDING_X - CENTER_GAP;
  const usableH = H - 2 * PADDING_Y;

  // Y: spread columns evenly across height
  const y = PADDING_Y + (usableH / (colsInLine + 1)) * grid.col;

  // X: spread lines across half width (line 1 = near own goal)
  const xRatio = (grid.line - 1) / Math.max(totalLines - 1, 1);
  let x: number;

  if (isAway) {
    // Away: GK at right edge, attackers toward center (stop at CENTER_GAP from midline)
    x = HALF_W - PADDING_X - xRatio * usableW;
  } else {
    // Home: GK at left edge, attackers toward center (stop at CENTER_GAP from midline)
    x = PADDING_X + xRatio * usableW;
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
  const totalLines = 1 + formationRows.length;

  const colsPerLine = new Map<number, number>();
  colsPerLine.set(1, 1); // GK
  formationRows.forEach((count, i) => {
    colsPerLine.set(i + 2, count);
  });

  const withGrid = starters.filter((p) => parseGrid(p.grid) != null);

  if (withGrid.length === starters.length) {
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

  if (playerIdx < starters.length) {
    const pos = gridToPosition({ line: 1, col: 1 }, totalLines, 1, isAway);
    positions.push({ player: starters[playerIdx], ...pos });
    playerIdx++;
  }

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
  pitchOnly = false,
}: LineupPitchProps) {
  const t = useTranslations('matchDetail');

  if (homeLineup.starters.length === 0 && awayLineup.starters.length === 0) return null;

  const homePositions = computePositions(homeLineup.starters, homeLineup.formation, false);
  const awayPositions = computePositions(awayLineup.starters, awayLineup.formation, true);

  return (
    <div>
      {/* SVG Pitch — horizontal/landscape, full width */}
      <div className="overflow-hidden">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label={`${homeTeamName} vs ${awayTeamName} ${t('lineups').toLowerCase()}`}
        >
          {/* Pitch background */}
          <rect x="0" y="0" width={W} height={H} className="fill-[#1a8a3e]" />

          {/* Pitch markings */}
          <PitchMarkings />

          {/* Home team (left half) */}
          {homePositions.map(({ player, x, y }) => (
            <PlayerDot key={player.id} x={x} y={y} player={player} variant="home" />
          ))}

          {/* Away team (right half, offset by HALF_W) */}
          {awayPositions.map(({ player, x, y }) => (
            <PlayerDot key={player.id} x={x + HALF_W} y={y} player={player} variant="away" />
          ))}
        </svg>
      </div>

      {/* Coaches + formation */}
      {(homeLineup.coach || awayLineup.coach || homeLineup.formation || awayLineup.formation) && (
        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2">
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            {homeLineup.formation && (
              <span className="font-semibold tabular-nums text-text-secondary">
                {homeLineup.formation}
              </span>
            )}
            {homeLineup.coach && (
              <>
                <span>&middot;</span>
                <span>{homeLineup.coach.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
            {awayLineup.coach && (
              <>
                <span>{awayLineup.coach.name}</span>
                <span>&middot;</span>
              </>
            )}
            {awayLineup.formation && (
              <span className="font-semibold tabular-nums text-text-secondary">
                {awayLineup.formation}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Substitutes — hidden in pitchOnly mode */}
      {!pitchOnly && (homeLineup.substitutes.length > 0 || awayLineup.substitutes.length > 0) && (
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
      {/* Halfway line (vertical) */}
      <line x1={cx} y1="10" x2={cx} y2={H - 10} />
      {/* Center circle */}
      <circle cx={cx} cy={cy} r="45" />
      <circle cx={cx} cy={cy} r="2" fill="white" fillOpacity="0.3" />
      {/* Left penalty area (home goal) */}
      <rect x="10" y={cy - 70} width="58" height="140" />
      <rect x="10" y={cy - 28} width="20" height="56" />
      {/* Right penalty area (away goal) */}
      <rect x={W - 68} y={cy - 70} width="58" height="140" />
      <rect x={W - 30} y={cy - 28} width="20" height="56" />
    </g>
  );
}

const PLAYER_R = 22;

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
  const clipId = `clip-${player.id}`;

  return (
    <g>
      {player.photoUrl ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <circle cx={x} cy={y} r={PLAYER_R} />
            </clipPath>
          </defs>
          <circle
            cx={x}
            cy={y}
            r={PLAYER_R}
            fill={isHome ? 'white' : '#1e293b'}
            stroke={isHome ? 'white' : 'rgba(255,255,255,0.6)'}
            strokeWidth="2"
          />
          <image
            href={player.photoUrl}
            x={x - PLAYER_R}
            y={y - PLAYER_R}
            width={PLAYER_R * 2}
            height={PLAYER_R * 2}
            clipPath={`url(#${clipId})`}
            preserveAspectRatio="xMidYMid slice"
          />
          <circle
            cx={x}
            cy={y}
            r={PLAYER_R}
            fill="none"
            stroke={isHome ? 'white' : 'rgba(255,255,255,0.6)'}
            strokeWidth="2"
          />
        </>
      ) : (
        <>
          <circle
            cx={x}
            cy={y}
            r={PLAYER_R}
            className={isHome ? 'fill-white' : 'fill-[#1e293b]'}
            stroke={isHome ? '#1e293b' : 'white'}
            strokeWidth="1.5"
          />
          <text
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className={`text-[12px] font-bold ${isHome ? 'fill-[#1e293b]' : 'fill-white'}`}
          >
            {player.number}
          </text>
        </>
      )}
      <text
        x={x}
        y={y + PLAYER_R + 13}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-[9px] font-medium"
        fillOpacity="0.95"
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
