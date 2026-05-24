import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import { KickoffCountdown } from '@/components/shared/KickoffCountdown';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueRightRailCardProps {
  featuredMatches: FixtureWithTeams[];
  topScorer: TopPlayerRow | null;
  locale: Locale;
  competitionName: string;
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
  locale,
  competitionName,
}: LeagueRightRailCardProps) {
  const t = useTranslations('leaguePage');

  if (featuredMatches.length === 0 && !topScorer) return null;

  const featured = featuredMatches.slice(0, 2);
  const remaining = featuredMatches.slice(2);

  return (
    <div className="space-y-4">
      {/* Featured matches — each in its own card */}
      {featured.map((fixture) => (
        <div
          key={fixture.id}
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
        >
          <FeaturedMatch fixture={fixture} locale={locale} />
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

      {/* Top scorer spotlight */}
      {topScorer && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('topScorers')}
            </span>
          </div>
          <Link
            href={`/${locale}/joueur/${topScorer.playerSlug}`}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-surface-2"
          >
            {topScorer.playerPhoto ? (
              <Image
                src={topScorer.playerPhoto}
                alt={topScorer.playerName}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-12 items-center justify-center rounded-full bg-bg-surface-2 text-sm font-semibold text-text-tertiary">
                {topScorer.playerName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-text-primary">
                {topScorer.playerName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                {topScorer.teamLogo && (
                  <Image
                    src={topScorer.teamLogo}
                    alt=""
                    width={14}
                    height={14}
                    className="size-3.5 object-contain"
                  />
                )}
                <span className="truncate">{topScorer.teamName}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold tabular-nums text-text-primary">
                {topScorer.goals}
              </div>
              <div className="text-[10px] font-medium uppercase text-text-tertiary">
                {t('goals')}
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function FeaturedMatch({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const t = useTranslations('leaguePage');
  const { homeTeam, awayTeam, kickoffAt, venue, statusCode, homeScore, awayScore } = fixture;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const homeName = resolveTeamName(homeTeam, locale);
  const awayName = resolveTeamName(awayTeam, locale);
  const isFinished = statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN';
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(statusCode);

  const headerDate = formatHeaderDate(kickoffAt, locale);
  const kickoffTime = formatMatchTime(kickoffAt, locale);

  return (
    <div>
      {/* Date header */}
      <div className="px-4 pt-4 pb-1 text-center">
        <span className="text-xs tabular-nums text-text-tertiary">{headerDate}</span>
      </div>

      {/* Teams + Score/Time */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2">
        {/* Home */}
        <div className="flex max-w-[100px] flex-col items-center gap-1.5 text-center">
          {homeTeam?.logoUrl ? (
            <img src={homeTeam.logoUrl} alt="" className="size-12 object-contain" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
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
                className={`text-2xl font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
              >
                {homeScore ?? 0} - {awayScore ?? 0}
              </div>
              {isLive ? (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
                  <span className="text-xs font-semibold text-accent-emerald">
                    {statusCode === 'HT' ? 'HT' : statusCode}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-text-tertiary">FT</span>
              )}
            </>
          ) : (
            <>
              <div className="text-2xl font-bold tabular-nums text-text-primary">{kickoffTime}</div>
              {venue && (venue.name || venue.city) && (
                <p className="mt-0.5 text-xs text-text-tertiary">{venue.name ?? venue.city}</p>
              )}
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex max-w-[100px] flex-col items-center gap-1.5 text-center">
          {awayTeam?.logoUrl ? (
            <img src={awayTeam.logoUrl} alt="" className="size-12 object-contain" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
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

      {/* View match link */}
      <div className="px-4 pb-4 pt-2">
        <Link
          href={`/${locale}/match/${fixture.id}`}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-accent-green/10 px-4 py-2.5 text-sm font-semibold text-accent-green transition-colors hover:bg-accent-green/20"
        >
          {t('viewMatch')}
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function CompactMatch({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore } = fixture;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const isFinished = statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN';
  const isLive = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'].includes(statusCode);
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
        {isFinished || isLive ? (
          <span
            className={`text-sm font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
          >
            {homeScore ?? 0}-{awayScore ?? 0}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary">{kickoffTime}</span>
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
