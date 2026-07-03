'use client';

import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { getTeamFlagUrl } from '@/lib/team-display';
import { LocalTime } from '@/components/shared/LocalTime';
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
  /** Competition label (logo + name) — shown ONLY on mobile and ONLY for multi-competition lists
   *  (e.g. team page, mixed lists). Omit on single-competition pages (it's in the hero). */
  competition?: { name: string; logoUrl: string | null };
}

/**
 * Shared fixture row used across competition, team, and match list views.
 *
 * Single layout at all breakpoints: optional competition header, then teams home-over-away with full names
 * and per-team scores on the left, a vertical divider, and time/status on the right (the date
 * lives in the group header, so it isn't repeated here). Loser dimmed.
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
  competition,
}: FixtureRowProps) {
  const t = useTranslations('matchDetail');
  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;
  const showPenScore = statusCode === 'PEN' && homeScorePen != null && awayScorePen != null;
  const homeWon = isFinished && hasScore && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWon = isFinished && hasScore && (awayScore ?? 0) > (homeScore ?? 0);

  const time = <LocalTime date={kickoffAt} locale={locale} format="time" />;

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
      : statusCode === 'P'
        ? 'PEN'
        : statusCode
    : isFinished
      ? statusCode === 'AET'
        ? t('extraTime')
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
      {/* ── Single layout (all breakpoints): competition header (multi-comp lists only) + teams · divider · meta ── */}
      <div>
        {competition && (
          <div className="flex items-center gap-1.5 pt-1.5 text-xs text-text-tertiary">
            {competition.logoUrl && (
              <CompetitionLogo
                src={competition.logoUrl}
                size={16}
                className="size-4 shrink-0 object-contain"
              />
            )}
            <span className="truncate">{competition.name}</span>
          </div>
        )}

        <div className="flex items-stretch gap-3 py-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              <TeamBadge team={homeTeam} flag={homeFlag} big />
              <span
                className={`min-w-0 flex-1 truncate text-base ${awayWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
              >
                {homeName}
              </span>
              {hasScore && (
                <span
                  className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : awayWon ? 'text-text-tertiary' : 'text-text-primary'}`}
                >
                  {homeScore}
                  {showPenScore && (
                    <span className="text-xs font-semibold text-text-tertiary">
                      {' '}
                      ({homeScorePen})
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              <TeamBadge team={awayTeam} flag={awayFlag} big />
              <span
                className={`min-w-0 flex-1 truncate text-base ${homeWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
              >
                {awayName}
              </span>
              {hasScore && (
                <span
                  className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : homeWon ? 'text-text-tertiary' : 'text-text-primary'}`}
                >
                  {awayScore}
                  {showPenScore && (
                    <span className="text-xs font-semibold text-text-tertiary">
                      {' '}
                      ({awayScorePen})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="w-px shrink-0 self-stretch bg-border-subtle" />

          <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight">
            {isLive ? (
              <span className="text-sm font-bold tabular-nums text-score-live">{statusLabel}</span>
            ) : isFinished ? (
              <span className="text-xs font-medium text-text-tertiary">
                {statusLabel || t('fullTime')}
              </span>
            ) : (
              <span className="text-sm tabular-nums text-text-secondary" suppressHydrationWarning>
                {time}
              </span>
            )}
            {showPenScore && (
              <span className="mt-0.5 text-[9px] font-semibold uppercase text-text-tertiary">
                {t('penalties')}
              </span>
            )}
          </div>
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
  const flagOrLogo = getTeamFlagUrl(team);
  if (flagOrLogo) {
    return (
      <TeamLogo
        src={flagOrLogo}
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
