'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Bell, Calendar, MapPin, Users } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import type { HomeFixture, FormResult } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  matches: HomeFixture[];
  teamForm: Record<number, FormResult[]>;
  locale: Locale;
  labels: {
    featuredMatch: string;
    kicksOffIn: string;
    viewMatchPreview: string;
    setReminder: string;
    stadium: string;
    expectedAttendance: string;
  };
}

const INTL_LOCALE: Record<Locale, string> = {
  ar: 'ar-MA',
  fr: 'fr-FR',
  en: 'en-GB',
};

function useCountdown(kickoffAt: Date) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [kickoffAt]);

  const ms = Math.max(0, kickoffAt.getTime() - now.getTime());
  const totalMin = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

function formatFeaturedDate(date: Date, locale: Locale): string {
  const intlLocale = INTL_LOCALE[locale];
  const weekday = new Intl.DateTimeFormat(intlLocale, { weekday: 'short' }).format(new Date(date));
  const day = new Intl.DateTimeFormat(intlLocale, { day: 'numeric' }).format(new Date(date));
  const month = new Intl.DateTimeFormat(intlLocale, { month: 'long' }).format(new Date(date));
  const time = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));

  return `${weekday} ${day} ${month} · ${time}`.toUpperCase();
}

export function HomeFeaturedCarousel({ matches, teamForm, locale, labels }: Props) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(
    () => setIdx((i) => (i === matches.length - 1 ? 0 : i + 1)),
    [matches.length],
  );

  // 7s auto-advance, pause on hover
  useEffect(() => {
    if (matches.length <= 1 || hovered) return;
    timerRef.current = setInterval(next, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matches.length, hovered, next]);

  // Reset timer on manual nav
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
      className="relative overflow-hidden rounded-xl border border-border-subtle"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Stadium background */}
      <div className="absolute inset-0">
        <img
          src="/images/featured-card-background.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/85" />
      </div>

      {/* Badge */}
      <div className="absolute start-4 top-3 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-green/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-green">
          <span className="text-[13px]">★</span>
          {labels.featuredMatch}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pb-4 pt-12">
        <CarouselSlide match={match} teamForm={teamForm} locale={locale} labels={labels} />
      </div>

      {/* Navigation arrows */}
      {matches.length > 1 && (
        <>
          <button
            onClick={() => goTo(idx === 0 ? matches.length - 1 : idx - 1)}
            className="absolute start-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white/60 transition-colors hover:bg-black/60 hover:text-white"
            aria-label="Previous"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => goTo(idx === matches.length - 1 ? 0 : idx + 1)}
            className="absolute end-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white/60 transition-colors hover:bg-black/60 hover:text-white"
            aria-label="Next"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {matches.length > 1 && (
        <div className="relative z-10 flex justify-center gap-2 pb-4">
          {matches.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`size-2.5 rounded-full transition-colors ${i === idx ? 'bg-accent-green' : 'bg-white/30'}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CarouselSlide({
  match,
  teamForm,
  locale,
  labels,
}: {
  match: HomeFixture;
  teamForm: Record<number, FormResult[]>;
  locale: Locale;
  labels: Props['labels'];
}) {
  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const { days, hours, minutes } = useCountdown(match.kickoffAt);
  const homeForm = match.homeTeamId ? teamForm[match.homeTeamId] : undefined;
  const awayForm = match.awayTeamId ? teamForm[match.awayTeamId] : undefined;

  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      {/* Competition + Group/Round */}
      <p className="text-[13px] font-semibold uppercase tracking-wider text-white/80">
        {compName}
        {(match.groupLabel || match.round) && <span> · {match.groupLabel ?? match.round}</span>}
      </p>

      {/* Teams + VS */}
      <div className="flex w-full items-center justify-center gap-6 py-2">
        {/* Home */}
        <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
          {match.homeTeam?.logoUrl ? (
            <img
              src={match.homeTeam.logoUrl}
              alt=""
              className="h-16 w-20 object-contain drop-shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-20 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/60">
              {homeName[0]}
            </div>
          )}
          <span className="w-full truncate text-sm font-bold text-white">{homeName}</span>
          {homeForm && <FormBadges form={homeForm} />}
        </div>

        {/* VS */}
        <div className="shrink-0 text-center">
          <p className="text-3xl font-bold text-accent-green">VS</p>
        </div>

        {/* Away */}
        <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
          {match.awayTeam?.logoUrl ? (
            <img
              src={match.awayTeam.logoUrl}
              alt=""
              className="h-16 w-20 object-contain drop-shadow-lg"
            />
          ) : (
            <div className="flex h-16 w-20 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/60">
              {awayName[0]}
            </div>
          )}
          <span className="w-full truncate text-sm font-bold text-white">{awayName}</span>
          {awayForm && <FormBadges form={awayForm} />}
        </div>
      </div>

      {/* Date + Time */}
      <p className="inline-flex items-center gap-1.5 text-[12px] font-medium text-white/70">
        <Calendar className="size-3.5" />
        {formatFeaturedDate(match.kickoffAt, locale)}
      </p>

      {/* Kickoff countdown */}
      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
          {labels.kicksOffIn}
        </span>
        <div className="flex items-center overflow-hidden rounded-lg border border-white/10 bg-black/40">
          <CountdownUnit value={days} label="DAYS" />
          <div className="h-10 w-px bg-white/10" />
          <CountdownUnit value={hours} label="HOURS" />
          <div className="h-10 w-px bg-white/10" />
          <CountdownUnit value={minutes} label="MINS" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Link
          href={`/${locale}/match/${match.id}`}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-green px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-green/90"
        >
          <Play className="size-3.5 fill-current" />
          {labels.viewMatchPreview}
        </Link>
        <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-[13px] font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white">
          <Bell className="size-3.5" />
          {labels.setReminder}
        </button>
      </div>

      {/* Bottom info bar */}
      {(match.venueName || match.venueCapacity) && (
        <div className="mt-1 flex w-full items-center justify-center gap-6 border-t border-white/10 pt-3">
          {match.venueName && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <MapPin className="size-3.5" />
              <span>
                {match.venueName}
                {match.venueCity && `, ${match.venueCity}`}
              </span>
            </div>
          )}
          {match.venueCapacity && (
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <Users className="size-3.5" />
              <span>{match.venueCapacity.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2">
      <span className="text-xl font-bold tabular-nums leading-none text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[9px] font-medium uppercase tracking-wider text-white/50">
        {label}
      </span>
    </div>
  );
}

function FormBadges({ form }: { form: FormResult[] }) {
  const colors: Record<FormResult, string> = {
    W: 'bg-green-500',
    D: 'bg-amber-500',
    L: 'bg-red-500',
  };

  return (
    <div className="flex items-center gap-1">
      {form.map((r, i) => (
        <span
          key={i}
          className={`flex size-5 items-center justify-center rounded-sm text-[9px] font-bold text-white ${colors[r]}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
