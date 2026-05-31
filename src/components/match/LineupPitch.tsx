import { useTranslations } from 'next-intl';
import type { MatchLineup, LineupPlayer, MatchEvent } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

type BadgeType = 'goal' | 'ownGoal' | 'yellowCard' | 'redCard' | 'secondYellow' | 'subOut';

interface LineupPitchProps {
  homeLineup: MatchLineup;
  awayLineup: MatchLineup;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
  pitchOnly?: boolean;
  events?: MatchEvent[];
}

/** Build a map of playerId → badge types from match events. */
function buildBadgeMap(events: MatchEvent[]): Map<number, BadgeType[]> {
  const map = new Map<number, BadgeType[]>();

  function add(playerId: number, badge: BadgeType) {
    const existing = map.get(playerId) ?? [];
    // Dedupe same badge type
    if (!existing.includes(badge)) existing.push(badge);
    map.set(playerId, existing);
  }

  for (const e of events) {
    const type = e.type?.toLowerCase() ?? '';
    const detail = (e.detail ?? '').toLowerCase();
    const pid = e.player?.id;

    if (type === 'goal' && pid != null) {
      if (detail.includes('missed')) continue;
      if (detail.includes('own goal')) {
        add(pid, 'ownGoal');
      } else {
        add(pid, 'goal');
      }
    }

    if (type === 'card' && pid != null) {
      if (detail.includes('second yellow')) {
        add(pid, 'secondYellow');
      } else if (detail.includes('red')) {
        add(pid, 'redCard');
      } else {
        add(pid, 'yellowCard');
      }
    }

    if (type === 'subst') {
      // assist field = player going OUT
      const outId = e.assist?.id;
      if (outId != null) add(outId, 'subOut');
    }
  }

  return map;
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
  events = [],
}: LineupPitchProps) {
  const t = useTranslations('matchDetail');

  if (homeLineup.starters.length === 0 && awayLineup.starters.length === 0) return null;

  const homePositions = computePositions(homeLineup.starters, homeLineup.formation, false);
  const awayPositions = computePositions(awayLineup.starters, awayLineup.formation, true);
  const badgeMap = events.length > 0 ? buildBadgeMap(events) : new Map<number, BadgeType[]>();

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
            <PlayerDot
              key={player.id}
              x={x}
              y={y}
              player={player}
              variant="home"
              badges={badgeMap.get(player.id)}
            />
          ))}

          {/* Away team (right half, offset by HALF_W) */}
          {awayPositions.map(({ player, x, y }) => (
            <PlayerDot
              key={player.id}
              x={x + HALF_W}
              y={y}
              player={player}
              variant="away"
              badges={badgeMap.get(player.id)}
            />
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
  badges,
}: {
  x: number;
  y: number;
  player: LineupPlayer;
  variant: 'home' | 'away';
  badges?: BadgeType[];
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
      {/* Event badges */}
      {badges && badges.length > 0 && <EventBadges x={x} y={y} badges={badges} />}
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

const BADGE_R = 7;

function EventBadges({ x, y, badges }: { x: number; y: number; badges: BadgeType[] }) {
  // Position badges at bottom-right of the player circle, stacking leftward
  return (
    <>
      {badges.map((badge, i) => {
        const bx = x + PLAYER_R - 4 - i * (BADGE_R * 2 + 2);
        const by = y + PLAYER_R - 4;
        return <SingleBadge key={badge} cx={bx} cy={by} badge={badge} />;
      })}
    </>
  );
}

function SingleBadge({ cx, cy, badge }: { cx: number; cy: number; badge: BadgeType }) {
  switch (badge) {
    // Football: white ball with black pentagon + seam lines
    case 'goal':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <circle r={5} fill="white" stroke="#555" strokeWidth="0.3" />
          <path d="M0,-1.8 L1.71,-0.56 L1.06,1.46 L-1.06,1.46 L-1.71,-0.56Z" fill="#222" />
          <line x1={0} y1={-1.8} x2={0} y2={-4.7} stroke="#333" strokeWidth="0.6" />
          <line x1={1.71} y1={-0.56} x2={4.5} y2={-1.45} stroke="#333" strokeWidth="0.6" />
          <line x1={1.06} y1={1.46} x2={2.8} y2={3.8} stroke="#333" strokeWidth="0.6" />
          <line x1={-1.06} y1={1.46} x2={-2.8} y2={3.8} stroke="#333" strokeWidth="0.6" />
          <line x1={-1.71} y1={-0.56} x2={-4.5} y2={-1.45} stroke="#333" strokeWidth="0.6" />
        </g>
      );
    // Own goal football: white ball with red pentagon + red seam lines
    case 'ownGoal':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <circle r={5} fill="white" stroke="#888" strokeWidth="0.3" />
          <path d="M0,-1.8 L1.71,-0.56 L1.06,1.46 L-1.06,1.46 L-1.71,-0.56Z" fill="#dc2626" />
          <line x1={0} y1={-1.8} x2={0} y2={-4.7} stroke="#dc2626" strokeWidth="0.6" />
          <line x1={1.71} y1={-0.56} x2={4.5} y2={-1.45} stroke="#dc2626" strokeWidth="0.6" />
          <line x1={1.06} y1={1.46} x2={2.8} y2={3.8} stroke="#dc2626" strokeWidth="0.6" />
          <line x1={-1.06} y1={1.46} x2={-2.8} y2={3.8} stroke="#dc2626" strokeWidth="0.6" />
          <line x1={-1.71} y1={-0.56} x2={-4.5} y2={-1.45} stroke="#dc2626" strokeWidth="0.6" />
        </g>
      );
    // Yellow card: realistic card shape, slight tilt
    case 'yellowCard':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <g transform="rotate(-8)">
            <rect
              x={-3}
              y={-4.5}
              width={6}
              height={9}
              rx={0.6}
              fill="#fbbf24"
              stroke="#a16207"
              strokeWidth="0.5"
            />
          </g>
        </g>
      );
    // Red card: realistic card shape, slight tilt
    case 'redCard':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <g transform="rotate(-8)">
            <rect
              x={-3}
              y={-4.5}
              width={6}
              height={9}
              rx={0.6}
              fill="#dc2626"
              stroke="#7f1d1d"
              strokeWidth="0.5"
            />
          </g>
        </g>
      );
    // Second yellow: two yellow cards overlapping
    case 'secondYellow':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <g transform="rotate(-15)">
            <rect
              x={-3.5}
              y={-4}
              width={5.5}
              height={8}
              rx={0.5}
              fill="#fbbf24"
              stroke="#a16207"
              strokeWidth="0.4"
            />
          </g>
          <g transform="rotate(8)">
            <rect
              x={-2}
              y={-4}
              width={5.5}
              height={8}
              rx={0.5}
              fill="#fbbf24"
              stroke="#a16207"
              strokeWidth="0.4"
            />
          </g>
        </g>
      );
    // Substituted out: red downward arrow
    case 'subOut':
      return (
        <g transform={`translate(${cx},${cy})`}>
          <circle r={BADGE_R} fill="#1a1a1a" stroke="white" strokeWidth="1.5" />
          <path d="M0,4 L-3,-1 L-1.2,-1 L-1.2,-4 L1.2,-4 L1.2,-1 L3,-1Z" fill="#ef4444" />
        </g>
      );
    default:
      return null;
  }
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
