'use client';

import { useState, useMemo } from 'react';
import { CalendarDays, ListFilter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { RoundInfo } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';

interface LeagueFixturesCardProps {
  fixtures: FixtureWithTeams[];
  rounds: RoundInfo[];
  defaultRound: number;
  locale: Locale;
}

function formatRoundLabel(round: string): string {
  const match = round.match(/(\d+)$/);
  return match ? match[1] : round;
}

const DATE_LOCALE_MAP: Record<string, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  ar: 'ar-MA',
};

function groupByDate(fixtures: FixtureWithTeams[], locale: Locale) {
  const dateLocale = DATE_LOCALE_MAP[locale] ?? 'en-GB';
  const groups: { dateKey: string; label: string; fixtures: FixtureWithTeams[] }[] = [];
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
        month: 'short',
      }).format(f.kickoffAt);
      seen.set(dateKey, groups.length);
      groups.push({ dateKey, label, fixtures: [f] });
    }
  }

  return groups;
}

export function LeagueFixturesCard({
  fixtures,
  rounds,
  defaultRound,
  locale,
}: LeagueFixturesCardProps) {
  const t = useTranslations('leaguePage');
  const [selectedRound, setSelectedRound] = useState(defaultRound);
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Shared 15s live poll. Overlay onto the SSR snapshot before filter/group runs so the live
  // pill, scores, and round-selector counts all reflect the current match state.
  const livePatches = useLiveFixtures();
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

  const roundFixtures = useMemo(
    () => patchedFixtures.filter((f) => f.roundNumber === selectedRound),
    [patchedFixtures, selectedRound],
  );

  const dateGroups = useMemo(() => groupByDate(roundFixtures, locale), [roundFixtures, locale]);

  const finalGroups = useMemo(() => {
    if (dateFilter === 'all') return dateGroups;
    return dateGroups.filter((g) => g.dateKey === dateFilter);
  }, [dateGroups, dateFilter]);

  const handleRoundChange = (round: number) => {
    setSelectedRound(round);
    setDateFilter('all');
  };

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Round dropdown */}
        <div className="relative">
          <ListFilter className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
          <select
            value={selectedRound}
            onChange={(e) => handleRoundChange(Number(e.target.value))}
            className="appearance-none rounded-lg border border-border-subtle bg-bg-surface py-1.5 pl-8 pr-6 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {rounds.map((r) => (
              <option key={r.roundNumber} value={r.roundNumber}>
                {t('round')} {formatRoundLabel(r.round)}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
            ▼
          </span>
        </div>

        {/* Date dropdown */}
        {dateGroups.length >= 1 && (
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="appearance-none rounded-lg border border-border-subtle bg-bg-surface py-1.5 pl-8 pr-6 text-xs font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">{t('dateFilter')}</option>
              {dateGroups.map((g) => (
                <option key={g.dateKey} value={g.dateKey}>
                  {g.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-tertiary">
              ▼
            </span>
          </div>
        )}
      </div>

      {/* Fixtures grouped by date */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface">
        {finalGroups.map((group) => (
          <div key={group.dateKey}>
            <div className="border-b border-border-subtle bg-bg-surface-3 px-4 py-1.5">
              <span
                className="text-xs font-medium uppercase text-text-tertiary"
                suppressHydrationWarning
              >
                {group.label}
              </span>
            </div>
            <div className="divide-y divide-border-subtle px-4">
              {group.fixtures.map((f) => (
                <FixtureRow
                  key={f.id}
                  fixtureId={f.id}
                  kickoffAt={f.kickoffAt}
                  statusCode={f.statusCode}
                  homeTeam={f.homeTeam}
                  awayTeam={f.awayTeam}
                  homeScore={f.homeScore}
                  awayScore={f.awayScore}
                  homeScorePen={f.homeScorePen}
                  awayScorePen={f.awayScorePen}
                  locale={locale}
                />
              ))}
            </div>
          </div>
        ))}

        {roundFixtures.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-text-tertiary">{t('noFixtures')}</div>
        )}
      </div>
    </div>
  );
}
