'use client';

import { useState } from 'react';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo, CompetitionLogo } from '@/components/shared/Logo';
import { useMounted } from '@/hooks/useMounted';

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

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={preview}
      prefetchIntent={enablePrefetch}
      ariaLabel={`${homeName} vs ${awayName}`}
      className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
    >
      {/* Time / Minute */}
      <div className="w-10 shrink-0 text-center">
        {isLive ? (
          <span className="text-xs font-bold tabular-nums text-score-live">
            {fixture.statusCode === 'HT' ? 'HT' : `${fixture.minute ?? ''}'`}
          </span>
        ) : isFinished ? (
          <span className="text-[11px] font-medium text-text-tertiary">FT</span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary">
            {formatMatchTime(fixture.kickoffAt, locale as Locale)}
          </span>
        )}
      </div>

      {/* Home team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 justify-end">
        <span className="truncate text-sm text-text-primary">{homeName}</span>
        {fixture.homeTeam?.logoUrl ? (
          <TeamLogo
            src={fixture.homeTeam.logoUrl}
            size={16}
            className="size-4 shrink-0 object-contain"
          />
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {homeName.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Score */}
      <div className="w-14 shrink-0 text-center tabular-nums">
        {fixture.homeScore != null && fixture.awayScore != null ? (
          <span className={`text-sm font-bold ${isLive ? 'text-score-live' : 'text-text-primary'}`}>
            {fixture.homeScore} - {fixture.awayScore}
          </span>
        ) : (
          <span className="text-xs text-text-tertiary">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {fixture.awayTeam?.logoUrl ? (
          <TeamLogo
            src={fixture.awayTeam.logoUrl}
            size={16}
            className="size-4 shrink-0 object-contain"
          />
        ) : (
          <span className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
            {awayName.slice(0, 2)}
          </span>
        )}
        <span className="truncate text-sm text-text-primary">{awayName}</span>
      </div>

      {/* Live badge */}
      {isLive && (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-score-live/10 px-2 py-0.5 text-[10px] font-bold uppercase text-score-live">
          <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
          Live
        </span>
      )}
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
  const dateLabel = dateOffset === 0 ? `${labels.today}, ${formattedDate}` : formattedDate;

  // Filter each category by selected date (live always shows all)
  const dayLive = live.filter((f) => isSameDay(f.kickoffAt, selectedDate));
  const dayUpcoming = upcoming.filter((f) => isSameDay(f.kickoffAt, selectedDate));
  const dayResults = results.filter((f) => isSameDay(f.kickoffAt, selectedDate));
  const dayAll = [...dayLive, ...dayUpcoming, ...dayResults];

  const tabDefs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: labels.all, count: dayAll.length },
    { key: 'live', label: labels.live, count: dayLive.length },
    { key: 'upcoming', label: labels.upcoming, count: dayUpcoming.length },
    { key: 'results', label: labels.results, count: dayResults.length },
  ];

  const matchesByTab: Record<Tab, HomeFixture[]> = {
    all: dayAll,
    live: dayLive,
    upcoming: dayUpcoming,
    results: dayResults,
  };
  const fixtures = matchesByTab[activeTab];

  const displayLimit = 8;
  const [expanded, setExpanded] = useState(false);
  const hasMore = fixtures.length > displayLimit;
  const displayed = expanded ? fixtures : fixtures.slice(0, displayLimit);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Tab bar */}
      <div className="flex items-center justify-between px-4">
        <div className="flex">
          {tabDefs.map((td) => (
            <button
              key={td.key}
              onClick={() => {
                setActiveTab(td.key);
                setDateOffset(0);
                setExpanded(false);
              }}
              className={`relative px-3 py-3 text-sm font-medium transition-colors ${
                activeTab === td.key
                  ? 'text-accent-azure'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {td.label}
              {mounted && td.count > 0 ? ` (${td.count})` : ''}
              {activeTab === td.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent-azure" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setDateOffset((d) => d - 1);
              setExpanded(false);
            }}
            className="flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span
            className="min-w-[90px] text-center text-xs font-medium text-text-primary"
            suppressHydrationWarning
          >
            {dateLabel}
          </span>
          <button
            onClick={() => {
              setDateOffset((d) => d + 1);
              setExpanded(false);
            }}
            className="flex size-7 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
            aria-label="Next day"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border-subtle" />

      {/* Match rows grouped by competition + date — gated on mounted to avoid
          server-vs-client day-boundary divergence in the filtered fixture set. */}
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
                      key={`sep-${groupKey}`}
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
  );
}
