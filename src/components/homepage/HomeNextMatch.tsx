'use client';

import Link from 'next/link';
import { Play } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatKickoff } from '@/lib/utils/date';
import type { RightRailFixture, GoalEvent } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  match: RightRailFixture;
  goals: GoalEvent[];
  locale: Locale;
  labels: {
    nextMatch: string;
    liveNow: string;
    viewMatch: string;
  };
}

const LIVE_CODES = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];

export function HomeNextMatch({ match, goals, locale, labels }: Props) {
  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const isLive = LIVE_CODES.includes(match.statusCode);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {isLive ? labels.liveNow : labels.nextMatch}
        </h2>
        {isLive && (
          <span className="flex items-center gap-1 rounded-full bg-score-live/10 px-2 py-0.5 text-[11px] font-bold text-score-live">
            <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
            {match.statusCode === 'HT' ? 'HT' : `${match.minute ?? ''}'`}
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        {/* Competition + round */}
        <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
          {match.competition.logoUrl && (
            <img
              src={match.competition.logoUrl}
              alt=""
              className="size-3.5 object-contain"
              loading="lazy"
            />
          )}
          <span className="truncate">{compName}</span>
          {match.round && <span> · {match.round}</span>}
        </div>

        {/* Kickoff time for upcoming */}
        {!isLive && (
          <div className="mt-2 text-center text-xs text-text-secondary">
            {formatKickoff(match.kickoffAt, locale)}
          </div>
        )}

        {/* Teams + score/VS */}
        <div className="mt-3 flex items-center justify-center gap-3">
          {/* Home */}
          <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            {match.homeTeam?.logoUrl ? (
              <img
                src={match.homeTeam.logoUrl}
                alt=""
                className="size-9 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {homeName[0]}
              </div>
            )}
            <span className="w-full truncate text-center text-[11px] font-medium text-text-primary">
              {homeName}
            </span>
          </div>

          {/* Score or VS */}
          <div className="shrink-0 text-center">
            {isLive ? (
              <p className="text-2xl font-bold tabular-nums text-text-primary">
                {match.homeScore ?? 0} - {match.awayScore ?? 0}
              </p>
            ) : (
              <p className="text-lg font-semibold text-text-tertiary">VS</p>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-1 flex-col items-center gap-1.5 min-w-0">
            {match.awayTeam?.logoUrl ? (
              <img
                src={match.awayTeam.logoUrl}
                alt=""
                className="size-9 object-contain"
                loading="lazy"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {awayName[0]}
              </div>
            )}
            <span className="w-full truncate text-center text-[11px] font-medium text-text-primary">
              {awayName}
            </span>
          </div>
        </div>

        {/* Venue for upcoming */}
        {!isLive && match.venueName && (
          <div className="mt-2 text-center text-[11px] text-text-tertiary">
            {match.venueName}
            {match.venueCity ? `, ${match.venueCity}` : ''}
          </div>
        )}

        {/* Goal scorers for live */}
        {isLive && goals.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span className="size-1 rounded-full bg-text-tertiary" />
                <span className="tabular-nums text-text-tertiary">{g.minute}&apos;</span>
                <span>{g.playerName}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link
          href={`/${locale}/match/${match.id}`}
          className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors ${
            isLive
              ? 'bg-accent-green text-white hover:bg-accent-green-deep'
              : 'border border-accent-azure/30 bg-accent-azure/10 text-accent-azure hover:bg-accent-azure/20'
          }`}
        >
          {isLive && <Play className="size-3.5 fill-current" />}
          {labels.viewMatch}
        </Link>
      </div>
    </div>
  );
}
