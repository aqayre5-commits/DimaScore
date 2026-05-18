import Link from 'next/link';
import type { DayFixture } from '@/lib/db/queries/fixtures-by-day';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatMatchTime } from '@/lib/utils/date';
import type { Locale } from '@/lib/i18n/config';

interface MatchRowProps {
  fixture: DayFixture;
  locale: string;
}

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

export function MatchRow({ fixture, locale }: MatchRowProps) {
  const isLive = LIVE_STATUSES.has(fixture.statusCode);
  const isFinished = FINISHED_STATUSES.has(fixture.statusCode);

  const homeLabel = getTeamDisplayName(fixture.homeTeam, locale);
  const awayLabel = getTeamDisplayName(fixture.awayTeam, locale);

  const homeWon =
    isFinished &&
    fixture.homeScore != null &&
    fixture.awayScore != null &&
    fixture.homeScore > fixture.awayScore;
  const awayWon =
    isFinished &&
    fixture.homeScore != null &&
    fixture.awayScore != null &&
    fixture.awayScore > fixture.homeScore;

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className="flex items-center gap-2 border-b border-border-subtle px-3 py-2 text-base transition-colors hover:bg-bg-surface-2"
    >
      {/* Time / status */}
      <div className="w-12 shrink-0 text-center">
        {isLive ? (
          <span className="flex items-center justify-center gap-1 text-xs font-bold text-score-live">
            <span className="live-pulse size-1.5 rounded-full bg-score-live" />
            {fixture.statusCode === 'HT' ? 'HT' : `${fixture.minute ?? ''}'`}
          </span>
        ) : isFinished ? (
          <span className="text-xs text-text-tertiary">
            {fixture.statusCode === 'PEN' ? 'Pen' : 'FT'}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary">
            {formatMatchTime(fixture.kickoffAt, locale as Locale)}
          </span>
        )}
      </div>

      {/* Home team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 justify-end">
        <span
          className={`overflow-hidden text-ellipsis whitespace-nowrap text-base ${
            isLive
              ? 'font-medium text-text-primary'
              : awayWon
                ? 'text-text-tertiary'
                : 'text-text-primary'
          }`}
        >
          {homeLabel}
        </span>
        {fixture.homeTeam?.logoUrl ? (
          <img
            src={fixture.homeTeam.logoUrl}
            alt=""
            className="h-4 w-4 shrink-0 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {fixture.homeTeam?.code?.slice(0, 2) ?? '??'}
          </span>
        )}
      </div>

      {/* Score or vs */}
      <div className="w-10 shrink-0 text-center tabular-nums">
        {isLive || isFinished ? (
          <span
            className={`text-sm font-semibold ${isLive ? 'text-score-live' : 'text-text-primary'}`}
          >
            {fixture.homeScore ?? 0} - {fixture.awayScore ?? 0}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {fixture.awayTeam?.logoUrl ? (
          <img
            src={fixture.awayTeam.logoUrl}
            alt=""
            className="h-4 w-4 shrink-0 object-contain"
            loading="lazy"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {fixture.awayTeam?.code?.slice(0, 2) ?? '??'}
          </span>
        )}
        <span
          className={`overflow-hidden text-ellipsis whitespace-nowrap text-base ${
            isLive
              ? 'font-medium text-text-primary'
              : homeWon
                ? 'text-text-tertiary'
                : 'text-text-primary'
          }`}
        >
          {awayLabel}
        </span>
      </div>
    </Link>
  );
}
