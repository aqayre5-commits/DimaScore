import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { TeamDetail } from '@/lib/db/queries/team';
import type { FixtureWithCompetition } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';
import { codeToFlag } from '@/lib/flags';
import { getMatchState } from '@/lib/match-status';

interface TeamPageHeaderProps {
  team: TeamDetail;
  locale: Locale;
  nextMatch: FixtureWithCompetition | null;
}

function resolveTeamName(team: TeamDetail, locale: Locale): string {
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    '\u2014'
  );
}

function resolveShortName(
  team: {
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
  } | null,
  locale: Locale,
): string {
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

function formatCardDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}/${m}/${y}`;
}

function formatCardTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TeamPageHeader({ team, locale, nextMatch }: TeamPageHeaderProps) {
  const t = useTranslations('teamPage');
  const name = resolveTeamName(team, locale);
  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Left: logo + identity */}
        <div className="flex flex-1 items-start gap-4">
          {/* Team logo */}
          <div className="flex size-[95px] shrink-0 items-center justify-center rounded-xl bg-bg-surface-2">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={name}
                width={76}
                height={76}
                className="size-[76px] object-contain"
                loading="eager"
              />
            ) : flag ? (
              <span className="text-5xl">{flag}</span>
            ) : (
              <span className="text-2xl text-text-tertiary">&#9917;</span>
            )}
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-tight text-text-primary">
              {name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] text-text-secondary">
              {flag && <span>{flag}</span>}
              {team.founded && (
                <>
                  {flag && <span className="text-text-tertiary">&middot;</span>}
                  <span>{t('founded', { year: team.founded })}</span>
                </>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-tertiary">
              {team.coach && (
                <span>
                  {t('coach')}: <span className="text-text-secondary">{team.coach.name}</span>
                </span>
              )}
              {team.venue && (team.venue.name || team.venue.city) && (
                <span>{[team.venue.name, team.venue.city].filter(Boolean).join(', ')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: next match card */}
        {nextMatch && (
          <div className="shrink-0">
            <HeaderMatchCard fixture={nextMatch} label={t('nextMatch')} locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderMatchCard({
  fixture,
  label,
  locale,
}: {
  fixture: FixtureWithCompetition;
  label: string;
  locale: Locale;
}) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt);
  const isDone = state === 'finished';
  const isLive = state === 'live';
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;

  const compName = fixture.competition
    ? (fixture.competition.name[locale] ?? fixture.competition.name['en'] ?? '')
    : '';

  const homeName = resolveShortName(fixture.homeTeam, locale);
  const awayName = resolveShortName(fixture.awayTeam, locale);

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className="flex w-[180px] flex-col rounded-lg border border-border-subtle bg-bg-surface-2 p-2.5 transition-colors hover:bg-bg-surface-3"
    >
      {/* Label */}
      <span className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </span>

      {/* Competition */}
      <div className="mt-1 flex items-center gap-1">
        {fixture.competition?.logoUrl && (
          <img
            src={fixture.competition.logoUrl}
            alt=""
            className="size-3 shrink-0 object-contain"
            loading="lazy"
          />
        )}
        <span className="truncate text-[10px] text-text-tertiary">{compName}</span>
      </div>

      {/* Date + status */}
      <div className="mt-1.5 flex items-center gap-1 text-[10px] tabular-nums text-text-tertiary">
        <span>{formatCardDate(fixture.kickoffAt)}</span>
        <span className="text-text-tertiary">/</span>
        {isLive ? (
          <span className="flex items-center gap-0.5 font-semibold text-accent-emerald">
            <span className="size-1 animate-pulse rounded-full bg-accent-emerald" />
            {fixture.statusCode === 'HT' ? 'HT' : fixture.statusCode}
          </span>
        ) : isDone ? (
          <span className="font-medium text-text-tertiary">FT</span>
        ) : (
          <span>{formatCardTime(fixture.kickoffAt)}</span>
        )}
      </div>

      {/* Teams + score */}
      <div className="mt-1.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {fixture.homeTeam?.logoUrl ? (
            <img
              src={fixture.homeTeam.logoUrl}
              alt=""
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface" />
          )}
          <span className="flex-1 truncate text-[11px] text-text-primary">{homeName}</span>
          {(isDone || isLive) && hasScore && (
            <span
              className={`text-[11px] font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {fixture.homeScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {fixture.awayTeam?.logoUrl ? (
            <img
              src={fixture.awayTeam.logoUrl}
              alt=""
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface" />
          )}
          <span className="flex-1 truncate text-[11px] text-text-primary">{awayName}</span>
          {(isDone || isLive) && hasScore && (
            <span
              className={`text-[11px] font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {fixture.awayScore}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
