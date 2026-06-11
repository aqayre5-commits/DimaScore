'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

type StatusFilter = 'all' | 'live' | 'upcoming' | 'results';

const DATE_LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar-MA',
};

function groupByDate(fixtures: FixtureWithTeams[], locale: Locale) {
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-GB';
  const groups: { key: string; label: string; fixtures: FixtureWithTeams[] }[] = [];
  const seen = new Map<string, number>();

  for (const f of fixtures) {
    const dateKey = f.kickoffAt.toISOString().slice(0, 10);
    const idx = seen.get(dateKey);
    if (idx != null) {
      groups[idx].fixtures.push(f);
    } else {
      const label = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(f.kickoffAt);
      seen.set(dateKey, groups.length);
      groups.push({ key: dateKey, label, fixtures: [f] });
    }
  }

  return groups;
}

interface CupFixturesTabProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
  /** When true, show fewer rows and no expand button (used in overview tab). */
  compact?: boolean;
}

const INITIAL_VISIBLE = 10;
const COMPACT_VISIBLE = 6;

/**
 * Generic cup fixtures tab with status and round-type filters.
 * Works for UCL, UEL, AFCON, etc.
 */
export function CupFixturesTab({ fixtures, locale, compact }: CupFixturesTabProps) {
  const t = useTranslations('tournament');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    let result = [...fixtures].sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

    if (statusFilter !== 'all') {
      result = result.filter((f) => {
        const state = getMatchState(f.statusCode, f.kickoffAt);
        if (statusFilter === 'live') return state === 'live';
        if (statusFilter === 'upcoming') return state === 'upcoming';
        if (statusFilter === 'results') return state === 'finished';
        return true;
      });
    }

    return result;
  }, [fixtures, statusFilter]);

  const limit = compact ? COMPACT_VISIBLE : INITIAL_VISIBLE;
  const visible = expanded ? filtered : filtered.slice(0, limit);
  const hasMore = !compact && filtered.length > limit;

  const hasLive = fixtures.some((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const hasFinished = fixtures.some((f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished');

  const statusPills: { key: StatusFilter; label: string; dot?: boolean }[] = [
    { key: 'all', label: t('wcFixturesAll') },
    ...(hasLive
      ? [
          {
            key: 'live' as StatusFilter,
            label: t('wcFixturesLive'),
            dot: true,
          },
        ]
      : []),
    { key: 'upcoming', label: t('wcFixturesUpcoming') },
    ...(hasFinished ? [{ key: 'results' as StatusFilter, label: t('wcFixturesResults') }] : []),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                statusFilter === pill.key
                  ? 'bg-accent-azure text-white'
                  : 'bg-bg-surface-2 text-text-tertiary hover:bg-accent-azure/10 hover:text-accent-azure',
              )}
            >
              {pill.dot && <span className="mr-1 inline-block size-1.5 rounded-full bg-red-500" />}
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Match rows grouped by date */}
      <div>
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-tertiary">{t('noMatches')}</p>
        ) : (
          groupByDate(visible, locale).map((group) => (
            <div key={group.key}>
              <div className="border-b border-border-subtle bg-bg-surface-3 px-4 py-1.5">
                <span
                  className="text-xs font-semibold uppercase text-text-tertiary"
                  suppressHydrationWarning
                >
                  {group.label}
                </span>
              </div>
              <div className="divide-y divide-border-subtle">
                {group.fixtures.map((f) => (
                  <CupMatchRow key={f.id} fixture={f} locale={locale} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-border-subtle py-3 text-sm font-semibold text-accent-azure transition-colors hover:bg-accent-azure/5"
        >
          {t('wcViewFullFixtureList')}
          <ChevronDown className="size-4" />
        </button>
      )}
    </div>
  );
}

function CupMatchRow({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore, venue } = fixture;
  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;
  const time = formatMatchTime(kickoffAt, locale);

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);
  const homeWon = isFinished && hasScore && homeScore! > awayScore!;
  const awayWon = isFinished && hasScore && awayScore! > homeScore!;

  const roundLabel = fixture.round ?? null;
  const venueName = venue?.name ?? venue?.city ?? null;

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
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={preview}
      className="block transition-colors hover:bg-accent-azure/5"
    >
      {/* \u2500\u2500 Desktop: horizontal (with Round \u00B7 Venue) \u2500\u2500 */}
      <div className="hidden items-center gap-3 px-4 py-2.5 md:flex">
        <div className="w-12 shrink-0 text-center">
          {isLive ? (
            <span className="flex items-center justify-center gap-1 text-xs font-semibold text-score-live">
              <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
              {statusCode === 'HT' ? 'HT' : statusCode}
            </span>
          ) : isFinished ? (
            <span className="text-xs text-text-tertiary">FT</span>
          ) : (
            <span className="text-xs tabular-nums text-text-secondary" suppressHydrationWarning>
              {time}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <TeamBadge team={homeTeam} />
          <span
            className={cn(
              'truncate text-sm',
              homeWon ? 'font-semibold text-text-primary' : 'text-text-secondary',
            )}
          >
            {homeName}
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-center text-center">
          {hasScore ? (
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                isLive ? 'text-score-live' : 'text-text-primary',
              )}
            >
              {homeScore} - {awayScore}
            </span>
          ) : (
            <span className="text-xs text-text-tertiary">vs</span>
          )}
          {(roundLabel || venueName) && (
            <span className="max-w-[180px] truncate text-[10px] text-text-tertiary">
              {[roundLabel, venueName].filter(Boolean).join(' \u00B7 ')}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
          <span
            className={cn(
              'truncate text-sm',
              awayWon ? 'font-semibold text-text-primary' : 'text-text-secondary',
            )}
          >
            {awayName}
          </span>
          <TeamBadge team={awayTeam} />
        </div>
      </div>

      {/* \u2500\u2500 Mobile: teams + per-team scores \u00b7 divider \u00b7 time/status \u2500\u2500 */}
      <div className="flex items-stretch gap-3 px-4 py-2.5 md:hidden">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            <TeamBadge team={homeTeam} big />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-base',
                awayWon ? 'text-text-tertiary' : 'font-medium text-text-primary',
              )}
            >
              {homeName}
            </span>
            {hasScore && (
              <span
                className={cn(
                  'text-base font-bold tabular-nums',
                  isLive ? 'text-score-live' : awayWon ? 'text-text-tertiary' : 'text-text-primary',
                )}
              >
                {homeScore}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <TeamBadge team={awayTeam} big />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-base',
                homeWon ? 'text-text-tertiary' : 'font-medium text-text-primary',
              )}
            >
              {awayName}
            </span>
            {hasScore && (
              <span
                className={cn(
                  'text-base font-bold tabular-nums',
                  isLive ? 'text-score-live' : homeWon ? 'text-text-tertiary' : 'text-text-primary',
                )}
              >
                {awayScore}
              </span>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 self-stretch bg-border-subtle" />

        <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight">
          {isLive ? (
            <span className="text-sm font-bold tabular-nums text-score-live">
              {statusCode === 'HT' ? 'HT' : statusCode}
            </span>
          ) : isFinished ? (
            <span className="text-xs font-medium text-text-tertiary">FT</span>
          ) : (
            <span className="text-sm tabular-nums text-text-secondary" suppressHydrationWarning>
              {time}
            </span>
          )}
        </div>
      </div>
    </MatchLink>
  );
}

function TeamBadge({ team, big = false }: { team: FixtureWithTeams['homeTeam']; big?: boolean }) {
  const box = big ? 'size-6' : 'size-5';
  if (team?.logoUrl) {
    return (
      <Image
        src={team.logoUrl}
        alt=""
        width={big ? 24 : 20}
        height={big ? 24 : 20}
        className={`${box} shrink-0 object-contain`}
      />
    );
  }
  return <span className={`inline-block ${box} shrink-0 rounded bg-bg-surface-2`} />;
}

function resolveFullName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
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
