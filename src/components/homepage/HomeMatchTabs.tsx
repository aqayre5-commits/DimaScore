'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';

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

function MatchRow({ fixture, locale }: { fixture: HomeFixture; locale: string }) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const homeName = getTeamDisplayName(fixture.homeTeam, locale);
  const awayName = getTeamDisplayName(fixture.awayTeam, locale);

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
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
          <img
            src={fixture.homeTeam.logoUrl}
            alt=""
            className="size-4 shrink-0 object-contain"
            loading="lazy"
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
          <img
            src={fixture.awayTeam.logoUrl}
            alt=""
            className="size-4 shrink-0 object-contain"
            loading="lazy"
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
    </Link>
  );
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function HomeMatchTabs({ live, upcoming, results, locale, labels }: Props) {
  type Tab = 'all' | 'live' | 'upcoming' | 'results';
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [dateOffset, setDateOffset] = useState(0);

  // Selected date
  const today = new Date();
  const selectedDate = new Date(today);
  selectedDate.setDate(today.getDate() + dateOffset);

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
                  ? 'text-accent-green'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {td.label} ({td.count})
              {activeTab === td.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-accent-green" />
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
          <span className="min-w-[90px] text-center text-xs font-medium text-text-primary">
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

      {/* Match rows grouped by competition + date */}
      <div>
        {displayed.length > 0 ? (
          (() => {
            const elements: React.ReactNode[] = [];
            let lastGroupKey = '';
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
                      <img
                        src={f.competition.logoUrl}
                        alt=""
                        className="size-4 shrink-0 object-contain"
                        loading="lazy"
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
                  <MatchRow fixture={f} locale={locale} />
                </div>,
              );
            }
            return elements;
          })()
        ) : (
          <div className="px-4 py-8 text-center text-sm text-text-tertiary">{labels.noMatches}</div>
        )}
      </div>

      {/* Show more / Show less */}
      {hasMore && (
        <div className="border-t border-border-subtle px-4 py-2.5 text-center">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-accent-green transition-colors hover:text-accent-green-bright"
          >
            {expanded ? labels.showLess : labels.viewFullSchedule} {expanded ? '\u2191' : '\u2192'}
          </button>
        </div>
      )}
    </div>
  );
}
