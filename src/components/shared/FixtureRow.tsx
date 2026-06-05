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
 * States: upcoming (time), live (animated dot), finished (score). Shootouts
 * show the pen score stacked under the regulation score; no winner emphasis —
 * the score line differentiates the teams.
 *
 * Layout: HOME [flag] [full name] ... score ... [full name] [flag] AWAY
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

  return (
    <MatchLink
      matchId={String(fixtureId)}
      href={`/${locale}/match/${fixtureId}`}
      preview={preview}
      prefetchIntent
      ariaLabel={`${homeName} vs ${awayName}`}
      className="flex items-center gap-2 rounded-md py-2 text-base transition-colors hover:bg-bg-surface-2"
    >
      {/* Time / status column */}
      <div className="w-12 shrink-0 text-center">
        {isLive ? (
          <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent-emerald">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
            {statusCode === 'HT' ? t('halfTime') : statusCode}
          </span>
        ) : isFinished ? (
          <span className="text-xs text-text-tertiary">
            {statusCode === 'AET' ? t('extraTime') : statusCode === 'PEN' ? '' : t('fullTime')}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary" suppressHydrationWarning>
            {time}
          </span>
        )}
      </div>

      {/* Home team: [logo/flag] [full name] */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <TeamBadge team={homeTeam} flag={homeFlag} />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
          {homeName}
        </span>
      </div>

      {/* Score, with pen score stacked beneath for shootouts */}
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

      {/* Away team: [full name] [logo/flag] */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-text-primary">
          {awayName}
        </span>
        <TeamBadge team={awayTeam} flag={awayFlag} />
      </div>
    </MatchLink>
  );
}

function TeamBadge({ team, flag }: { team: FixtureTeam | null; flag: string | null }) {
  if (team?.logoUrl) {
    return <TeamLogo src={team.logoUrl} size={20} className="size-5 shrink-0 object-contain" />;
  }
  if (flag) {
    return <span className="shrink-0 text-sm leading-none">{flag}</span>;
  }
  return <span className="inline-block size-5 shrink-0 rounded bg-bg-surface-2" />;
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
