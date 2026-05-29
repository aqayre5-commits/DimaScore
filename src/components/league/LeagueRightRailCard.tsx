import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { KickoffCountdown } from '@/components/shared/KickoffCountdown';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueRightRailCardProps {
  featuredMatches: FixtureWithTeams[];
  topScorer?: TopPlayerRow | null;
  topScorers?: TopPlayerRow[];
  locale: Locale;
  competitionName: string;
  /** When true, the first featured card stretches to fill parent height. */
  stretch?: boolean;
}

function resolveTeamCode(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '\u2014';
  return (
    team.code ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    (team.name[locale] ?? team.name['en'] ?? '\u2014').slice(0, 3).toUpperCase()
  );
}

function resolveTeamName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
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

function formatHeaderDate(date: Date, locale: Locale): string {
  const formatted = formatMatchDate(date, locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const time = formatMatchTime(date, locale);
  return `${formatted.toUpperCase()} · ${time}`;
}

export function LeagueRightRailCard({
  featuredMatches,
  topScorer,
  topScorers: topScorersProp,
  locale,
  competitionName,
  stretch,
}: LeagueRightRailCardProps) {
  const t = useTranslations('leaguePage');

  // Merge legacy single scorer with array prop
  const scorers = topScorersProp ?? (topScorer ? [topScorer] : []);
  const displayScorers = scorers.slice(0, 3);

  if (featuredMatches.length === 0 && displayScorers.length === 0) return null;

  // Separate live matches for "LIVE NOW" header
  const liveMatches = featuredMatches.filter((f) => {
    const state = getMatchState(f.statusCode, f.kickoffAt);
    return state === 'live';
  });
  const featured = featuredMatches.slice(0, 2);
  const remaining = featuredMatches.slice(2);

  return (
    <div className={stretch ? 'flex h-full flex-1 flex-col' : 'space-y-4'}>
      {/* "See all live" header when live matches exist */}
      {liveMatches.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('featuredMatch')}
          </span>
          <Link
            href={`/${locale}`}
            className="text-xs font-semibold text-accent-violet transition-colors hover:text-accent-violet/80"
          >
            {t('seeAllLive')}
          </Link>
        </div>
      )}

      {/* Featured matches — each in its own card */}
      {featured.map((fixture, idx) => (
        <div
          key={fixture.id}
          className={`overflow-hidden rounded-xl border border-border-subtle bg-bg-surface${stretch && idx === 0 ? ' flex flex-1 flex-col' : ''}`}
        >
          <FeaturedMatch fixture={fixture} locale={locale} large={stretch && idx === 0} />
        </div>
      ))}

      {/* Remaining matches (compact rows) */}
      {remaining.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {competitionName}
            </span>
          </div>
          <div className="divide-y divide-border-subtle">
            {remaining.map((f) => (
              <CompactMatch key={f.id} fixture={f} locale={locale} />
            ))}
          </div>
        </div>
      )}

      {/* Top scorers — up to 3 with ranking */}
      {displayScorers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="flex items-center justify-between bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('topScorers')}
            </span>
            {scorers.length > 3 && (
              <span className="text-xs font-semibold text-accent-violet">{t('viewAll')}</span>
            )}
          </div>
          <div className="divide-y divide-border-subtle">
            {displayScorers.map((scorer, idx) => (
              <Link
                key={scorer.playerId}
                href={`/${locale}/joueur/${scorer.playerSlug}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-text-tertiary">
                  {idx + 1}
                </span>
                {scorer.playerPhoto ? (
                  <Image
                    src={scorer.playerPhoto}
                    alt={scorer.playerName}
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-semibold text-text-tertiary">
                    {scorer.playerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text-primary">
                    {scorer.playerName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    {scorer.teamLogo && (
                      <Image
                        src={scorer.teamLogo}
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 object-contain"
                      />
                    )}
                    <span className="truncate">{scorer.teamName}</span>
                  </div>
                </div>
                <div className="text-lg font-bold tabular-nums text-text-primary">
                  {scorer.goals}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturedMatch({
  fixture,
  locale,
  large,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  large?: boolean;
}) {
  const t = useTranslations('leaguePage');
  const { homeTeam, awayTeam, kickoffAt, venue, statusCode, homeScore, awayScore } = fixture;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const homeName = resolveTeamName(homeTeam, locale);
  const awayName = resolveTeamName(awayTeam, locale);
  const _state = getMatchState(statusCode, kickoffAt);
  const isFinished = _state === 'finished';
  const isLive = _state === 'live';

  const headerDate = formatHeaderDate(kickoffAt, locale);
  const kickoffTime = formatMatchTime(kickoffAt, locale);

  const logoSize = large ? 'size-16' : 'size-12';
  const fallbackSize = large ? 'size-16' : 'size-12';
  const maxTeamW = large ? 'max-w-[120px]' : 'max-w-[100px]';
  const scoreSize = large ? 'text-3xl' : 'text-2xl';

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className={
        large
          ? 'flex flex-1 flex-col transition-colors hover:bg-bg-surface-2'
          : 'block transition-colors hover:bg-bg-surface-2'
      }
    >
      {/* Section label + date header */}
      {isLive && (
        <div className="bg-bg-surface-3 px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent-emerald">
            {t('featuredMatch')}
          </span>
        </div>
      )}
      <div className="px-4 pt-3 pb-1 text-center">
        <span className="text-xs tabular-nums text-text-tertiary">{headerDate}</span>
      </div>

      {/* Teams + Score/Time */}
      <div
        className={`flex flex-1 items-center justify-between gap-2 px-4 ${large ? 'py-4' : 'pb-2'}`}
      >
        {/* Home */}
        <div className={`flex ${maxTeamW} flex-col items-center gap-2 text-center`}>
          {homeTeam?.logoUrl ? (
            <img src={homeTeam.logoUrl} alt="" className={`${logoSize} object-contain`} />
          ) : (
            <div
              className={`flex ${fallbackSize} items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary`}
            >
              {homeCode}
            </div>
          )}
          <span className="max-w-full truncate text-xs font-semibold text-text-primary">
            {homeName}
          </span>
        </div>

        {/* Score / Kickoff time */}
        <div className="text-center">
          {isFinished || isLive ? (
            <>
              <div
                className={`${scoreSize} font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
              >
                {homeScore != null && awayScore != null ? `${homeScore} - ${awayScore}` : '- : -'}
              </div>
              {isLive ? (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
                  <span className="text-xs font-semibold text-accent-emerald">
                    {statusCode === 'HT' ? 'HT' : statusCode}
                  </span>
                </div>
              ) : (
                <span className="mt-0.5 inline-block rounded bg-bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-text-tertiary">
                  {statusCode === 'AET' ? 'AET' : statusCode === 'PEN' ? 'PEN' : 'FT'}
                </span>
              )}
            </>
          ) : (
            <>
              <div className={`${scoreSize} font-bold tabular-nums text-text-primary`}>
                {kickoffTime}
              </div>
            </>
          )}
          {venue && (venue.name || venue.city) && (
            <p className="mt-1 text-xs text-text-tertiary">{venue.name ?? venue.city}</p>
          )}
        </div>

        {/* Away */}
        <div className={`flex ${maxTeamW} flex-col items-center gap-2 text-center`}>
          {awayTeam?.logoUrl ? (
            <img src={awayTeam.logoUrl} alt="" className={`${logoSize} object-contain`} />
          ) : (
            <div
              className={`flex ${fallbackSize} items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary`}
            >
              {awayCode}
            </div>
          )}
          <span className="max-w-full truncate text-xs font-semibold text-text-primary">
            {awayName}
          </span>
        </div>
      </div>

      {/* Countdown — only for upcoming matches */}
      {!isFinished && !isLive && <KickoffCountdown kickoffAt={kickoffAt} label={t('kickoffIn')} />}

      {/* Match progress bar — live matches only */}
      {isLive && <MatchProgressBar statusCode={statusCode} />}
    </Link>
  );
}

function CompactMatch({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore } = fixture;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const _state = getMatchState(statusCode, kickoffAt);
  const isFinished = _state === 'finished';
  const isLive = _state === 'live';
  const kickoffTime = formatMatchTime(kickoffAt, locale);

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
    >
      {/* Home */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {homeTeam?.logoUrl ? (
          <img src={homeTeam.logoUrl} alt="" className="size-4 shrink-0 object-contain" />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
        <span className="truncate text-xs font-medium text-text-primary">{homeCode}</span>
      </div>

      {/* Score / time */}
      <div className="w-14 shrink-0 text-center">
        {homeScore != null && awayScore != null ? (
          <span
            className={`text-sm font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
          >
            {homeScore}-{awayScore}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary">
            {isFinished ? '- : -' : kickoffTime}
          </span>
        )}
      </div>

      {/* Away */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span className="truncate text-xs font-medium text-text-primary">{awayCode}</span>
        {awayTeam?.logoUrl ? (
          <img src={awayTeam.logoUrl} alt="" className="size-4 shrink-0 object-contain" />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
      </div>
    </Link>
  );
}

/** Visual timeline dots for a live match. */
function MatchProgressBar({ statusCode }: { statusCode: string }) {
  // Map status to approximate progress (0-4 segments)
  const segments = 10;
  let filled = 5; // default middle
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
