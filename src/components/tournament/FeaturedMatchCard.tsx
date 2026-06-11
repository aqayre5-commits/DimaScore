'use client';

import Image from 'next/image';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { useTranslations } from 'next-intl';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { KickoffCountdown } from '@/components/shared/KickoffCountdown';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface FeaturedMatchCardProps {
  fixture: FixtureWithTeams;
  locale: Locale;
}

function resolveTeamCode(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '—';
  return (
    team.code ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    (team.name[locale] ?? team.name['en'] ?? '—').slice(0, 3).toUpperCase()
  );
}

function formatHeaderDate(date: Date, locale: Locale): string {
  const formatted = formatMatchDate(date, locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = formatMatchTime(date, locale);
  return `${formatted.toUpperCase()} · ${time}`;
}

export function FeaturedMatchCard({ fixture, locale }: FeaturedMatchCardProps) {
  const t = useTranslations('leaguePage');
  const { homeTeam, awayTeam, kickoffAt, venue } = fixture;

  // Overlay the shared live poll so the card flips to a live/final score when the match
  // starts or ends, instead of staying frozen on the SSR snapshot + countdown.
  const patch = useLiveFixtures().get(fixture.id);
  const statusCode = patch?.statusCode ?? fixture.statusCode;
  const homeScore = patch?.homeScore ?? fixture.homeScore;
  const awayScore = patch?.awayScore ?? fixture.awayScore;
  const homeScorePen = patch?.homeScorePen ?? fixture.homeScorePen;
  const awayScorePen = patch?.awayScorePen ?? fixture.awayScorePen;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const state = getMatchState(statusCode, kickoffAt);
  const isFinished = state === 'finished';
  const isLive = state === 'live';

  const headerDate = formatHeaderDate(kickoffAt, locale);

  const preview = previewFromFixtureRow({
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    statusCode,
    kickoffAt,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <MatchLink
        matchId={String(fixture.id)}
        href={`/${locale}/match/${fixture.id}`}
        preview={preview}
        prefetchIntent
        className="flex h-full flex-col transition-colors hover:bg-accent-azure/5"
      >
        {/* Live banner */}
        {isLive && (
          <div className="bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent-emerald">
              {t('featuredMatch')}
            </span>
          </div>
        )}

        {/* Date + time header */}
        <div className="px-4 pt-2 pb-1 text-center">
          <span className="text-xs tabular-nums text-text-tertiary" suppressHydrationWarning>
            {headerDate}
          </span>
        </div>

        {/* Teams + Score/VS */}
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2">
          {/* Home */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            {homeTeam?.logoUrl ? (
              <Image
                src={homeTeam.logoUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {homeCode}
              </div>
            )}
            <span className="max-w-full truncate text-xs font-semibold text-text-primary">
              {homeCode}
            </span>
          </div>

          {/* Center: Score or VS — fixed height for consistent logo alignment */}
          <div className="flex min-h-[48px] flex-col items-center justify-center text-center">
            {isFinished || isLive ? (
              <>
                <div
                  className={`text-xl font-bold tabular-nums ${isLive ? 'text-score-live' : 'text-text-primary'}`}
                >
                  {homeScore != null && awayScore != null ? `${homeScore} - ${awayScore}` : '- : -'}
                </div>
                {isLive ? (
                  <div className="mt-1 flex items-center justify-center gap-1">
                    <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
                    <span className="text-xs font-semibold text-score-live">
                      {statusCode === 'HT' ? 'HT' : statusCode}
                    </span>
                  </div>
                ) : (
                  <span className="mt-0.5 inline-block rounded bg-bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-text-tertiary">
                    {statusCode === 'AET'
                      ? 'AET'
                      : statusCode === 'PEN'
                        ? homeScorePen != null && awayScorePen != null
                          ? `PEN ${homeScorePen}-${awayScorePen}`
                          : 'PEN'
                        : 'FT'}
                  </span>
                )}
              </>
            ) : (
              <span className="text-xl font-bold text-text-tertiary">VS</span>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center justify-center gap-1.5 text-center">
            {awayTeam?.logoUrl ? (
              <Image
                src={awayTeam.logoUrl}
                alt=""
                width={40}
                height={40}
                className="size-10 object-contain"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {awayCode}
              </div>
            )}
            <span className="max-w-full truncate text-xs font-semibold text-text-primary">
              {awayCode}
            </span>
          </div>
        </div>

        {/* Footer zone */}
        <div className="flex h-[48px] flex-col items-center justify-center">
          {isLive ? (
            <MatchProgressBar statusCode={statusCode} />
          ) : !isFinished ? (
            <KickoffCountdown kickoffAt={kickoffAt} compact />
          ) : venue && (venue.name || venue.city) ? (
            <p className="text-xs text-text-tertiary">{venue.name ?? venue.city}</p>
          ) : null}
        </div>
      </MatchLink>
    </div>
  );
}

/** Visual timeline dots for a live match. */
function MatchProgressBar({ statusCode }: { statusCode: string }) {
  const segments = 10;
  let filled = 5;
  if (statusCode === '1H') filled = 3;
  else if (statusCode === 'HT') filled = 5;
  else if (statusCode === '2H') filled = 7;
  else if (statusCode === 'ET') filled = 9;
  else if (statusCode === 'P' || statusCode === 'BT') filled = 10;

  return (
    <div className="flex items-center justify-center gap-1 px-4 py-2">
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full ${
            i < filled
              ? i < filled - 1
                ? 'bg-accent-emerald'
                : 'animate-pulse bg-accent-emerald'
              : 'bg-bg-surface-3'
          }`}
        />
      ))}
    </div>
  );
}
