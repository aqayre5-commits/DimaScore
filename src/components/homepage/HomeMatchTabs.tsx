'use client';

import { useState } from 'react';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState, getMatchStatusLabelKey } from '@/lib/match-status';
import { useTranslations } from 'next-intl';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import { matchHref } from '@/lib/seo/match-slug';
import { CompetitionLogo } from '@/components/shared/Logo';
import { Flag } from '@/components/shared/Flag';
import { useMounted } from '@/hooks/useMounted';
import { useRenderNow } from '@/hooks/useRenderNow';
import { useLiveFixtures, type LiveFixturePatch } from '@/hooks/useLiveFixtures';
import { useFollows } from '@/hooks/useFollows';
import { FollowStar } from '@/components/shared/FollowStar';
import { competitionCrestUrl } from '@/lib/utils/crest';
import { SITE_TZ } from '@/lib/utils/date';

interface Props {
  live: HomeFixture[];
  upcoming: HomeFixture[];
  results: HomeFixture[];
  locale: Locale;
  /** Server time (epoch ms, from getCachedNow) used until mount; see useRenderNow. */
  now: number;
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
    noMatchesToday: string;
    emptyState: string;
    yourMatches: string;
  };
}

function MatchRow({
  fixture,
  locale,
  now,
  enablePrefetch,
}: {
  fixture: HomeFixture;
  locale: string;
  now: Date;
  enablePrefetch?: boolean;
}) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt, now);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const isInterrupted = state === 'interrupted';
  const t = useTranslations('matchDetail');
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
  const showPens =
    fixture.statusCode === 'PEN' && fixture.homeScorePen != null && fixture.awayScorePen != null;
  const homeWon = isFinished && hasScore && (fixture.homeScore ?? 0) > (fixture.awayScore ?? 0);
  const awayWon = isFinished && hasScore && (fixture.awayScore ?? 0) > (fixture.homeScore ?? 0);

  const homeBadge = (
    <Flag
      countryCode={fixture.homeTeam?.countryCode}
      logoUrl={fixture.homeTeam?.logoUrl}
      teamId={fixture.homeTeam?.id}
      isNational={fixture.homeTeam?.isNational}
      size={24}
      label={homeName}
      className="shrink-0"
    />
  );
  const awayBadge = (
    <Flag
      countryCode={fixture.awayTeam?.countryCode}
      logoUrl={fixture.awayTeam?.logoUrl}
      teamId={fixture.awayTeam?.id}
      isNational={fixture.awayTeam?.isNational}
      size={24}
      label={awayName}
      className="shrink-0"
    />
  );
  const statusNode = isLive ? (
    <span className="text-sm font-bold tabular-nums text-score-live">
      {fixture.statusCode === 'HT'
        ? 'HT'
        : fixture.minute != null
          ? `${fixture.minute}'`
          : fixture.statusCode === 'P'
            ? 'PEN'
            : fixture.statusCode}
    </span>
  ) : isFinished ? (
    <span className="flex flex-col items-center leading-tight">
      <span className="text-xs font-medium text-text-tertiary">
        {fixture.statusCode === 'AET' ? 'AET' : 'FT'}
      </span>
      {showPens && (
        <span className="mt-0.5 text-[9px] font-semibold tabular-nums text-text-tertiary">PEN</span>
      )}
    </span>
  ) : isInterrupted ? (
    <span className="text-xs font-semibold text-text-tertiary">
      {t(getMatchStatusLabelKey(fixture.statusCode) ?? 'postponed')}
    </span>
  ) : (
    <span className="text-sm tabular-nums text-text-secondary">
      <LocalTime date={fixture.kickoffAt} locale={locale as Locale} format="time" />
    </span>
  );

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={matchHref(locale, {
        id: fixture.id,
        homeSlug: fixture.homeTeam?.slug,
        awaySlug: fixture.awayTeam?.slug,
      })}
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
                {showPens && (
                  <span className="text-xs font-semibold text-text-tertiary">
                    {' '}
                    ({fixture.homeScorePen})
                  </span>
                )}
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
                {showPens && (
                  <span className="text-xs font-semibold text-text-tertiary">
                    {' '}
                    ({fixture.awayScorePen})
                  </span>
                )}
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

// Day comparison. After mount it is viewer-local, matching the viewer-local separators, date pill
// and kickoff times. Before mount (SSR and the hydration pass) it uses a fixed zone, Morocco's,
// so server and client render the same list and the match list is in the initial HTML instead of
// popping in after mount and shifting everything below it (CLS). For viewers outside Morocco's
// day the list re-buckets once on mount. The zone is the site's editorial zone, SITE_TZ.

const dayKeyFormatters = new Map<string, Intl.DateTimeFormat>();
function dayKey(d: Date, timeZone: string | undefined): string {
  if (!timeZone) return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  let f = dayKeyFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    dayKeyFormatters.set(timeZone, f);
  }
  return f.format(d);
}

export function isSameDay(a: Date, b: Date, timeZone?: string) {
  return dayKey(a, timeZone) === dayKey(b, timeZone);
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
function groupByCompetition(
  fixtures: HomeFixture[],
  now: Date,
  followedComps?: Set<number>,
): HomeFixture[] {
  const rank = (f: HomeFixture) => {
    const s = getMatchState(f.statusCode, f.kickoffAt, now);
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
        followed: followedComps?.has(g[0].competition.id) ? 0 : 1,
      };
    })
    .sort((a, b) => a.followed - b.followed || a.priority - b.priority || a.earliest - b.earliest)
    .flatMap((x) => x.g);
}

// Collapsed view: cap each competition to PER_COMP matches so a busy foreign league can't bury
// Botola/Morocco, and stop at MAX_COLLAPSED rows overall. Expects the priority-ordered, contiguous
// output of groupByCompetition; "View full schedule" reveals the uncapped list.
const PER_COMP = 5;
const MAX_COLLAPSED = 15;
function collapseByCompetition(fixtures: HomeFixture[]): HomeFixture[] {
  const perComp = new Map<number, number>();
  const out: HomeFixture[] = [];
  for (const f of fixtures) {
    if (out.length >= MAX_COLLAPSED) break;
    const seen = perComp.get(f.competition.id) ?? 0;
    if (seen >= PER_COMP) continue;
    perComp.set(f.competition.id, seen + 1);
    out.push(f);
  }
  return out;
}

/** Render a fixture list grouped by competition (a separator row per competition/date, then the
 *  match rows). Shared by the "Your matches" group and the main list. */
function renderGroupedRows(
  list: HomeFixture[],
  locale: string,
  now: Date,
  timeZone?: string,
): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let lastGroupKey = '';
  let matchIdx = 0;
  for (const f of list) {
    const dateStr = f.kickoffAt.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone,
    });
    const groupKey = `${f.competition.id}-${dayKey(f.kickoffAt, timeZone)}`;
    if (groupKey !== lastGroupKey) {
      lastGroupKey = groupKey;
      const compName = f.competition.name[locale] ?? f.competition.name['en'] ?? '';
      elements.push(
        <div
          key={`sep-${matchIdx}-${groupKey}`}
          className="flex items-center gap-2 bg-bg-surface-2 px-4 py-1.5"
        >
          {f.competition.logoUrl || f.competition.id ? (
            <CompetitionLogo
              src={f.competition.logoUrl ?? competitionCrestUrl(f.competition.id)}
              size={16}
              className="size-4 shrink-0 object-contain"
            />
          ) : (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-3 text-[7px] font-bold text-text-tertiary">
              {compName.slice(0, 2)}
            </span>
          )}
          <span className="text-[11px] font-semibold text-text-secondary">{compName}</span>
          {/* Server-rendered now: Node and the browser format the same date with slightly different
              ICU punctuation/spacing, so the client text may legitimately differ after hydration. */}
          <span className="text-[11px] text-text-tertiary" suppressHydrationWarning>
            &middot; {dateStr}
          </span>
        </div>,
      );
    }
    elements.push(
      <div key={f.id} className="border-b border-border-subtle last:border-b-0">
        <MatchRow fixture={f} locale={locale} now={now} enablePrefetch={matchIdx < 3} />
      </div>,
    );
    matchIdx++;
  }
  return elements;
}

export function HomeMatchTabs({ live, upcoming, results, locale, now: serverNow, labels }: Props) {
  type Tab = 'all' | 'live' | 'upcoming' | 'results';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [dateOffset, setDateOffset] = useState(0);
  const mounted = useMounted();
  const { followedTeams, followedComps, toggleComp } = useFollows();
  const tHome = useTranslations('homepage');

  // Selected date in the viewer's local zone (matches the viewer-local labels/separators).
  // Server time until mount, then the viewer's clock (reading the clock while the server renders
  // would pull the whole home page out of the prerendered HTML; see useRenderNow).
  const nowMs = useRenderNow(serverNow);
  const now = new Date(nowMs);
  const today = new Date(nowMs);
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + dateOffset);

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
  const patchedAll = applyLivePatches([...live, ...upcoming, ...results], livePatches);
  // Global "live now", independent of the selected day — the Live tab always means "live now".
  const globalLive = patchedAll.filter(
    (f) => getMatchState(f.statusCode, f.kickoffAt, now) === 'live',
  );
  // Fixed zone until mount so the server HTML and the hydration pass agree (see isSameDay).
  const dayTz = mounted ? undefined : SITE_TZ;
  const dayFixtures = patchedAll.filter((f) => isSameDay(f.kickoffAt, selectedDate, dayTz));
  const dayUpcoming = dayFixtures.filter(
    (f) => getMatchState(f.statusCode, f.kickoffAt, now) === 'upcoming',
  );
  const dayResults = dayFixtures.filter((f) => {
    const s = getMatchState(f.statusCode, f.kickoffAt, now);
    // Interrupted (postponed/abandoned/…) count under Results so All = Live + Upcoming + Results.
    return s === 'finished' || s === 'interrupted';
  });

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: labels.all, count: dayFixtures.length },
    { key: 'live', label: labels.live, count: globalLive.length },
    { key: 'upcoming', label: labels.upcoming, count: dayUpcoming.length },
    { key: 'results', label: labels.results, count: dayResults.length },
  ];

  // Each tab grouped by competition — one divider per competition, no recurring headers.
  const matchesByTab: Record<Tab, HomeFixture[]> = {
    all: groupByCompetition(dayFixtures, now, followedComps),
    live: groupByCompetition(globalLive, now, followedComps),
    upcoming: groupByCompetition(dayUpcoming, now, followedComps),
    results: groupByCompetition(dayResults, now, followedComps),
  };
  const fixtures = matchesByTab[activeTab];

  const [expanded, setExpanded] = useState(false);
  const [selectedComp, setSelectedComp] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Competitions present in the active tab (priority order, with counts) — drives the filter chips.
  const presentComps = (() => {
    const map = new Map<
      number,
      { id: number; name: Record<string, string>; logoUrl: string | null; count: number }
    >();
    for (const f of fixtures) {
      const e = map.get(f.competition.id);
      if (e) e.count++;
      else
        map.set(f.competition.id, {
          id: f.competition.id,
          name: f.competition.name,
          logoUrl: f.competition.logoUrl,
          count: 1,
        });
    }
    return [...map.values()];
  })();

  // Auto-clear a selection that's no longer present (after a live update / day change).
  const effectiveComp =
    selectedComp != null && presentComps.some((c) => c.id === selectedComp) ? selectedComp : null;
  const selectedCompMeta = presentComps.find((c) => c.id === effectiveComp);
  const filterLabel = selectedCompMeta
    ? (selectedCompMeta.name[locale] ?? selectedCompMeta.name['en'] ?? labels.all)
    : labels.all;

  // "Your matches" — followed teams'/competitions' fixtures for the selected day, pinned above the
  // list on the All tab (no chip filter) and deduped from the main list so nothing appears twice.
  const isYours = (f: HomeFixture) =>
    (f.homeTeamId != null && followedTeams.has(f.homeTeamId)) ||
    (f.awayTeamId != null && followedTeams.has(f.awayTeamId)) ||
    followedComps.has(f.competition.id);
  const showYourGroup = mounted && activeTab === 'all' && effectiveComp === null;
  const yourGrouped = showYourGroup
    ? groupByCompetition(dayFixtures.filter(isYours), now, followedComps)
    : [];

  const baseFixtures =
    yourGrouped.length > 0
      ? groupByCompetition(
          dayFixtures.filter((f) => !isYours(f)),
          now,
          followedComps,
        )
      : fixtures;
  const collapsed = collapseByCompetition(baseFixtures);
  // Filtered to one competition → show all its matches (no cap); otherwise the capped/expanded view.
  const displayed =
    effectiveComp != null
      ? fixtures.filter((f) => f.competition.id === effectiveComp)
      : expanded
        ? baseFixtures
        : collapsed;
  const hasMore = effectiveComp == null && baseFixtures.length > collapsed.length;

  const filterRowClass = (active: boolean) =>
    `rounded-md px-2 py-1.5 text-sm transition-colors ${
      active
        ? 'bg-accent-azure/10 font-semibold text-accent-azure'
        : 'text-text-secondary hover:bg-bg-surface-2'
    }`;

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
                    setSelectedComp(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-accent-azure text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <span>{td.label}</span>
                  {td.count > 0 && (
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

          {/* Competition filter — compact dropdown on the same line as the day picker (replaces the
              old full-width chip scroller). Trigger shows the active competition (or "All"). */}
          {presentComps.length >= 2 && (
            <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
              <DropdownMenuTrigger
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-bg-surface-2 px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-bg-surface-3"
                aria-label={labels.all}
              >
                <span className="max-w-[38vw] truncate sm:max-w-[150px]">{filterLabel}</span>
                <ChevronDown className="size-4 shrink-0 text-text-tertiary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-80 w-56 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedComp(null);
                    setFilterOpen(false);
                  }}
                  className={`w-full text-start ${filterRowClass(effectiveComp === null)}`}
                >
                  {labels.all}
                </button>
                {presentComps.map((c) => {
                  const name = c.name[locale] ?? c.name['en'] ?? '';
                  const followed = followedComps.has(c.id);
                  return (
                    <div key={c.id} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedComp(c.id);
                          setFilterOpen(false);
                        }}
                        className={`flex min-w-0 flex-1 items-center gap-2 ${filterRowClass(effectiveComp === c.id)}`}
                      >
                        <CompetitionLogo
                          src={c.logoUrl ?? competitionCrestUrl(c.id)}
                          size={16}
                          className="size-4 shrink-0 object-contain"
                        />
                        <span className="min-w-0 flex-1 truncate text-start">{name}</span>
                        <span className="shrink-0 tabular-nums text-text-tertiary">{c.count}</span>
                      </button>
                      <FollowStar
                        active={followed}
                        onToggle={() => toggleComp(c.id)}
                        label={
                          followed ? tHome('unfollowAria', { name }) : tHome('followAria', { name })
                        }
                      />
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Match list — separate card */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        {/* Grouped by competition + date. Rendered on the server too (in Morocco's day until
            mount, see isSameDay) so the list doesn't pop in and shift the page. */}
        <div>
          <>
            {yourGrouped.length > 0 && (
              <>
                <div className="flex items-center gap-2 bg-bg-surface-2 px-4 py-2">
                  <Star className="size-3.5 shrink-0 fill-current text-yellow-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    {labels.yourMatches}
                  </span>
                </div>
                {renderGroupedRows(yourGrouped, locale, now, dayTz)}
              </>
            )}
            {displayed.length > 0
              ? renderGroupedRows(displayed, locale, now, dayTz)
              : yourGrouped.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                    {patchedAll.length === 0
                      ? labels.emptyState
                      : dateOffset === 0
                        ? labels.noMatchesToday
                        : labels.noMatches}
                  </div>
                )}
          </>
        </div>

        {/* Show more / Show less — rendered pre-mount too, from the same fixed-zone list. */}
        {hasMore && (
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
