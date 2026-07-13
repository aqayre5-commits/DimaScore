'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stripWomenSuffix } from '@/lib/team-display';
import { Flag } from '@/components/shared/Flag';
import { SITE_TZ } from '@/lib/utils/date';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState } from '@/lib/match-status';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
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
    // Day key + label pinned to the site timezone — deterministic across SSR/hydration
    // and consistent with each other at midnight boundaries.
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: SITE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(f.kickoffAt);
    const idx = seen.get(dateKey);
    if (idx != null) {
      groups[idx].fixtures.push(f);
    } else {
      const label = new Intl.DateTimeFormat(dateLocale, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: SITE_TZ,
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

  // Poll /api/v1/live to keep scores/minute/status fresh on this tab — without this we render
  // the SSR snapshot only, which can be ≥1 minute stale (homepage uses the same hook).
  const livePatches = useLiveFixtures();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => {
    // Land on the view that matches tournament state: live games > upcoming > results.
    // Avoids dropping users at the tournament opener weeks after groups have finished.
    let hasLive = false;
    let hasUpcoming = false;
    for (const f of fixtures) {
      const state = getMatchState(f.statusCode, f.kickoffAt);
      if (state === 'live') hasLive = true;
      else if (state === 'upcoming') hasUpcoming = true;
      if (hasLive) break;
    }
    if (hasLive) return 'live';
    if (hasUpcoming) return 'upcoming';
    return 'results';
  });
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

  // Overlay live patches on the SSR snapshot before any filter/sort runs.
  const patchedFixtures = useMemo(() => {
    if (livePatches.size === 0) return fixtures;
    return fixtures.map((f) => {
      const p = livePatches.get(f.id);
      return p
        ? {
            ...f,
            statusCode: p.statusCode,
            minute: p.minute,
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            homeScorePen: p.homeScorePen,
            awayScorePen: p.awayScorePen,
          }
        : f;
    });
  }, [fixtures, livePatches]);

  // Filter fixtures
  const filtered = useMemo(() => {
    // Chronological (soonest first) for all/upcoming/live; reverse only for results,
    // where the most-recent finished match should lead.
    const ascending = statusFilter !== 'results';
    let result = [...patchedFixtures]
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
  }, [patchedFixtures, statusFilter, roundFilter, groupFilter, teamGroupMap]);

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  // Only show Live/Results pills when relevant matches exist (use patched view so the Live pill
  // appears as soon as the poll picks up a kickoff).
  const hasLive = patchedFixtures.some((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const hasFinished = patchedFixtures.some(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished',
  );

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
                  <WCMatchRow key={f.id} fixture={f} locale={locale} />
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

function WCMatchRow({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore } = fixture;
  const { homeScorePen, awayScorePen } = fixture;
  const state = getMatchState(statusCode, kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const hasScore = homeScore != null && awayScore != null;
  const showPens = statusCode === 'PEN' && homeScorePen != null && awayScorePen != null;
  // Shootout rows read "FT" with "PEN x-y" stacked beneath — the official 120' result stays
  // the headline, the shootout is the annotation.
  const finishedLabel = statusCode === 'AET' ? 'AET' : 'FT';
  const time = <LocalTime date={kickoffAt} locale={locale} format="time" />;

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);

  const homeWon = isFinished && hasScore && homeScore! > awayScore!;
  const awayWon = isFinished && hasScore && awayScore! > homeScore!;

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
      {/* \u2500\u2500 Single layout (all breakpoints): teams + per-team scores \u00b7 divider \u00b7 time/status \u2500\u2500 */}
      <div className="flex items-stretch gap-3 px-4 py-2.5">
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
                {showPens && (
                  <span className="text-xs font-semibold text-text-tertiary">
                    {' '}
                    ({homeScorePen})
                  </span>
                )}
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
                {showPens && (
                  <span className="text-xs font-semibold text-text-tertiary">
                    {' '}
                    ({awayScorePen})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 self-stretch bg-border-subtle" />

        <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight">
          {isLive ? (
            <span className="text-sm font-bold tabular-nums text-score-live">
              {statusCode === 'HT' ? 'HT' : statusCode === 'P' ? 'PEN' : statusCode}
            </span>
          ) : isFinished ? (
            <>
              <span className="text-xs font-medium text-text-tertiary">{finishedLabel}</span>
              {showPens && (
                <span className="mt-0.5 text-[9px] font-semibold text-text-tertiary">PEN</span>
              )}
            </>
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
  return (
    <Flag
      countryCode={team?.countryCode}
      logoUrl={team?.logoUrl}
      isNational={team?.isNational}
      size={big ? 24 : 20}
      label={team?.code}
      className="shrink-0"
    />
  );
}

function resolveFullName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '\u2014';
  return stripWomenSuffix(
    team.name[locale] ??
      team.name['en'] ??
      team.shortName[locale] ??
      team.shortName['en'] ??
      team.code ??
      '\u2014',
  );
}
