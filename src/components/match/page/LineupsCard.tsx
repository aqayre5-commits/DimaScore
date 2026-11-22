'use client';

import { useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchLineup } from '@/lib/db/queries/match-detail';
import {
  PITCH,
  PITCH_GK_Y,
  PITCH_SPAN_Y,
  pitchSpots,
  shortPlayerName,
} from '@/lib/match/match-view';
import { Card, CardTitle } from './Card';
import { ChevronIcon } from './icons';
import { TeamBadge } from './shared';
import { useMatchData } from './useMatchData';
import type { MatchView, TeamView } from './types';

/**
 * Line-ups tab. Desktop: both teams side by side, each on its own half pitch (goalkeeper at the
 * bottom). Mobile: a home/away toggle shows one pitch; the other stays in the HTML, hidden.
 * Substitutes sit in a native <details> accordion below the pitch, on mobile only (as in the
 * mockups).
 */
export function LineupsCard({
  view,
  predicted,
}: {
  view: MatchView;
  predicted: { home: MatchLineup | null; away: MatchLineup | null } | null;
}) {
  const t = useTranslations('matchPage');
  const { lineups } = useMatchData(view.matchId, view.coverage, view.isUpcoming);
  const [side, setSide] = useState<'home' | 'away'>('home');

  let home = lineups.find((l) => l.teamId === view.home.id) ?? null;
  let away = lineups.find((l) => l.teamId === view.away.id) ?? null;
  let isPredicted = false;
  if ((!home || !away) && predicted?.home && predicted?.away) {
    home = predicted.home;
    away = predicted.away;
    isPredicted = true;
  }
  const title = isPredicted ? t('lineupsPredicted') : t('lineupsConfirmed');

  // The mockup is a pitch per team; without pitch positions for both, the tab has nothing to show.
  if (
    !home ||
    !away ||
    pitchSpots(home.starters, home.formation).length === 0 ||
    pitchSpots(away.starters, away.formation).length === 0
  )
    return null;

  return (
    <Card labelledBy="mp-lineups" pad="pt-1.5 md:px-[19px] md:pb-[17px] md:pt-2.5">
      <CardTitle id="mp-lineups" size="lineups">
        {title}
      </CardTitle>

      <div
        role="group"
        aria-label={t('chooseTeam')}
        className="mt-3 grid grid-cols-2 overflow-hidden rounded-lg border border-border-subtle md:hidden"
      >
        {(['home', 'away'] as const).map((s) => {
          const team = s === 'home' ? view.home : view.away;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={side === s}
              onClick={() => setSide(s)}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-base focus-visible:outline-2 focus-visible:outline-accent-green ${
                side === s
                  ? 'bg-[var(--mp-highlight-bg)] font-bold text-accent-green shadow-sm'
                  : 'font-medium text-text-primary'
              }`}
            >
              <span className="truncate">{team.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-4 md:mt-[20.5px] md:grid-cols-2 md:gap-2.5">
        <TeamLineup team={view.home} lineup={home} kit="home" mobileHidden={side !== 'home'} />
        <TeamLineup team={view.away} lineup={away} kit="away" mobileHidden={side !== 'away'} />
      </div>
    </Card>
  );
}

function TeamLineup({
  team,
  lineup,
  kit,
  mobileHidden,
}: {
  team: TeamView;
  lineup: MatchLineup;
  kit: 'home' | 'away';
  mobileHidden: boolean;
}) {
  const t = useTranslations('matchPage');
  const spots = pitchSpots(lineup.starters, lineup.formation);
  const formation = lineup.formation ?? '';
  return (
    <div className={mobileHidden ? 'max-md:hidden' : undefined}>
      <div className="rounded-xl border border-border-subtle p-2 md:p-[9px]">
        <div className="mb-1 flex items-center gap-2.5 px-1 py-1 md:mb-[8.5px] md:gap-4 md:pe-[13.5px] md:ps-3 md:py-0">
          <TeamBadge team={team} size={45} className="max-md:!h-9 max-md:!w-9" />
          <h3 className="min-w-0 flex-1 truncate text-[16.5px] font-bold text-text-primary md:text-[21.5px]">
            {team.name}
          </h3>
          {formation && (
            <span
              className="text-base font-semibold tabular-nums text-text-primary md:text-[20.5px] md:font-medium md:text-text-secondary"
              aria-label={t('formationLabel', { formation })}
            >
              {formation}
            </span>
          )}
        </div>

        <Pitch spots={spots} kit={kit} label={t('pitchLabel', { team: team.name, formation })} />
      </div>

      {/* Substitutes: mobile only, below the pitch (the desktop mockup has none). */}
      {lineup.substitutes.length > 0 && (
        <details className="group mt-3 rounded-xl border border-border-subtle md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-text-primary focus-visible:outline-2 focus-visible:outline-accent-green [&::-webkit-details-marker]:hidden">
            {t('substitutes')}
            <ChevronIcon className="size-[21px] text-text-secondary transition-transform group-open:rotate-180" />
          </summary>
          <ul className="divide-y divide-border-subtle border-t border-border-subtle text-sm">
            {lineup.substitutes.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                <span className="w-6 text-end font-bold tabular-nums text-text-secondary">
                  {p.number}
                </span>
                <span className="text-text-primary">{p.name}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

/** Shirt box aspect (height ÷ width) from icon-measurements.xlsx. Ink W×H is desktop home
 *  54.5×43.4, keeper 54.5×41.4, away 54.5×39.4 (mobile outfield 42.4×34.5, keeper 43.7×35).
 *  The jersey ink spans 46.9×37.8 of the 48×40 viewBox, so the box is ink × 48/46.9 wide
 *  and × 40/37.8 tall: 55.8×45.9 / 55.8×43.8 / 55.8×41.7. Width itself is not fixed: it is
 *  `--mp-shirt-w`, a fraction of the pitch capped by the widest row and the number of
 *  lines, so shirts fill the available space without overlapping. */
const SHIRT_ASPECT = {
  home: 45.9 / 55.8,
  away: 41.7 / 55.8,
  keeper: 43.8 / 55.8,
} as const;

/** Shirt width as a length: min of (70% of pitch/cols, so a 5-across row has a gap),
 *  (88% of the row spacing ÷ 1.14 stack ratio, so a 5-line 4-2-3-1 does not collide
 *  vertically; 1.14 = home aspect 0.823 + name-pill ≈ 0.32), and 90% of the space
 *  below the GK so the name pill stays on the pitch. Row spacing uses the real-pitch
 *  span (GK at 10m, furthest line on the opposition 18-yard line). */
const SHIRT_WIDTH = `min(calc(100cqw / var(--mp-cols) * 0.7), calc(${PITCH_SPAN_Y}cqh / (var(--mp-lines) - 1) * 0.88 / 1.14), calc(${(100 - PITCH_GK_Y) * 2 * 0.9}cqh / 1.14))`;

/** Pitch markings in metres, for a 68×105 viewBox (origin = attacking-end left corner). */
const PA_X = (PITCH.w - PITCH.penaltyAreaW) / 2;
const GA_X = (PITCH.w - PITCH.goalAreaW) / 2;
const ARC_DX = Math.sqrt(PITCH.circleR ** 2 - (PITCH.penaltyAreaD - PITCH.penaltySpot) ** 2);
const CX = PITCH.w / 2;
const MID_Y = PITCH.l / 2;
const SPOT_TOP = PITCH.penaltySpot;
const SPOT_BOT = PITCH.l - PITCH.penaltySpot;
const PA_BOT_Y = PITCH.l - PITCH.penaltyAreaD;
const GA_BOT_Y = PITCH.l - PITCH.goalAreaD;
const ARC_TOP = `M ${CX - ARC_DX} ${PITCH.penaltyAreaD} A ${PITCH.circleR} ${PITCH.circleR} 0 0 1 ${CX + ARC_DX} ${PITCH.penaltyAreaD}`;
const ARC_BOT = `M ${CX - ARC_DX} ${PA_BOT_Y} A ${PITCH.circleR} ${PITCH.circleR} 0 0 1 ${CX + ARC_DX} ${PA_BOT_Y}`;

function Shirt({
  fill,
  number,
  role,
}: {
  fill: string;
  number: number;
  role: keyof typeof SHIRT_ASPECT;
}) {
  return (
    // Mockup jersey: rounded shoulders, short angled sleeves, curved collar notch, dark outline.
    <svg
      viewBox="0 0 48 40"
      preserveAspectRatio="none"
      className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
      style={{
        width: 'var(--mp-shirt-w)',
        height: `calc(var(--mp-shirt-w) * ${SHIRT_ASPECT[role]})`,
      }}
      aria-hidden
    >
      <path
        d="M17 2.5Q24 9 31 2.5L38.5 4.6Q41 5.4 42.3 7.6L46.8 15.3L40 19.6L38 16.8V37.5Q38 39 36.5 39H11.5Q10 39 10 37.5V16.8L8 19.6L1.2 15.3L5.7 7.6Q7 5.4 9.5 4.6Z"
        fill={fill}
        stroke="#1b2733"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 3.6Q24 8.6 29.8 3.6"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.85"
        strokeWidth="1.2"
      />
      <text x="24" y="27.6" textAnchor="middle" fontSize="21" fontWeight="800" fill="#0f1a24">
        {number}
      </text>
    </svg>
  );
}

function Pitch({
  spots,
  kit,
  label,
}: {
  spots: ReturnType<typeof pitchSpots>;
  kit: 'home' | 'away';
  label: string;
}) {
  const colsInRow = new Map<number, number>();
  for (const s of spots) colsInRow.set(s.y, (colsInRow.get(s.y) ?? 0) + 1);
  const maxCols = Math.max(1, ...colsInRow.values());
  const lines = Math.max(colsInRow.size, 2);

  // Real pitch proportions 68×105 (height = width × 105/68) on mobile and desktop.
  // Shirts and pills are a fraction of the pitch, capped by the widest row and the line count.
  return (
    <div
      dir="ltr"
      role="img"
      aria-label={label}
      data-mp-cols={maxCols}
      data-mp-lines={lines}
      className="relative aspect-[68/105] w-full overflow-hidden rounded-lg [container-type:size]"
      style={
        {
          backgroundImage:
            'repeating-linear-gradient(to bottom, var(--mp-pitch-a) 0 12.5%, var(--mp-pitch-b) 12.5% 25%)',
          '--mp-cols': maxCols,
          '--mp-lines': lines,
          '--mp-shirt-w': SHIRT_WIDTH,
        } as CSSProperties
      }
    >
      <svg viewBox={`0 0 ${PITCH.w} ${PITCH.l}`} className="absolute inset-0 size-full" aria-hidden>
        <g fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
          <rect x="0" y="0" width={PITCH.w} height={PITCH.l} vectorEffect="non-scaling-stroke" />
          <line x1="0" y1={MID_Y} x2={PITCH.w} y2={MID_Y} vectorEffect="non-scaling-stroke" />
          <circle cx={CX} cy={MID_Y} r={PITCH.circleR} vectorEffect="non-scaling-stroke" />
          <rect
            x={PA_X}
            y="0"
            width={PITCH.penaltyAreaW}
            height={PITCH.penaltyAreaD}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={GA_X}
            y="0"
            width={PITCH.goalAreaW}
            height={PITCH.goalAreaD}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={PA_X}
            y={PA_BOT_Y}
            width={PITCH.penaltyAreaW}
            height={PITCH.penaltyAreaD}
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x={GA_X}
            y={GA_BOT_Y}
            width={PITCH.goalAreaW}
            height={PITCH.goalAreaD}
            vectorEffect="non-scaling-stroke"
          />
          <path d={ARC_TOP} vectorEffect="non-scaling-stroke" />
          <path d={ARC_BOT} vectorEffect="non-scaling-stroke" />
        </g>
        <g fill="rgba(255,255,255,0.95)">
          <circle cx={CX} cy={MID_Y} r="0.6" />
          <circle cx={CX} cy={SPOT_TOP} r="0.6" />
          <circle cx={CX} cy={SPOT_BOT} r="0.6" />
        </g>
      </svg>
      {spots.map((s) => (
        <div
          key={s.player.id}
          className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `calc(100% / ${maxCols} * 0.9)`,
          }}
        >
          <Shirt
            fill={
              s.isKeeper
                ? 'var(--mp-shirt-keeper)'
                : kit === 'home'
                  ? 'var(--mp-shirt-home)'
                  : 'var(--mp-shirt-away)'
            }
            number={s.player.number}
            role={s.isKeeper ? 'keeper' : kit}
          />
          <span
            className="-mt-px max-w-full truncate bg-white font-semibold leading-tight text-[#0f1a24] shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
            style={{
              fontSize: 'calc(var(--mp-shirt-w) * 0.242)',
              padding: 'calc(var(--mp-shirt-w) * 0.037) calc(var(--mp-shirt-w) * 0.178)',
              borderRadius: 'calc(var(--mp-shirt-w) * 0.09)',
            }}
          >
            {shortPlayerName(s.player.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
