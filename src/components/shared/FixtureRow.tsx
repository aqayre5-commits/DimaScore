import Link from 'next/link';
import { codeToFlag } from '@/lib/flags';
import { formatMatchTime } from '@/lib/utils/date';
import type { Locale } from '@/lib/i18n/config';

interface FixtureTeam {
  name: Record<string, string>;
  shortName: Record<string, string>;
  code: string | null;
  countryCode: string | null;
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
  locale: Locale;
}

/**
 * Shared fixture row used across competition, team, and match list views.
 * 3 states: upcoming (TBD score), live (animated dot), finished (bold score).
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
  locale,
}: FixtureRowProps) {
  const isFinished = statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN';
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(statusCode);
  const isUpcoming = !isFinished && !isLive;

  const time = formatMatchTime(kickoffAt, locale);

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);
  const homeFlag =
    homeTeam?.isNational && homeTeam.countryCode ? codeToFlag(homeTeam.countryCode) : null;
  const awayFlag =
    awayTeam?.isNational && awayTeam.countryCode ? codeToFlag(awayTeam.countryCode) : null;

  const homeWon = isFinished && homeScore != null && awayScore != null && homeScore > awayScore;
  const awayWon = isFinished && awayScore != null && homeScore != null && awayScore > homeScore;

  return (
    <Link
      href={`/${locale}/match/${fixtureId}`}
      className="flex items-center gap-2 py-2 text-base transition-colors hover:bg-bg-surface-2"
    >
      {/* Time / status column */}
      <div className="w-12 shrink-0 text-center">
        {isLive ? (
          <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent-emerald">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
            {statusCode === 'HT' ? 'HT' : statusCode}
          </span>
        ) : isUpcoming ? (
          <span className="text-xs tabular-nums text-text-secondary">{time}</span>
        ) : (
          <span className="text-xs text-text-tertiary">FT</span>
        )}
      </div>

      {/* Home team: [flag] [full name] */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {homeFlag && <span className="shrink-0 text-sm leading-none">{homeFlag}</span>}
        <span
          className={`overflow-hidden text-ellipsis whitespace-nowrap ${homeWon ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
        >
          {homeName}
        </span>
      </div>

      {/* Score */}
      <div className="w-12 shrink-0 text-center tabular-nums">
        {isUpcoming ? (
          <span className="text-xs text-text-tertiary">&ndash;</span>
        ) : (
          <span
            className={`text-base font-semibold ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
          >
            {homeScore ?? 0} - {awayScore ?? 0}
          </span>
        )}
      </div>

      {/* Away team: [full name] [flag] */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span
          className={`overflow-hidden text-ellipsis whitespace-nowrap ${awayWon ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
        >
          {awayName}
        </span>
        {awayFlag && <span className="shrink-0 text-sm leading-none">{awayFlag}</span>}
      </div>
    </Link>
  );
}

/** Full localized name: name[locale] → name['en'] → shortName[locale] → shortName['en'] → code → '—' */
function resolveFullName(team: FixtureTeam | null, locale: Locale): string {
  if (!team) return '\u2014';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '\u2014'
  );
}
