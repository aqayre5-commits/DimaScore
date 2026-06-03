import type { DayFixture } from '@/lib/db/queries/fixtures-by-day';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromDayFixture } from '@/lib/match-header-preview';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo } from '@/components/shared/Logo';

interface MatchRowProps {
  fixture: DayFixture;
  locale: string;
  enablePrefetch?: boolean;
  competition?: { name: Record<string, string>; slug: string } | null;
}

export function MatchRow({ fixture, locale, enablePrefetch, competition }: MatchRowProps) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';

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

  const preview = previewFromDayFixture(fixture, competition);

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={preview}
      prefetchIntent={enablePrefetch}
      ariaLabel={`${homeLabel} vs ${awayLabel}`}
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
          <TeamLogo
            src={fixture.homeTeam.logoUrl}
            size={16}
            className="h-4 w-4 shrink-0 object-contain"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {fixture.homeTeam?.code?.slice(0, 2) ?? '—'}
          </span>
        )}
      </div>

      {/* Score or vs */}
      <div className="w-10 shrink-0 text-center tabular-nums">
        {fixture.homeScore != null && fixture.awayScore != null ? (
          <span
            className={`text-sm font-semibold ${isLive ? 'text-score-live' : 'text-text-primary'}`}
          >
            {fixture.homeScore} - {fixture.awayScore}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">{isFinished ? '–' : 'vs'}</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {fixture.awayTeam?.logoUrl ? (
          <TeamLogo
            src={fixture.awayTeam.logoUrl}
            size={16}
            className="h-4 w-4 shrink-0 object-contain"
          />
        ) : (
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {fixture.awayTeam?.code?.slice(0, 2) ?? '—'}
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
    </MatchLink>
  );
}
