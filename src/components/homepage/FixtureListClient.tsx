'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { MatchRowGroup } from './MatchRowGroup';
import type { DaySection } from '@/lib/db/queries/fixtures-by-day';
import type { Locale } from '@/lib/i18n/config';

interface FixtureListClientProps {
  sections: DaySection[];
  locale: Locale;
  todayStr: string;
  labels: {
    matches: string;
    emptyState: string;
  };
}

function generateDates(todayStr: string): { dateStr: string; date: Date }[] {
  const today = new Date(todayStr + 'T12:00:00Z');
  const result: { dateStr: string; date: Date }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);
    result.push({ dateStr: d.toISOString().slice(0, 10), date: d });
  }
  return result;
}

export function FixtureListClient({ sections, locale, todayStr, labels }: FixtureListClientProps) {
  const t = useTranslations('dateStrip');
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const dates = useMemo(() => generateDates(todayStr), [todayStr]);

  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    [locale],
  );
  const numFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric' }), [locale]);

  const currentSection = sections.find((s) => s.date === selectedDate);

  return (
    <div className="w-full self-start overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Heading */}
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{labels.matches}</h3>
      </div>

      {/* Date strip */}
      <div className="flex items-center overflow-x-auto py-2 border-b border-border-subtle">
        {dates.map(({ dateStr, date }) => {
          const isSelected = dateStr === selectedDate;
          const hasMatches = sections.some((s) => s.date === dateStr);
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => setSelectedDate(dateStr)}
              className={cn(
                'flex w-[calc(100%/7)] shrink-0 flex-col items-center justify-center rounded-lg min-h-[56px] py-1.5 text-xs transition-colors',
                isSelected
                  ? 'bg-accent-green text-bg-canvas font-semibold'
                  : hasMatches
                    ? 'text-text-secondary hover:bg-bg-surface-2'
                    : 'text-text-tertiary/50',
              )}
            >
              <span>{dayFormatter.format(date)}</span>
              <span className="text-sm font-medium">{numFormatter.format(date)}</span>
              {dateStr === todayStr && <span className="mt-0.5 text-xs">{t('today')}</span>}
            </button>
          );
        })}
      </div>

      {/* Matches for selected day */}
      {currentSection ? (
        <div>
          {currentSection.groups.map((group, idx) => (
            <MatchRowGroup
              key={`${selectedDate}-${group.competition.id}`}
              group={group}
              locale={locale}
              defaultExpanded={idx < 5}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{labels.emptyState}</p>
        </div>
      )}
    </div>
  );
}
