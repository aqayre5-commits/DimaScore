'use client';

import { useRef, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

function generateDates(): Date[] {
  const today = new Date();
  const dates: Date[] = [];
  for (let offset = -1; offset <= 6; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    dates.push(d);
  }
  return dates;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DateStripProps {
  onSelectDate?: (date: Date) => void;
}

export function DateStrip({ onSelectDate }: DateStripProps) {
  const t = useTranslations('dateStrip');
  const locale = useLocale();
  const dates = generateDates();
  const today = new Date();
  const todayIndex = 1;
  const [focusIndex, setFocusIndex] = useState(todayIndex);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const numFormatter = new Intl.DateTimeFormat(locale, { day: 'numeric' });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = focusIndex;
      switch (e.key) {
        case 'ArrowRight':
          next = Math.min(focusIndex + 1, dates.length - 1);
          break;
        case 'ArrowLeft':
          next = Math.max(focusIndex - 1, 0);
          break;
        case 'Home':
          next = 0;
          break;
        case 'End':
          next = dates.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      setFocusIndex(next);
      buttonsRef.current[next]?.focus();
    },
    [focusIndex, dates.length],
  );

  return (
    <div className="border-b border-border-subtle bg-bg-surface">
      <div
        className="flex items-center gap-1 overflow-x-auto ps-4 pe-4 py-2"
        role="tablist"
        aria-label={t('today')}
        onKeyDown={handleKeyDown}
      >
        {dates.map((date, i) => {
          const isToday = isSameDay(date, today);
          return (
            <button
              key={date.toISOString()}
              ref={(el) => {
                buttonsRef.current[i] = el;
              }}
              role="tab"
              tabIndex={focusIndex === i ? 0 : -1}
              aria-selected={isToday}
              onClick={() => onSelectDate?.(date)}
              className={cn(
                'flex shrink-0 flex-col items-center rounded-lg px-3 py-1.5 text-xs transition-colors',
                isToday
                  ? 'bg-accent-green text-bg-canvas font-semibold'
                  : 'text-text-secondary hover:bg-bg-surface-2',
              )}
            >
              <span>{dayFormatter.format(date)}</span>
              <span className="text-sm font-medium">{numFormatter.format(date)}</span>
              {isToday && <span className="mt-0.5 text-xs">{t('today')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
