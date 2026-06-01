'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatFeaturedDate } from '@/lib/utils/date';
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

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeCountdown(kickoffAt)), 60_000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  return remaining;
}

export function HomeFeaturedCarousel({ matches, locale, labels }: Props) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(
    () => setIdx((i) => (i === matches.length - 1 ? 0 : i + 1)),
    [matches.length],
  );

  useEffect(() => {
    if (matches.length <= 1 || hovered) return;
    timerRef.current = setInterval(next, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matches.length, hovered, next]);

  const goTo = useCallback((i: number) => {
    setIdx(i);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  if (matches.length === 0) return null;

  const match = matches[idx];

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Badge */}
      <div className="absolute start-4 top-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-azure/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-azure">
          ★ {labels.featuredMatch}
        </span>
      </div>

      {/* Slide content */}
      <div className="flex flex-col items-center px-8 pb-2 pt-14">
        <CarouselSlide match={match} locale={locale} labels={labels} isFirst={idx === 0} />
      </div>

      {/* Venue info — inline with dots row */}

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={() => goTo(idx === 0 ? matches.length - 1 : idx - 1)}
            className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-bg-surface-2 p-2 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary"
            aria-label="Previous"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => goTo(idx === matches.length - 1 ? 0 : idx + 1)}
            className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-bg-surface-2 p-2 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary"
            aria-label="Next"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Bottom bar: stadium · dots · capacity */}
      <div className="flex items-center justify-between px-6 pb-4 pt-3">
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
  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const { days, hours, minutes } = useCountdown(match.kickoffAt);

  return (
    <div className="flex w-full flex-col items-center gap-4 text-center">
      {/* Competition + Group/Round */}
      <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
        {compName}
        {(match.groupLabel || match.round) && (
          <span className="text-text-tertiary"> · {match.groupLabel ?? match.round}</span>
        )}
      </p>

      {/* Teams row */}
      <div className="flex w-full items-center justify-center gap-3">
        {/* Home team */}
        <div className="flex w-[160px] flex-col items-center">
          <div className="flex h-[96px] items-center justify-center">
            {match.homeTeam?.logoUrl ? (
              <Image
                src={match.homeTeam.logoUrl}
                alt=""
                className="h-[96px] w-[96px] object-contain"
                width={96}
                height={96}
                {...(isFirst ? { priority: true } : {})}
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-bg-surface-2 text-xl font-bold text-text-tertiary">
                {homeName[0]}
              </div>
            )}
          </div>
          <span className="mt-2 w-full truncate text-sm font-bold text-text-primary">
            {homeName}
          </span>
        </div>

        {/* Center: VS + date */}
        <div className="flex shrink-0 flex-col items-center gap-2 px-2">
          <span className="text-3xl font-black tracking-tight text-accent-azure">VS</span>
          <p className="text-xs font-medium tracking-wide text-text-tertiary">
            {formatFeaturedDate(match.kickoffAt, locale)}
          </p>
        </div>

        {/* Away team */}
        <div className="flex w-[160px] flex-col items-center">
          <div className="flex h-[96px] items-center justify-center">
            {match.awayTeam?.logoUrl ? (
              <Image
                src={match.awayTeam.logoUrl}
                alt=""
                className="h-[96px] w-[96px] object-contain"
                width={96}
                height={96}
                {...(isFirst ? { priority: true } : {})}
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-full bg-bg-surface-2 text-xl font-bold text-text-tertiary">
                {awayName[0]}
              </div>
            )}
          </div>
          <span className="mt-2 w-full truncate text-sm font-bold text-text-primary">
            {awayName}
          </span>
        </div>
      </div>

      {/* Countdown */}
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
