'use client';

import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { ShareButton } from '@/components/shared/ShareButton';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface FeaturedMatchCardProps {
  fixture: FixtureWithTeams;
  locale: Locale;
  cardTitle: string;
  shareHash?: string;
}

function resolveFullName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '\u2014';
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.name[locale] ??
    team.name['en'] ??
    team.code ??
    '\u2014'
  );
}

function TeamBadge({ team, locale }: { team: FixtureWithTeams['homeTeam']; locale: Locale }) {
  if (!team) return null;
  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;
  const name = resolveFullName(team, locale);

  return (
    <div className="flex flex-1 flex-col items-center gap-2 text-center min-w-0">
      {flag ? (
        <span className="text-3xl leading-none">{flag}</span>
      ) : team.logoUrl ? (
        <img src={team.logoUrl} alt="" className="size-10 object-contain" loading="lazy" />
      ) : (
        <div className="flex size-10 items-center justify-center rounded-full bg-bg-surface-2 text-sm font-bold text-text-tertiary">
          {(name[0] ?? '?').toUpperCase()}
        </div>
      )}
      <span className="text-[13px] font-medium leading-tight text-text-primary truncate w-full">
        {name}
      </span>
    </div>
  );
}

export function FeaturedMatchCard({
  fixture,
  locale,
  cardTitle,
  shareHash,
}: FeaturedMatchCardProps) {
  const t = useTranslations('shared');
  const { homeTeam, awayTeam, kickoffAt, venue, statusCode, homeScore, awayScore } = fixture;

  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isDone = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;

  const kickoffDate = formatMatchDate(kickoffAt, locale);
  const kickoffTime = formatMatchTime(kickoffAt, locale);

  const now = new Date();
  const ko = new Date(kickoffAt);
  const isToday =
    ko.getFullYear() === now.getFullYear() &&
    ko.getMonth() === now.getMonth() &&
    ko.getDate() === now.getDate();

  return (
    <div id={shareHash} className="relative rounded-xl border border-border-subtle bg-bg-surface">
      {shareHash && (
        <div className="absolute end-2 top-2 z-10">
          <ShareButton title={cardTitle || t('match')} hash={shareHash} />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 px-4 py-5">
        {/* Score or Kickoff */}
        {(isDone || isLive) && hasScore ? (
          <div className="text-center">
            <p
              className={`text-2xl font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {homeScore} - {awayScore}
            </p>
            {isLive ? (
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
                <span className="text-xs font-semibold text-accent-emerald">{statusCode}</span>
              </div>
            ) : (
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">FT</p>
            )}
            {!isToday && (
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-text-tertiary">
                {kickoffDate}
              </p>
            )}
          </div>
        ) : (isDone || isLive) && !hasScore ? (
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-text-primary">{kickoffTime}</p>
            <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
              {isDone ? 'FT' : statusCode}
            </p>
            {!isToday && (
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-text-tertiary">
                {kickoffDate}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums text-text-primary">{kickoffTime}</p>
            {!isToday && (
              <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                {kickoffDate}
              </p>
            )}
          </div>
        )}

        {/* Teams */}
        <div className="flex w-full items-center gap-3">
          <TeamBadge team={homeTeam} locale={locale} />
          {(isDone || isLive) && hasScore ? (
            <span className="shrink-0" />
          ) : (
            <span className="shrink-0 text-[11px] font-semibold uppercase text-text-tertiary">
              vs
            </span>
          )}
          <TeamBadge team={awayTeam} locale={locale} />
        </div>

        {/* Venue */}
        {venue && (venue.name || venue.city) && (
          <p className="text-[11px] text-text-tertiary">
            {[venue.name, venue.city].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
