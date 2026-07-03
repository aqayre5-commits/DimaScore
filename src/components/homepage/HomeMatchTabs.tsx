'use client';

import { useState } from 'react';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState } from '@/lib/match-status';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';
import { useMounted } from '@/hooks/useMounted';
import { useLiveFixtures, type LiveFixturePatch } from '@/hooks/useLiveFixtures';

interface Props {
  live: HomeFixture[];
  upcoming: HomeFixture[];
  results: HomeFixture[];
  locale: Locale;
  labels: {
    all: string;
    live: string;
    upcoming: string;
    results: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    viewFullSchedule: string;
    showLess: string;
    noMatches: string;
  };
}

function MatchRow({
  fixture,
  locale,
  enablePrefetch,
}: {
  fixture: HomeFixture;
  locale: string;
  enablePrefetch?: boolean;
}) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const homeName = getTeamDisplayName(fixture.homeTeam, locale);
  const awayName = getTeamDisplayName(fixture.awayTeam, locale);

  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    minute: fixture.minute,
    kickoffAt: fixture.kickoffAt,
    competition: { name: fixture.competition.name, slug: fixture.competition.slug },
  });

  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const homeWon = isFinished && hasScore && (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0);
  const awayWon = isFinished && hasScore && (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0);

  const homeBadge = fixture.homeTeam?.logoUrl ? (
    <TeamLogo src={fixture.homeTeam.logoUrl} size={24} className="size-6 shrink-0 object-contain" />
  ) : (
    <span className="flex size-6 shrink-0 items-center justify-center rounded bg-bg-surface-2 text-[9px] font-bold text-text-tertiary">
      {homeName.slice(0, 2)}
    </span>
  );
  const awayBadge = fixture.awayTeam?.logoUrl ? (
    <TeamLogo src={fixture.awayTeam.logoUrl} size={24} className="size-6 shrink-0 object-contain" />
  ) : (
    <span className="flex size-6 shrink-0 items-center justify-center rounded bg-bg-surface-2 text-[9px] font-bold text-text-tertiary">
      {awayName.slice(0, 2)}
    </span>
  );
  const statusNode = isLive ? (
    <span className="text-sm font-bold tabular-nums text-score-live">
      {fixture.statusCode === 'HT' ? 'HT' : `${fixture.minute ?? ''}'`}
    </span>
  ) : isFinished ? (
    <span className="flex flex-col items-center leading-tight">
      <span className="text-xs font-medium text-text-tertiary">
        {fixture.statusCode === 'AET' ? 'AET' : 'FT'}
      </span>
      {fixture.statusCode === 'PEN' &&
        fixture.homeScorePen != null &&
        fixture.awayScorePen != null && (
          <span className="mt-0.5 text-[9px] font-semibold tabular-nums text-text-tertiary">
            PEN {fixture.homeScorePen}-{fixture.awayScorePen}
          </span>
        )}
    </span>
  ) : (
    <span className="text-sm tabular-nums text-text-secondary">
      <LocalTime date={fixture.kickoffAt} locale={locale as Locale} format="time" />
    </span>
  );

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={preview}
      prefetchIntent={enablePrefetch}
      ariaLabel={`${homeName} vs ${awayName}`}
      className="block px-4 py-3 transition-colors hover:bg-accent-azure/10"
    >
      {/* ── Single layout (all breakpoints): teams + per-team scores · divider · time/status ── */}
      <div className="flex items-stretch gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2.5">
            {homeBadge}
            <span
              className={`min-w-0 flex-1 truncate text-base ${awayWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
            >
              {homeName}
            </span>
            {hasScore && (
              <span
                className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : awayWon ? 'text-text-tertiary' : 'text-text-primary'}`}
              >
                {fixture.homeScore}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {awayBadge}
            <span
              className={`min-w-0 flex-1 truncate text-base ${homeWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
            >
              {awayName}
            </span>
            {hasScore && (
              <span
                className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : homeWon ? 'text-text-tertiary' : 'text-text-primary'}`}
              >
                {fixture.awayScore}
              </span>
            )}
          </div>
        </div>

        <div className="w-px shrink-0 self-stretch bg-border-subtle" />

        <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight">
          {statusNode}
        </div>
      </div>
    </MatchLink>
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Overlay the 30s live poll onto fixtures, deduped by id (first occurrence wins). */
function applyLivePatches(
  fixtures: HomeFixture[],
  patches: Map<number, LiveFixturePatch>,
): HomeFixture[] {
  const byId = new Map<number, HomeFixture>();
  for (const f of fixtures) {
    if (byId.has(f.id)) continue;
    const p = patches.get(f.id);
    byId.set(
      f.id,
      p
        ? {
            ...f,
            statusCode: p.statusCode,
            minute: p.minute,
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            homeScorePen: p.homeScorePen,
            awayScorePen: p.awayScorePen,
          }
        : f,
    );
  }
  return [...byId.values()];
}

/** Group fixtures by competition (each competition once) so same-competition matches are
 *  contiguous — one divider per competition. Groups are ordered by the competition's curated
 *  displayPriority (lower = more important, so World Cup / Botola / top leagues lead and
 *  friendlies sink), then earliest kickoff; within a group: live, then upcoming (soonest),
 *  then results (newest first). */
function groupByCompetition(fixtures: HomeFixture[]): HomeFixture[] {
  const rank = (f: HomeFixture) => {
    const s = getMatchState(f.statusCode, f.kickoffAt);
    return s === 'live' ? 0 : s === 'upcoming' ? 1 : 2;
  };
  const sortWithin = (a: HomeFixture, b: HomeFixture) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return ra === 2
      ? b.kickoffAt.getTime() - a.kickoffAt.getTime() // results: newest first
      : a.kickoffAt.getTime() - b.kickoffAt.getTime(); // live/upcoming: soonest first
  };
  const groups = new Map<number, HomeFixture[]>();
  for (const f of fixtures) {
    const arr = groups.get(f.competition.id) ?? [];
    arr.push(f);
    groups.set(f.competition.id, arr);
  }
  return [...groups.values()]
    .map((g) => {
      g.sort(sortWithin);
      return {
        g,
        priority: g[0].competition.displayPriority,
        earliest: Math.min(...g.map((f) => f.kickoffAt.getTime())),
      };
    })
    .sort((a, b) => a.priority - b.priority || a.earliest - b.earliest)
    .flatMap((x) => x.g);
}

export function HomeMatchTabs({ live, upcoming, results, locale, labels }: Props) {
  type Tab = 'all' | 'live' | 'upcoming' | 'results';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [dateOffset, setDateOffset] = useState(0);
  const mounted = useMounted();

  // Selected date (UTC to match fixture kickoff times)
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setUTCDate(today.getUTCDate() + dateOffset);

  const formattedDate = selectedDate.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const dateLabel =
    dateOffset === 0
      ? labels.today
      : dateOffset === -1
        ? labels.yesterday
        : dateOffset === 1
          ? labels.tomorrow
          : formattedDate;

  // Overlay the 30s live poll onto every fixture, then re-bucket by the *patched*
  // status so live rows tick and a finishing match moves Live → Results without a
  // reload. Order: live, then upcoming (soonest first), then results (newest first).
  const livePatches = useLiveFixtures();
  const dayFixtures = applyLivePatches([...live, ...upcoming, ...results], livePatches).filter(
    (f) => isSameDay(f.kickoffAt, selectedDate),
  );
  const dayLive = dayFixtures.filter((f) => getMatchState(f.statusCode, f.kickoffAt) === 'live');
  const dayUpcoming = dayFixtures.filter(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'upcoming',
  );
  const dayResults = dayFixtures.filter(
    (f) => getMatchState(f.statusCode, f.kickoffAt) === 'finished',
  );

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: labels.all, count: dayFixtures.length },
    { key: 'live', label: labels.live, count: dayLive.length },
    { key: 'upcoming', label: labels.upcoming, count: dayUpcoming.length },
    { key: 'results', label: labels.results, count: dayResults.length },
  ];

  // Each tab grouped by competition — one divider per competition, no recurring headers.
  const matchesByTab: Record<Tab, HomeFixture[]> = {
    all: groupByCompetition(dayFixtures),
    live: groupByCompetition(dayLive),
    upcoming: groupByCompetition(dayUpcoming),
    results: groupByCompetition(dayResults),
  };
  const fixtures = matchesByTab[activeTab];

  const displayLimit = 8;
  const [expanded, setExpanded] = useState(false);
  const hasMore = fixtures.length > displayLimit;
  const displayed = expanded ? fixtures : fixtures.slice(0, displayLimit);

  return (
    <div className="space-y-2.5">
      {/* Tabs + day-picker — their own card; stacks on mobile so each gets a full row */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        {/* Segmented tabs — active tab is a filled pill; counts are badges */}
        <div className="p-2.5">
          <div className="flex items-center justify-between gap-1 rounded-xl bg-bg-surface-2 p-1">
            {tabDefs.map((td) => {
              const active = activeTab === td.key;
              return (
                <button
                  key={td.key}
                  onClick={() => {
                    setActiveTab(td.key);
                    setDateOffset(0);
                    setExpanded(false);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent-azure text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{td.label}</span>
                  {mounted && td.count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                        active ? 'bg-white/25 text-white' : 'bg-bg-surface-3 text-text-tertiary'
                      }`}
                    >
                      {td.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border-subtle" />

        {/* Day picker — circular nav buttons flanking a centered date pill */}
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            onClick={() => {
              setDateOffset((d) => d - 1);
              setExpanded(false);
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-text-secondary transition-colors hover:bg-bg-surface-3 hover:text-text-primary"
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => {
              setDateOffset(0);
              setExpanded(false);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-bg-surface-2 px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-surface-3"
            aria-label="Jump to today"
          >
            <Calendar className="size-4 shrink-0 text-accent-azure" />
            <span className="whitespace-nowrap" suppressHydrationWarning>
              {dateLabel}
            </span>
          </button>
          <button
            onClick={() => {
              setDateOffset((d) => d + 1);
              setExpanded(false);
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-text-secondary transition-colors hover:bg-bg-surface-3 hover:text-text-primary"
            aria-label="Next day"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Match list — separate card */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        {/* Grouped by competition + date — gated on mounted to avoid server-vs-client
            day-boundary divergence in the filtered fixture set. */}
        <div>
          {mounted ? (
            displayed.length > 0 ? (
              (() => {
                const elements: React.ReactNode[] = [];
                let lastGroupKey = '';
                let matchIdx = 0;
                for (const f of displayed) {
                  const dateStr = f.kickoffAt.toLocaleDateString(locale, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  });
                  const groupKey = `${f.competition.id}-${f.kickoffAt.toDateString()}`;
                  if (groupKey !== lastGroupKey) {
                    lastGroupKey = groupKey;
                    const compName = f.competition.name[locale] ?? f.competition.name['en'] ?? '';
                    elements.push(
                      <div
                        key={`sep-${matchIdx}-${groupKey}`}
                        className="flex items-center gap-2 bg-bg-surface-2 px-4 py-1.5"
                      >
                        {f.competition.logoUrl ? (
                          <CompetitionLogo
                            src={f.competition.logoUrl}
                            size={16}
                            className="size-4 shrink-0 object-contain"
                          />
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-3 text-[7px] font-bold text-text-tertiary">
                            {compName.slice(0, 2)}
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-text-secondary">
                          {compName}
                        </span>
                        <span className="text-[11px] text-text-tertiary">&middot; {dateStr}</span>
                      </div>,
                    );
                  }
                  elements.push(
                    <div key={f.id} className="border-b border-border-subtle last:border-b-0">
                      <MatchRow fixture={f} locale={locale} enablePrefetch={matchIdx < 3} />
                    </div>,
                  );
                  matchIdx++;
                }
                return elements;
              })()
            ) : (
              <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                {labels.noMatches}
              </div>
            )
          ) : null}
        </div>

        {/* Show more / Show less — also gated, since hasMore depends on the
          mount-time filter result. */}
        {mounted && hasMore && (
          <div className="border-t border-border-subtle px-4 py-2.5 text-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-sm font-medium text-accent-azure transition-colors hover:text-accent-azure/80"
            >
              {expanded ? labels.showLess : labels.viewFullSchedule} {expanded ? '↑' : '→'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
