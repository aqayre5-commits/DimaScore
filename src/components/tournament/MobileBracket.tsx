'use client';

import { useEffect, useRef } from 'react';
import type { Locale } from '@/lib/i18n/config';
import { BracketMatchCell, type BracketMatch, type KnockoutPhase } from './BracketMatchCell';

interface MobileBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  activePhase: KnockoutPhase;
}

/** Ordered sequence of rounds for mobile slides. 3rd place last per spec. */
const MOBILE_PHASES: KnockoutPhase[] = ['r32', 'r16', 'qf', 'sf', 'final', '3rd'];

/**
 * Mobile knockout bracket — horizontal scroll-snap with one slide per round.
 * No connecting lines on mobile (per spec).
 *
 * RTL: dir="rtl" reverses scroll direction naturally. R32 starts on the
 * right, user swipes left to advance through rounds.
 *
 * PhaseSelector integration: activePhase changes trigger scrollIntoView
 * on the corresponding slide. Skips initial mount to avoid jump-scroll.
 * Two-way sync (scroll position -> chip update via IntersectionObserver)
 * deferred.
 */
export function MobileBracket({
  matches,
  thirdPlaceMatch,
  locale,
  activePhase,
}: MobileBracketProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const isRtl = locale === 'ar';

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const container = scrollRef.current;
    if (!container) return;
    const slide = container.querySelector<HTMLElement>(`[data-phase="${activePhase}"]`);
    if (slide) {
      slide.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }, [activePhase]);

  return (
    <div
      ref={scrollRef}
      dir={isRtl ? 'rtl' : undefined}
      className="flex snap-x snap-mandatory overflow-x-auto pb-4"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {MOBILE_PHASES.map((phase) => {
        const slideMatches =
          phase === '3rd'
            ? thirdPlaceMatch
              ? [thirdPlaceMatch]
              : []
            : matches.filter((m) => m.phase === phase);

        if (slideMatches.length === 0) return null;

        return (
          <div key={phase} data-phase={phase} className="w-full flex-none snap-start px-2">
            {/* Round header */}
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {slideMatches[0].roundLabel}
            </p>

            {/* Stacked match cells */}
            <div className="flex flex-col items-center gap-2">
              {slideMatches.map((match) => (
                <BracketMatchCell
                  key={match.matchId}
                  match={match}
                  className="w-full max-w-[280px]"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
