'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { codeToFlag } from '@/lib/flags';
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

interface WCFixturesTabProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
  groupLabels: string[];
  /** Maps teamId → group label (e.g. 16 → "A") from standings */
  teamGroupMap: Record<number, string>;
}

const INITIAL_VISIBLE = 10;

export function WCFixturesTab({ fixtures, locale, groupLabels, teamGroupMap }: WCFixturesTabProps) {
  const t = useTranslations('tournament');

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roundFilter, setRoundFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);

  // Derive unique round types from fixtures
  const roundTypes = useMemo(() => {
    const types = new Set<string>();
    for (const f of fixtures) {
      if (f.round?.startsWith('Group')) types.add('group');
      else if (f.round) types.add('knockout');
    }
    return Array.from(types);
  }, [fixtures]);

  // Filter fixtures
  const filtered = useMemo(() => {
    // Chronological (soonest first) for all/upcoming/live; reverse only for results,
    // where the most-recent finished match should lead.
    const ascending = statusFilter !== 'results';
    let result = [...fixtures]
      .filter((f) => !f.round?.toLowerCase().includes('ranking of third'))
      .sort((a, b) =>
        ascending
          ? a.kickoffAt.getTime() - b.kickoffAt.getTime()
          : b.kickoffAt.getTime() - a.kickoffAt.getTime(),
      );

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((f) => {
        const state = getMatchState(f.statusCode, f.kickoffAt);
        if (statusFilter === 'live') return state === 'live';
        if (statusFilter === 'upcoming') return state === 'upcoming';
        if (statusFilter === 'results') return state === 'finished';
        return true;
      });
    }

    // Round filter
    if (roundFilter === 'group') {
      result = result.filter((f) => f.round?.startsWith('Group'));
    } else if (roundFilter === 'knockout') {
      result = result.filter((f) => f.round && !f.round.startsWith('Group'));
    }

    // Group filter — match via team-to-group mapping from standings
    if (groupFilter !== 'all') {
      result = result.filter((f) => {
        const homeGroup = f.homeTeamId != null ? teamGroupMap[f.homeTeamId] : null;
        const awayGroup = f.awayTeamId != null ? teamGroupMap[f.awayTeamId] : null;
        return homeGroup === groupFilter && awayGroup === groupFilter;
      });
    }

    return result;
  }, [fixtures, statusFilter, roundFilter, groupFilter]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  // Only show Live/Results pills when relevant matches exist
  const hasLive = fixtures.some((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const hasFinished = fixtures.some((f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished');

  const statusPills: { key: StatusFilter; label: string; dot?: boolean }[] = [
    { key: 'all', label: t('wcFixturesAll') },
    ...(hasLive ? [{ key: 'live' as StatusFilter, label: t('wcFixturesLive'), dot: true }] : []),
    { key: 'upcoming', label: t('wcFixturesUpcoming') },
    ...(hasFinished ? [{ key: 'results' as StatusFilter, label: t('wcFixturesResults') }] : []),
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-2.5">
        {/* Status pills */}
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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Dropdowns */}
        <div className="flex items-center gap-2">
          {roundTypes.length > 1 && (
            <select
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              className="rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">{t('wcFixturesAll')}</option>
              <option value="group">{t('groupStage')}</option>
              <option value="knockout">{t('knockoutStage')}</option>
            </select>
          )}

          {groupLabels.length > 0 && (
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="rounded-md border border-border-subtle bg-bg-surface px-2 py-1 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">{t('wcAllGroups')}</option>
              {groupLabels.map((g) => (
                <option key={g} value={g}>
                  {t('groupLabel', { label: g })}
                </option>
              ))}
            </select>
          )}
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
                  <WCMatchRow key={f.id} fixture={f} locale={locale} teamGroupMap={teamGroupMap} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View full fixture list */}
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

function WCMatchRow({
  fixture,
  locale,
  teamGroupMap,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  teamGroupMap: Record<number, string>;
}) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore, venue } = fixture;
  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;
  const time = formatMatchTime(kickoffAt, locale);

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);
  const homeFlag =
    homeTeam?.isNational && homeTeam.countryCode ? codeToFlag(homeTeam.countryCode) : null;
  const awayFlag =
    awayTeam?.isNational && awayTeam.countryCode ? codeToFlag(awayTeam.countryCode) : null;

  const homeWon = isFinished && hasScore && homeScore! > awayScore!;
  const awayWon = isFinished && hasScore && awayScore! > homeScore!;

  // Resolve group label — only show when both teams are in the same group (group stage match)
  const homeGroup = fixture.homeTeamId != null ? teamGroupMap[fixture.homeTeamId] : null;
  const awayGroup = fixture.awayTeamId != null ? teamGroupMap[fixture.awayTeamId] : null;
  const groupLabel = homeGroup && homeGroup === awayGroup ? `Group ${homeGroup}` : null;
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
      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent-azure/5"
    >
      {/* Time / status */}
      <div className="w-12 shrink-0 text-center">
        {isLive ? (
          <span className="flex items-center justify-center gap-1 text-xs font-semibold text-accent-emerald">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-emerald" />
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

      {/* Home team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        <TeamBadge team={homeTeam} flag={homeFlag} />
        <span
          className={cn(
            'truncate text-sm',
            homeWon ? 'font-semibold text-text-primary' : 'text-text-secondary',
          )}
        >
          {homeName}
        </span>
      </div>

      {/* Center: vs + group + venue */}
      <div className="flex shrink-0 flex-col items-center text-center">
        {hasScore ? (
          <span
            className={cn(
              'text-sm font-bold tabular-nums',
              isLive ? 'text-accent-emerald' : 'text-text-primary',
            )}
          >
            {homeScore} - {awayScore}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">vs</span>
        )}
        {(groupLabel || venueName) && (
          <span className="max-w-[180px] truncate text-[10px] text-text-tertiary">
            {[groupLabel, venueName].filter(Boolean).join(' \u00B7 ')}
          </span>
        )}
      </div>

      {/* Away team */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span
          className={cn(
            'truncate text-sm',
            awayWon ? 'font-semibold text-text-primary' : 'text-text-secondary',
          )}
        >
          {awayName}
        </span>
        <TeamBadge team={awayTeam} flag={awayFlag} />
      </div>
    </MatchLink>
  );
}

function TeamBadge({ team, flag }: { team: FixtureWithTeams['homeTeam']; flag: string | null }) {
  if (team?.logoUrl) {
    return (
      <Image
        src={team.logoUrl}
        alt=""
        width={20}
        height={20}
        className="size-5 shrink-0 object-contain"
      />
    );
  }
  if (flag) {
    return <span className="shrink-0 text-sm leading-none">{flag}</span>;
  }
  return <span className="inline-block size-5 shrink-0 rounded bg-bg-surface-2" />;
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
