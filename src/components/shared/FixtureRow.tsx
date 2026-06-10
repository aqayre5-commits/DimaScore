'use client';

import { TeamLogo } from '@/components/shared/Logo';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import type { Locale } from '@/lib/i18n/config';

interface FixtureTeam {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
  logoUrl?: string | null;
  isNational: boolean | null;
}

interface FixtureRowProps {
  fixtureId: number;
  kickoffAt: Date;
  statusCode: string;
  homeTeam: FixtureTeam | null;
  awayTeam: FixtureTeam | null;
  homeScore: number | null;
  awayScore: number | null;
  homeScorePen?: number | null;
  awayScorePen?: number | null;
  locale: Locale;
}

/**
 * Shared fixture row used across competition, team, and match list views.
 *
 * Responsive: HORIZONTAL on desktop (HOME [flag][name] … score … [name][flag] AWAY);
 * STACKED on mobile, matching the homepage row — time/status on the left, home over away
 * with full names (no truncation), per-team scores stacked on the right (or "VS"), loser dimmed.
 */
export function FixtureRow({
  fixtureId,
  kickoffAt,
  statusCode,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  homeScorePen = null,
  awayScorePen = null,
  locale,
}: FixtureRowProps) {
  const t = useTranslations('matchDetail');
  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;
  const showPenScore = statusCode === 'PEN' && homeScorePen != null && awayScorePen != null;
  const homeWon = isFinished && hasScore && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = isFinished && hasScore && (awayScore ?? 0) > (homeScore ?? 0);

  const time = formatMatchTime(kickoffAt, locale);

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);
  const homeFlag =
    homeTeam?.isNational && homeTeam.countryCode ? codeToFlag(homeTeam.countryCode) : null;
  const awayFlag =
    awayTeam?.isNational && awayTeam.countryCode ? codeToFlag(awayTeam.countryCode) : null;

  const preview = previewFromFixtureRow({
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    statusCode,
    kickoffAt,
  });

  const statusLabel = isLive
    ? statusCode === 'HT'
      ? t('halfTime')
      : statusCode
    : isFinished
      ? statusCode === 'AET'
        ? t('extraTime')
        : statusCode === 'PEN'
          ? ''
          : t('fullTime')
      : null;

  return (
    <MatchLink
      matchId={String(fixtureId)}
      href={`/${locale}/match/${fixtureId}`}
      preview={preview}
      prefetchIntent
      ariaLabel={`${homeName} vs ${awayName}`}
      className="block rounded-md text-base transition-colors hover:bg-bg-surface-2"
    >
      {/* ── Desktop: horizontal ── */}
      <div className="hidden items-center gap-2 py-2 md:flex">
        <div className="w-12 shrink-0 text-center">
          {isLive ? (
            <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent-emerald">
              <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
              {statusLabel}
            </span>
          ) : isFinished ? (
            <span className="text-xs text-text-tertiary">{statusLabel}</span>
          ) : (
            <span className="text-xs tabular-nums text-text-secondary" suppressHydrationWarning>
              {time}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <TeamBadge team={homeTeam} flag={homeFlag} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
            {homeName}
          </span>
        </div>

        <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight tabular-nums">
          {hasScore ? (
            <span
              className={`text-base font-semibold ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span className="text-xs text-text-tertiary">- : -</span>
          )}
          {showPenScore && (
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase text-text-tertiary">
              {t('penalties')} {homeScorePen}-{awayScorePen}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
            {awayName}
          </span>
          <TeamBadge team={awayTeam} flag={awayFlag} />
        </div>
      </div>

      {/* ── Mobile: stacked, matching the homepage row ── */}
      <div className="flex items-center gap-3 py-2 md:hidden">
        {/* Time / status */}
        <div className="w-12 shrink-0 text-center">
          {isLive ? (
            <span className="text-sm font-bold tabular-nums text-score-live">{statusLabel}</span>
          ) : isFinished ? (
            <span className="text-xs font-medium text-text-tertiary">{statusLabel}</span>
          ) : (
            <span className="text-sm tabular-nums text-text-secondary" suppressHydrationWarning>
              {time}
            </span>
          )}
        </div>

        {/* Teams — home over away, full names */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <TeamBadge team={homeTeam} flag={homeFlag} big />
            <span
              className={`truncate text-base ${awayWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
            >
              {homeName}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <TeamBadge team={awayTeam} flag={awayFlag} big />
            <span
              className={`truncate text-base ${homeWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
            >
              {awayName}
            </span>
          </div>
        </div>

        {/* Per-team scores stacked, or VS for upcoming */}
        <div className="w-8 shrink-0 text-center text-base font-bold tabular-nums">
          {hasScore ? (
            <div className="space-y-2">
              <div
                className={
                  isLive ? 'text-score-live' : awayWon ? 'text-text-tertiary' : 'text-text-primary'
                }
              >
                {homeScore}
              </div>
              <div
                className={
                  isLive ? 'text-score-live' : homeWon ? 'text-text-tertiary' : 'text-text-primary'
                }
              >
                {awayScore}
              </div>
              {showPenScore && (
                <div className="text-[9px] font-semibold uppercase text-text-tertiary">
                  ({homeScorePen}-{awayScorePen})
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-text-tertiary">VS</span>
          )}
        </div>
      </div>
    </MatchLink>
  );
}

function TeamBadge({
  team,
  flag,
  big = false,
}: {
  team: FixtureTeam | null;
  flag: string | null;
  big?: boolean;
}) {
  const box = big ? 'size-6' : 'size-5';
  if (team?.logoUrl) {
    return (
      <TeamLogo
        src={team.logoUrl}
        size={big ? 24 : 20}
        className={`${box} shrink-0 object-contain`}
      />
    );
  }
  if (flag) {
    return <span className={`shrink-0 leading-none ${big ? 'text-lg' : 'text-sm'}`}>{flag}</span>;
  }
  return <span className={`inline-block ${box} shrink-0 rounded bg-bg-surface-2`} />;
}

/** Full localized name: name[locale] → name['en'] → shortName[locale] → shortName['en'] → code → '—' */
function resolveFullName(team: FixtureTeam | null, locale: Locale): string {
  if (!team) return '—';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '—'
  );
}
