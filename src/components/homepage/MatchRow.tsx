import Link from 'next/link';
import type { DayFixture } from '@/lib/db/queries/fixtures-by-day';

interface MatchRowProps {
  fixture: DayFixture;
  locale: string;
}

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

function getTeamLabel(
  team: {
    shortName: Record<string, string>;
    name: Record<string, string>;
    code: string | null;
  } | null,
  locale: string,
): string {
  if (!team) return '???';
  return (
    team.shortName[locale] ||
    team.name[locale] ||
    team.shortName.en ||
    team.name.en ||
    team.code ||
    '???'
  );
}

export function MatchRow({ fixture, locale }: MatchRowProps) {
  const isLive = LIVE_STATUSES.has(fixture.statusCode);
  const isFinished = FINISHED_STATUSES.has(fixture.statusCode);

  const homeLabel = getTeamLabel(fixture.homeTeam, locale);
  const awayLabel = getTeamLabel(fixture.awayTeam, locale);

  const homeWins =
    isFinished &&
    fixture.homeScore != null &&
    fixture.awayScore != null &&
    fixture.homeScore > fixture.awayScore;
  const awayWins =
    isFinished &&
    fixture.homeScore != null &&
    fixture.awayScore != null &&
    fixture.awayScore > fixture.homeScore;

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className="group flex min-h-[48px] items-center border-b border-border-subtle px-3 transition-colors hover:bg-bg-surface-2"
    >
      {/* Status / Time column */}
      <div className="w-12 shrink-0 text-center">
        {isLive ? (
          <span className="text-xs font-bold text-red-500">
            {fixture.statusCode === 'HT' ? 'HT' : `${fixture.minute ?? ''}'`}
          </span>
        ) : isFinished ? (
          <span className="text-xs font-medium text-text-tertiary">
            {fixture.statusCode === 'PEN' ? 'Pen' : 'FT'}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">
            {fixture.kickoffAt.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-2 h-8 w-px bg-border-subtle" />

      {/* Teams + scores */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 py-1.5">
        {/* Home team row */}
        <div className="flex items-center gap-2">
          {fixture.homeTeam?.logoUrl ? (
            <img
              src={fixture.homeTeam.logoUrl}
              alt=""
              className="h-4 w-4 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
              {fixture.homeTeam?.code?.slice(0, 2) ?? '??'}
            </span>
          )}
          <span
            className={`min-w-0 truncate text-sm ${
              isLive
                ? 'font-medium text-text-primary'
                : awayWins
                  ? 'text-text-tertiary'
                  : 'text-text-primary'
            }`}
          >
            {homeLabel}
          </span>
          <span className="ms-auto shrink-0 tabular-nums">
            {(isLive || isFinished) && fixture.homeScore != null ? (
              <span
                className={`text-sm font-semibold ${isLive ? 'text-red-500' : homeWins ? 'text-text-primary' : 'text-text-tertiary'}`}
              >
                {fixture.homeScore}
              </span>
            ) : (
              <span className="text-sm text-text-tertiary">–</span>
            )}
          </span>
        </div>

        {/* Away team row */}
        <div className="flex items-center gap-2">
          {fixture.awayTeam?.logoUrl ? (
            <img
              src={fixture.awayTeam.logoUrl}
              alt=""
              className="h-4 w-4 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
              {fixture.awayTeam?.code?.slice(0, 2) ?? '??'}
            </span>
          )}
          <span
            className={`min-w-0 truncate text-sm ${
              isLive
                ? 'font-medium text-text-primary'
                : homeWins
                  ? 'text-text-tertiary'
                  : 'text-text-primary'
            }`}
          >
            {awayLabel}
          </span>
          <span className="ms-auto shrink-0 tabular-nums">
            {(isLive || isFinished) && fixture.awayScore != null ? (
              <span
                className={`text-sm font-semibold ${isLive ? 'text-red-500' : awayWins ? 'text-text-primary' : 'text-text-tertiary'}`}
              >
                {fixture.awayScore}
              </span>
            ) : (
              <span className="text-sm text-text-tertiary">–</span>
            )}
          </span>
        </div>

        {/* Penalty indicator */}
        {fixture.statusCode === 'PEN' &&
          fixture.homeScorePen != null &&
          fixture.awayScorePen != null && (
            <div className="mt-0.5 text-center text-[10px] text-text-tertiary">
              ({fixture.homeScorePen} – {fixture.awayScorePen} pen)
            </div>
          )}
      </div>
    </Link>
  );
}
