'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { stripWomenSuffix, getNationalFlagUrl } from '@/lib/team-display';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState } from '@/lib/match-status';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface Props {
  matches: HomeFixture[];
  locale: Locale;
  labels: {
    featuredMatch: string;
    kicksOffIn: string;
    stadium: string;
    expectedAttendance: string;
  };
}

function computeCountdown(kickoffAt: Date) {
  const ms = Math.max(0, new Date(kickoffAt).getTime() - Date.now());
  const totalMin = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

function useCountdown(kickoffAt: Date) {
  const [remaining, setRemaining] = useState(() => computeCountdown(kickoffAt));
  const [prevTime, setPrevTime] = useState(kickoffAt.getTime());

  // Recompute immediately when the slide (kickoffAt) changes — adjusting state
  // during render (not in an effect), so a new slide never shows the old countdown.
  if (prevTime !== kickoffAt.getTime()) {
    setPrevTime(kickoffAt.getTime());
    setRemaining(computeCountdown(kickoffAt));
  }

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeCountdown(kickoffAt)), 60_000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  return remaining;
}

export function HomeFeaturedCarousel({ matches, locale, labels }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePatches = useLiveFixtures();

  const next = useCallback(
    () => setIdx((i) => (i === matches.length - 1 ? 0 : i + 1)),
    [matches.length],
  );

  useEffect(() => {
    if (matches.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 10000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matches.length, paused, next]);

  const goTo = useCallback((i: number) => {
    setIdx(i);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  if (matches.length === 0) return null;

  // Overlay the live poll so a featured match that kicks off (or finishes) while you're
  // on the page flips from "VS + countdown" to a live/final score.
  const raw = matches[idx];
  const patch = livePatches.get(raw.id);
  const match: HomeFixture = patch
    ? {
        ...raw,
        statusCode: patch.statusCode,
        minute: patch.minute,
        homeScore: patch.homeScore,
        awayScore: patch.awayScore,
        homeScorePen: patch.homeScorePen,
        awayScorePen: patch.awayScorePen,
      }
    : raw;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Badge */}
      <div className="absolute start-4 top-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-azure/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-azure">
          ★ {labels.featuredMatch}
        </span>
      </div>

      {/* Slide content */}
      <div className="flex flex-col items-center px-4 pb-2 pt-14 sm:px-8">
        <CarouselSlide match={match} locale={locale} labels={labels} isFirst={idx === 0} />
      </div>

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={() => goTo(idx === 0 ? matches.length - 1 : idx - 1)}
            className="absolute start-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-bg-surface-2 p-3 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary sm:block"
            aria-label="Previous"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => goTo(idx === matches.length - 1 ? 0 : idx + 1)}
            className="absolute end-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-bg-surface-2 p-3 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary sm:block"
            aria-label="Next"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Bottom bar: stadium · dots · capacity */}
      <div className="flex items-center justify-between px-4 pb-4 pt-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-medium text-text-secondary">
          {match.venueName && (
            <>
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">
                {match.venueName}
                {match.venueCity ? `, ${match.venueCity}` : ''}
              </span>
            </>
          )}
        </div>
        {matches.length > 1 && (
          <div className="flex shrink-0 items-center gap-1.5 px-4">
            {matches.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all ${
                  i === idx
                    ? 'h-2 w-5 bg-accent-azure'
                    : 'size-2 bg-border-subtle hover:bg-text-tertiary'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-xs font-medium text-text-secondary">
          {match.venueCapacity && (
            <>
              <Users className="size-3.5 shrink-0" />
              <span>{match.venueCapacity.toLocaleString()}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CarouselSlide({
  match,
  locale,
  labels,
  isFirst,
}: {
  match: HomeFixture;
  locale: Locale;
  labels: Props['labels'];
  isFirst: boolean;
}) {
  const homeName = stripWomenSuffix(getTeamDisplayName(match.homeTeam, locale));
  const awayName = stripWomenSuffix(getTeamDisplayName(match.awayTeam, locale));
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const { days, hours, minutes } = useCountdown(match.kickoffAt);

  const state = getMatchState(match.statusCode, match.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const showScore = (isLive || isFinished) && match.homeScore != null && match.awayScore != null;

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {/* Competition + Group/Round */}
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {compName}
        {match.contextLabel && <span className="text-text-tertiary"> · {match.contextLabel}</span>}
      </p>

      {/* Teams row */}
      <div className="flex w-full items-center justify-center gap-3">
        {/* Home team */}
        <div className="flex min-w-0 flex-1 flex-col items-center sm:w-[160px] sm:flex-none">
          <div className="flex h-12 items-center justify-center sm:h-[72px]">
            {getNationalFlagUrl(match.homeTeam) ? (
              <Image
                src={getNationalFlagUrl(match.homeTeam)!}
                alt=""
                className="h-12 w-16 rounded-sm object-contain ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24"
                width={96}
                height={72}
                {...(isFirst ? { priority: true } : {})}
              />
            ) : (
              <div className="flex h-12 w-16 items-center justify-center rounded-sm bg-bg-surface-2 text-lg font-bold text-text-tertiary ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24">
                {homeName[0]}
              </div>
            )}
          </div>
          <span className="mt-2 w-full truncate text-sm font-bold text-text-primary">
            {homeName}
          </span>
        </div>

        {/* Center: live/final score or VS + date */}
        <div className="flex shrink-0 flex-col items-center gap-2 px-2">
          {showScore ? (
            <>
              <span className="text-3xl font-black tabular-nums tracking-tight text-text-primary">
                {match.homeScore} - {match.awayScore}
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-xs font-bold text-score-live">
                  <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
                  {match.statusCode === 'HT' ? 'HT' : `${match.minute ?? ''}'`}
                </span>
              ) : (
                <span className="text-xs font-medium text-text-tertiary">
                  {match.statusCode === 'AET' ? 'AET' : 'FT'}
                  {match.statusCode === 'PEN' &&
                  match.homeScorePen != null &&
                  match.awayScorePen != null
                    ? ` · PEN ${match.homeScorePen}-${match.awayScorePen}`
                    : ''}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-3xl font-black tracking-tight text-accent-azure">VS</span>
              <p
                className="text-xs font-medium tracking-wide text-text-tertiary"
                suppressHydrationWarning
              >
                <LocalTime date={match.kickoffAt} locale={locale} format="featured" />
              </p>
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex min-w-0 flex-1 flex-col items-center sm:w-[160px] sm:flex-none">
          <div className="flex h-12 items-center justify-center sm:h-[72px]">
            {getNationalFlagUrl(match.awayTeam) ? (
              <Image
                src={getNationalFlagUrl(match.awayTeam)!}
                alt=""
                className="h-12 w-16 rounded-sm object-contain ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24"
                width={96}
                height={72}
                {...(isFirst ? { priority: true } : {})}
              />
            ) : (
              <div className="flex h-12 w-16 items-center justify-center rounded-sm bg-bg-surface-2 text-lg font-bold text-text-tertiary ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24">
                {awayName[0]}
              </div>
            )}
          </div>
          <span className="mt-2 w-full truncate text-sm font-bold text-text-primary">
            {awayName}
          </span>
        </div>
      </div>

      {/* Countdown — only before kickoff */}
      {state === 'upcoming' && (
        <div className="flex flex-col items-center gap-2 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
            {labels.kicksOffIn}
          </span>
          <div className="flex items-center overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-2">
            <CountdownUnit value={days} label="DAYS" />
            <div className="h-12 w-px bg-border-subtle" />
            <CountdownUnit value={hours} label="HOURS" />
            <div className="h-12 w-px bg-border-subtle" />
            <CountdownUnit value={minutes} label="MINS" />
          </div>
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-2.5">
      <span
        className="text-2xl font-bold tabular-nums leading-none text-text-primary"
        suppressHydrationWarning
      >
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[8px] font-semibold uppercase tracking-widest text-text-tertiary">
        {label}
      </span>
    </div>
  );
}
