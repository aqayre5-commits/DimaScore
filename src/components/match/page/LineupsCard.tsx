'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchLineup } from '@/lib/db/queries/match-detail';
import { pitchSpots, shortPlayerName } from '@/lib/match/match-view';
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

/** Box sizes from icon-measurements.xlsx (ink W×H): mobile outfield 42.4×34.5, keeper 43.7×35;
 *  desktop home 54.5×43.4, keeper 54.5×41.4, away (white) 54.5×39.4. The jersey ink spans
 *  46.9×37.8 of the 48×40 viewBox, so box = ink × 48/46.9 wide and × 40/37.8 tall. */
const SHIRT_BOX = {
  home: 'h-[36.5px] w-[43.4px] md:h-[45.9px] md:w-[55.8px]',
  away: 'h-[36.5px] w-[43.4px] md:h-[41.7px] md:w-[55.8px]',
  keeper: 'h-[37px] w-[44.7px] md:h-[43.8px] md:w-[55.8px]',
} as const;

function Shirt({
  fill,
  number,
  role,
}: {
  fill: string;
  number: number;
  role: keyof typeof SHIRT_BOX;
}) {
  return (
    // Mockup jersey: rounded shoulders, short angled sleeves, curved collar notch, dark outline.
    <svg
      viewBox="0 0 48 40"
      preserveAspectRatio="none"
      className={`${SHIRT_BOX[role]} drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]`}
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
  // Desktop: the card spans the scoreboard width; cap each pitch at the 886px-card
  // size (398×386, aspect 68/66) and centre it in the full-width team panel so the
  // pitch does not grow taller. Mobile is unchanged (w-full, aspect 382/422).
  return (
    <div
      dir="ltr"
      role="img"
      aria-label={label}
      className="relative aspect-[382/422] w-full overflow-hidden rounded-lg md:mx-auto md:max-w-[398px] md:aspect-[68/66]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(to bottom, var(--mp-pitch-a) 0 12.5%, var(--mp-pitch-b) 12.5% 25%)',
      }}
    >
      <svg
        viewBox="0 0 68 66"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <g fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2">
          <rect x="1" y="1" width="66" height="64" vectorEffect="non-scaling-stroke" />
          <line x1="1" y1="33" x2="67" y2="33" vectorEffect="non-scaling-stroke" />
          <rect x="16" y="1" width="36" height="10" vectorEffect="non-scaling-stroke" />
          <rect x="26" y="1" width="16" height="4" vectorEffect="non-scaling-stroke" />
          <rect x="16" y="55" width="36" height="10" vectorEffect="non-scaling-stroke" />
          <rect x="26" y="61" width="16" height="4" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {/* Centre circle in its own square box so it stays round at the taller mobile ratio. */}
      <svg
        viewBox="0 0 14 14"
        className="absolute left-1/2 top-1/2 aspect-square w-[20.6%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        aria-hidden
      >
        <circle
          cx="7"
          cy="7"
          r="7"
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {spots.map((s) => (
        <div
          key={s.player.id}
          className="absolute flex w-[25%] -translate-x-1/2 -translate-y-1/2 flex-col items-center md:w-[25%]"
          style={{ left: `${s.x}%`, top: `${s.y}%` }}
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
          <span className="-mt-px max-w-full truncate rounded-[5px] bg-white px-1.5 py-0.5 text-[12.5px] font-semibold leading-tight text-[#0f1a24] shadow-[0_1px_2px_rgba(0,0,0,0.18)] md:px-2.5 md:text-[13.5px]">
            {shortPlayerName(s.player.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
