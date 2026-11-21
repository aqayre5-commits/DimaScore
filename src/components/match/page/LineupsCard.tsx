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
              className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-[17.5px] focus-visible:outline-2 focus-visible:outline-accent-green ${
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

      <div className="mt-2.5 grid grid-cols-1 gap-4 md:mt-[20.5px] md:grid-cols-2 md:gap-2.5">
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
        <div className="mb-2 flex items-center gap-2.5 px-1 py-1 md:mb-[8.5px] md:gap-4 md:pe-[13.5px] md:ps-3 md:py-0">
          <TeamBadge team={team} size={45} className="max-md:!h-10 max-md:!w-10" />
          <h3 className="min-w-0 flex-1 truncate text-lg font-bold text-text-primary md:text-[21.5px]">
            {team.name}
          </h3>
          {formation && (
            <span
              className="text-[17.5px] font-semibold tabular-nums text-text-primary md:text-[20.5px] md:font-medium md:text-text-secondary"
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
            <ChevronIcon className="text-text-secondary transition-transform group-open:rotate-180" />
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

function Shirt({ fill, number }: { fill: string; number: number }) {
  return (
    <svg
      viewBox="0 0 32 30"
      className="h-10 w-11 drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)] md:h-9 md:w-[43px]"
      aria-hidden
    >
      <path
        d="M10 2l-8 4 3 7 4-2v17h14V11l4 2 3-7-8-4c-1 2.5-3.4 4-6 4s-5-1.5-6-4z"
        fill={fill}
        stroke="rgba(15,26,36,0.35)"
        strokeWidth="1"
      />
      <text x="16" y="21.5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f1a24">
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
  return (
    <div
      dir="ltr"
      role="img"
      aria-label={label}
      className="relative aspect-[382/422] w-full overflow-hidden rounded-lg md:aspect-[68/66]"
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
        <g fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.35">
          <rect x="1" y="1" width="66" height="64" />
          <line x1="1" y1="33" x2="67" y2="33" />
          <rect x="16" y="1" width="36" height="10" />
          <rect x="26" y="1" width="16" height="4" />
          <rect x="16" y="55" width="36" height="10" />
          <rect x="26" y="61" width="16" height="4" />
        </g>
      </svg>
      {/* Centre circle in its own square box so it stays round at the taller mobile ratio. */}
      <svg
        viewBox="0 0 14 14"
        className="absolute left-1/2 top-1/2 aspect-square w-[20.6%] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        aria-hidden
      >
        <circle cx="7" cy="7" r="7" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.35" />
      </svg>
      {spots.map((s) => (
        <div
          key={s.player.id}
          className="absolute flex w-[27%] -translate-x-1/2 md:w-[22%] -translate-y-1/2 flex-col items-center gap-0.5 md:gap-0"
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
          />
          <span className="max-w-full truncate rounded bg-white px-2 py-0.5 text-[13px] font-semibold leading-tight text-[#0f1a24] shadow-sm md:px-3 md:py-0.5 md:text-[13px]">
            {shortPlayerName(s.player.name)}
          </span>
        </div>
      ))}
    </div>
  );
}
