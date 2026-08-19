'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { stripWomenSuffix, getNationalFlagUrl } from '@/lib/team-display';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState } from '@/lib/match-status';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';

type FeatureTag = NonNullable<HomeFixture['featureTag']>;

interface Props {
  matches: HomeFixture[];
  locale: Locale;
  labels: {
    matchOfDay: string;
    featured: string;
    kicksOffIn: string;
    live: string;
    tags: Record<FeatureTag, string>;
  };
}

function applyPatch(m: HomeFixture, patch: ReturnType<ReturnType<typeof useLiveFixtures>['get']>) {
  if (!patch) return m;
  return {
    ...m,
    statusCode: patch.statusCode,
    minute: patch.minute,
    homeScore: patch.homeScore,
    awayScore: patch.awayScore,
    homeScorePen: patch.homeScorePen,
    awayScorePen: patch.awayScorePen,
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

/**
 * Reimagined landing hero: a single rotating hero across the top ranked matches (Morocco-first +
 * imminence-first + diversity cap from getFeaturedMatches). Live matches are pulled to the front,
 * finished slides are dropped, and rotation pauses on hover/focus. The server's #1 keeps the
 * "Match of the day" badge; other slides read "Featured".
 */
export function HomeFeatured({ matches, locale, labels }: Props) {
  const livePatches = useLiveFixtures();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patched = matches.map((m) => applyPatch(m, livePatches.get(m.id)));
  const notFinished = patched.filter(
    (m) => getMatchState(m.statusCode, m.kickoffAt) !== 'finished',
  );
  const base = notFinished.length > 0 ? notFinished : patched;
  // Live-first: a match in progress always leads; the rest keep the server ranking.
  const live = base.filter((m) => getMatchState(m.statusCode, m.kickoffAt) === 'live');
  const upcoming = base.filter((m) => getMatchState(m.statusCode, m.kickoffAt) !== 'live');
  const view = [...live, ...upcoming].slice(0, 8);
  const matchOfDayId = matches[0]?.id ?? null;

  const safeIdx = idx < view.length ? idx : 0;

  const next = useCallback(() => setIdx((i) => (i >= view.length - 1 ? 0 : i + 1)), [view.length]);

  useEffect(() => {
    if (view.length <= 1 || paused) return;
    timerRef.current = setInterval(next, 9000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view.length, paused, next]);

  const goTo = useCallback((i: number) => {
    setIdx(i);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  if (view.length === 0) return null;
  const match = view[safeIdx];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative">
        <HeroCard
          match={match}
          locale={locale}
          labels={labels}
          isLead={match.id === matchOfDayId}
        />

        {view.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(safeIdx === 0 ? view.length - 1 : safeIdx - 1)}
              aria-label="Previous"
              className="absolute start-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-bg-surface-2 p-3 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary sm:block"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(safeIdx === view.length - 1 ? 0 : safeIdx + 1)}
              aria-label="Next"
              className="absolute end-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-bg-surface-2 p-3 text-text-tertiary transition-colors hover:bg-bg-surface-3 hover:text-text-primary sm:block"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
      </div>

      {view.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {view.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all ${
                i === safeIdx
                  ? 'h-2 w-5 bg-accent-azure'
                  : 'size-2 bg-border-subtle hover:bg-text-tertiary'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TagChip({ tag, labels }: { tag: FeatureTag; labels: Props['labels'] }) {
  const styles: Record<FeatureTag, string> = {
    atlasLions: 'bg-accent-emerald/12 text-accent-emerald',
    atlasClub: 'bg-accent-emerald/12 text-accent-emerald',
    derby: 'bg-score-live/12 text-score-live',
    knockout: 'bg-accent-amber/15 text-accent-amber',
    opener: 'bg-accent-azure/12 text-accent-azure',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles[tag]}`}
    >
      {labels.tags[tag]}
    </span>
  );
}

function TeamCrest({ team }: { team: HomeFixture['homeTeam'] }) {
  const url = team ? (getNationalFlagUrl(team) ?? team.logoUrl) : null;
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={96}
        height={72}
        className="h-12 w-16 rounded-sm object-contain ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24"
      />
    );
  }
  const initial = team ? Object.values(team.name)[0]?.[0] : '?';
  return (
    <div className="flex h-12 w-16 items-center justify-center rounded-sm bg-bg-surface-2 font-bold text-text-tertiary ring-1 ring-border-subtle/40 sm:h-[72px] sm:w-24">
      {initial}
    </div>
  );
}

function HeroCard({
  match,
  locale,
  labels,
  isLead,
}: {
  match: HomeFixture;
  locale: Locale;
  labels: Props['labels'];
  isLead: boolean;
}) {
  const [remaining, setRemaining] = useState(() => computeCountdown(match.kickoffAt));
  const [prevKo, setPrevKo] = useState(match.kickoffAt.getTime());
  if (prevKo !== match.kickoffAt.getTime()) {
    setPrevKo(match.kickoffAt.getTime());
    setRemaining(computeCountdown(match.kickoffAt));
  }
  useEffect(() => {
    const id = setInterval(() => setRemaining(computeCountdown(match.kickoffAt)), 60_000);
    return () => clearInterval(id);
  }, [match.kickoffAt]);

  const homeName = stripWomenSuffix(getTeamDisplayName(match.homeTeam, locale));
  const awayName = stripWomenSuffix(getTeamDisplayName(match.awayTeam, locale));
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';
  const state = getMatchState(match.statusCode, match.kickoffAt);
  const isLive = state === 'live';
  const showScore = isLive && match.homeScore != null && match.awayScore != null;

  return (
    <Link
      href={`/${locale}/match/${match.id}`}
      className="relative block overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
    >
      <div className="absolute start-4 top-4 z-10">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-score-live/16 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-score-live">
            <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
            {labels.live}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-azure/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-azure">
            ★ {isLead ? labels.matchOfDay : labels.featured}
          </span>
        )}
      </div>
      {match.featureTag && (
        <div className="absolute end-4 top-4 z-10">
          <TagChip tag={match.featureTag} labels={labels} />
        </div>
      )}

      <div className="flex flex-col items-center px-4 pb-2 pt-14 text-center sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
          {compName}
          {match.contextLabel && (
            <span className="text-text-tertiary"> · {match.contextLabel}</span>
          )}
        </p>

        <div className="mt-4 flex w-full items-center justify-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[160px] sm:flex-none">
            <TeamCrest team={match.homeTeam} />
            <span className="w-full truncate text-sm font-bold text-text-primary">{homeName}</span>
          </div>

          <div className="flex shrink-0 flex-col items-center gap-2 px-2">
            {showScore ? (
              <>
                <span className="text-3xl font-black tabular-nums tracking-tight text-text-primary">
                  {match.homeScore} - {match.awayScore}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-score-live">
                  <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
                  {match.statusCode === 'HT' ? 'HT' : `${match.minute ?? ''}'`}
                </span>
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

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[160px] sm:flex-none">
            <TeamCrest team={match.awayTeam} />
            <span className="w-full truncate text-sm font-bold text-text-primary">{awayName}</span>
          </div>
        </div>

        {state === 'upcoming' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
              {labels.kicksOffIn}
            </span>
            <div className="flex items-center overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-2">
              <CountdownUnit value={remaining.days} label="DAYS" />
              <div className="h-12 w-px bg-border-subtle" />
              <CountdownUnit value={remaining.hours} label="HOURS" />
              <div className="h-12 w-px bg-border-subtle" />
              <CountdownUnit value={remaining.minutes} label="MINS" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 px-4 pb-4 pt-3 text-xs font-medium text-text-secondary sm:px-6">
        {match.venueName ? (
          <>
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {match.venueName}
              {match.venueCity ? `, ${match.venueCity}` : ''}
            </span>
          </>
        ) : (
          match.venueCapacity && (
            <>
              <Users className="size-3.5 shrink-0" />
              <span>{match.venueCapacity.toLocaleString()}</span>
            </>
          )
        )}
      </div>
    </Link>
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
