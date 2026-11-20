'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { stripWomenSuffix, getNationalFlagUrl } from '@/lib/team-display';
import { LocalTime } from '@/components/shared/LocalTime';
import { getMatchState } from '@/lib/match-status';
import { useMounted } from '@/hooks/useMounted';
import { useRenderNow } from '@/hooks/useRenderNow';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import type { HomeFixture } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';
import { matchHref } from '@/lib/seo/match-slug';

type FeatureTag = NonNullable<HomeFixture['featureTag']>;

// Purely statusCode-derived match state — no kickoff-vs-now comparison. Used for the first
// render (server shell + the client's first paint) so both agree regardless of the clock; the
// time-aware getMatchState takes over after mount. getMatchState is time-dependent ONLY in its
// "kickoff already passed" fallback for scheduled codes, so calling it with a far-future kickoff
// yields the code-only state (live/finished/interrupted by code, everything else upcoming).
// Without this, a PPR/ISR shell prerendered before a kickoff/live boundary hydrates against a
// client past that boundary → the hero slide structure flips → hydration mismatch (#418).
// `now` is passed explicitly: getMatchState's default `new Date()` would read the clock during the
// prerender, which pulls the whole home page out of the static HTML (see useRenderNow).
const FAR_FUTURE = new Date('2999-01-01T00:00:00Z');
const EPOCH = new Date(0);
function codeMatchState(statusCode: string) {
  return getMatchState(statusCode, FAR_FUTURE, EPOCH);
}

interface Props {
  matches: HomeFixture[];
  locale: Locale;
  /** Server time (epoch ms, from getCachedNow) for the countdown until mount; see useRenderNow. */
  now: number;
  labels: {
    matchOfDay: string;
    featured: string;
    kicksOffIn: string;
    countdownDays: string;
    countdownHours: string;
    countdownMins: string;
    tags: Record<FeatureTag, string>;
    /** Screen-reader heading (H2) for the hero block. */
    heading: string;
    /** Shown instead of the card when no upcoming match is scheduled. */
    empty: { title: string; cta: string };
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

function computeCountdown(kickoffAt: Date, nowMs: number) {
  const ms = Math.max(0, new Date(kickoffAt).getTime() - nowMs);
  const totalMin = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMin / 1440),
    hours: Math.floor((totalMin % 1440) / 60),
    minutes: totalMin % 60,
  };
}

/**
 * Landing hero: one rotating card across the top ranked UPCOMING matches (Morocco-first +
 * imminence-first + diversity cap from getFeaturedMatches). Live matches are not shown here: they
 * have their own card (HomeNextMatch, live only), the Live tab and the ticker. A slide that kicks
 * off, goes live or finishes drops out; when none is left the card becomes an empty state of the
 * same size, so nothing below it moves. Rotation pauses on hover/focus. The server's #1 keeps the
 * "Match of the day" badge; other slides read "Featured".
 */
export function HomeFeatured({ matches, locale, now, labels }: Props) {
  const mounted = useMounted();
  const livePatches = useLiveFixtures();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const patched = matches.map((m) => applyPatch(m, livePatches.get(m.id)));
  // Before mount use the code-only state so the server shell and the client's first render agree;
  // after mount the time-aware getMatchState drops a slide whose kickoff has passed. Deferring the
  // clock-dependent reshape avoids a #418 mismatch.
  const stateOf = (m: HomeFixture) =>
    mounted ? getMatchState(m.statusCode, m.kickoffAt) : codeMatchState(m.statusCode);
  const view = patched.filter((m) => stateOf(m) === 'upcoming').slice(0, 8);
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

  const match = view[safeIdx];

  if (!match) {
    return (
      <div>
        <h2 className="sr-only">{labels.heading}</h2>
        <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 rounded-xl border border-border-subtle bg-bg-surface px-6 text-center">
          <p className="text-base font-semibold text-text-primary">{labels.empty.title}</p>
          <a
            href="#matches"
            className="text-sm font-medium text-accent-azure underline-offset-2 hover:underline"
          >
            {labels.empty.cta}
          </a>
        </div>
        {/* Same height as the pager row below the card, so the block never changes size. */}
        <div className="mt-2 h-2" aria-hidden />
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <h2 className="sr-only">{labels.heading}</h2>
      <div className="relative">
        <HeroCard
          match={match}
          locale={locale}
          labels={labels}
          now={now}
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

      {/* The pager row keeps its height with a single slide, so a slide dropping out after mount
          (kickoff passed) can't shift what's below. */}
      {view.length <= 1 ? (
        <div className="mt-2 h-2" aria-hidden />
      ) : (
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
  // National team → flag; club with a real logo → its logo; otherwise null → initials fallback
  // below. (No teamCrestUrl(id) fallback: it 200s with the grey placeholder for logo-less teams.)
  const url = team ? (getNationalFlagUrl(team) ?? team.logoUrl ?? null) : null;
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
  now,
  isLead,
}: {
  match: HomeFixture;
  locale: Locale;
  labels: Props['labels'];
  now: number;
  isLead: boolean;
}) {
  // Server time until hydration (keeps the card in the prerendered HTML; see useRenderNow), then
  // the viewer's clock, which ticks every 30 s.
  const remaining = computeCountdown(match.kickoffAt, useRenderNow(now));

  const homeName = stripWomenSuffix(getTeamDisplayName(match.homeTeam, locale));
  const awayName = stripWomenSuffix(getTeamDisplayName(match.awayTeam, locale));
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';

  return (
    <Link
      href={matchHref(locale, {
        id: match.id,
        homeSlug: match.homeTeam?.slug,
        awaySlug: match.awayTeam?.slug,
      })}
      className="relative flex min-h-[380px] flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface [[data-theme=light]_&]:shadow-[0_1px_2px_rgb(15_26_36/0.06),0_4px_14px_rgb(15_26_36/0.04)]"
    >
      {/* Left badge — always the featured / match-of-day marker */}
      <div className="absolute start-4 top-4 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-accent-azure/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-azure">
          ★ {isLead ? labels.matchOfDay : labels.featured}
        </span>
      </div>
      {/* Right badge — the why-featured tag. Live state is shown under the score (I/J), not as a pill. */}
      <div className="absolute end-4 top-4 z-10">
        {match.featureTag && <TagChip tag={match.featureTag} labels={labels} />}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-2 pt-12 text-center sm:px-8">
        <p className="text-sm font-medium text-text-secondary">
          {compName}
          {match.contextLabel && (
            <span className="text-text-tertiary"> · {match.contextLabel}</span>
          )}
        </p>

        {/* Match row — the centre column has a fixed width and min-height so the crests never shift
            as the time text changes. */}
        <div className="mt-6 flex w-full items-center justify-center gap-3">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[160px] sm:flex-none">
            <TeamCrest team={match.homeTeam} />
            <span className="w-full truncate text-sm font-bold text-text-primary">{homeName}</span>
          </div>

          <div className="flex min-h-[68px] w-[128px] shrink-0 flex-col items-center justify-center gap-1.5">
            <span className="text-3xl font-black tracking-tight text-accent-azure">VS</span>
            <p
              className="text-xs font-medium tracking-wide text-text-tertiary"
              suppressHydrationWarning
            >
              <LocalTime date={match.kickoffAt} locale={locale} format="featured" />
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:w-[160px] sm:flex-none">
            <TeamCrest team={match.awayTeam} />
            <span className="w-full truncate text-sm font-bold text-text-primary">{awayName}</span>
          </div>
        </div>

        {/* Countdown band — constant min-height so the card height never changes. */}
        <div className="mt-4 flex min-h-[104px] w-full items-start justify-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary">
              {labels.kicksOffIn}
            </span>
            <div className="flex items-center overflow-hidden rounded-lg border border-border-subtle bg-bg-surface-2">
              <CountdownUnit value={remaining.days} label={labels.countdownDays} />
              <div className="h-12 w-px bg-border-subtle" />
              <CountdownUnit value={remaining.hours} label={labels.countdownHours} />
              <div className="h-12 w-px bg-border-subtle" />
              <CountdownUnit value={remaining.minutes} label={labels.countdownMins} />
            </div>
          </div>
        </div>
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
