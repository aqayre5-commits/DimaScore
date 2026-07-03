'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromTickerFixture } from '@/lib/match-header-preview';
import { TeamLogo } from '@/components/shared/Logo';
import { Pause, Play } from 'lucide-react';
import { codeToFlag } from '@/lib/flags';
import { isLiveStatus } from '@/lib/data/types';
import type { TickerFixture } from '@/lib/db/queries';
import { getCompactTeamLabel } from '@/lib/utils/team-name';
import { LocalTime } from '@/components/shared/LocalTime';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import { useQueryClient } from '@tanstack/react-query';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import type { Locale } from '@/lib/i18n/config';
import type { FixtureStatus } from '@/lib/data/types';

// Terminal for the ticker = FINISHED_CODES_ARRAY plus PST. Postponed fixtures never go
// live so the ticker can treat them as final-state for filtering. Kept local because the
// canonical FINISHED_CODES_ARRAY excludes PST (its semantics are "scored result" elsewhere).
const TERMINAL_STATUSES = new Set(['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO']);

type ScorePatch = {
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
};

function applyPatches(
  fixtures: TickerFixture[],
  patches: Map<number, ScorePatch>,
  removed: Set<number>,
): TickerFixture[] {
  return fixtures
    .filter((f) => !removed.has(f.id))
    .map((f) => {
      const patch = patches.get(f.id);
      return patch ? { ...f, ...patch } : f;
    });
}

interface TickerStripProps {
  fixtures: TickerFixture[];
  locale: Locale;
}

function TeamCell({
  team,
  locale,
  reverse,
}: {
  team: TickerFixture['homeTeam'];
  locale: Locale;
  reverse?: boolean;
}) {
  if (!team) return <span className="text-sm text-text-tertiary">&mdash;</span>;

  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;
  const code = getCompactTeamLabel(team, locale);

  const logo = flag ? (
    <span className="text-base leading-none">{flag}</span>
  ) : team.logoUrl ? (
    <TeamLogo src={team.logoUrl} size={16} className="size-4 object-contain" />
  ) : null;

  const name = <span className="text-sm font-medium text-text-primary">{code}</span>;

  return (
    <span className="flex items-center gap-1.5">
      {reverse ? (
        <>
          {name}
          {logo}
        </>
      ) : (
        <>
          {logo}
          {name}
        </>
      )}
    </span>
  );
}

function TickerItemContent({ fixture, locale }: { fixture: TickerFixture; locale: Locale }) {
  const live = isLiveStatus(fixture.statusCode as FixtureStatus);
  const dir = locale === 'ar' ? 'rtl' : undefined;

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={previewFromTickerFixture(fixture)}
      prefetchIntent
      dir={dir}
      ariaLabel={`${getCompactTeamLabel(fixture.homeTeam, locale)} vs ${getCompactTeamLabel(fixture.awayTeam, locale)}`}
      className="flex shrink-0 items-center gap-2 px-4 py-1 transition-colors hover:bg-white/5"
    >
      {/* Home team */}
      <TeamCell team={fixture.homeTeam} locale={locale} />

      {/* Score (live) or kickoff time (upcoming) */}
      {live ? (
        <span className="flex items-center gap-1.5 rounded px-2 py-0.5">
          <span className="live-pulse size-1.5 rounded-full bg-red-500" />
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {fixture.homeScore ?? 0}&ndash;{fixture.awayScore ?? 0}
          </span>
          {fixture.minute != null && (
            <span className="text-xs tabular-nums text-text-secondary">{fixture.minute}&apos;</span>
          )}
        </span>
      ) : (
        <span
          className="rounded px-2 py-0.5 text-sm tabular-nums text-text-secondary"
          suppressHydrationWarning
        >
          <LocalTime date={fixture.kickoffAt} locale={locale} format="time" />
        </span>
      )}

      {/* Away team — mirrored: code then logo */}
      <TeamCell team={fixture.awayTeam} locale={locale} reverse />
    </MatchLink>
  );
}

/** Renders one copy of the ticker cells — interactive version with Links. */
function TickerCells({ fixtures, locale }: TickerStripProps) {
  return (
    <>
      {fixtures.map((fixture, i) => (
        <span key={fixture.id} className="flex shrink-0 items-center">
          {i > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-border-strong" />}
          <TickerItemContent fixture={fixture} locale={locale} />
        </span>
      ))}
    </>
  );
}

/** Inert duplicate for seamless marquee — no Links, no hydration overhead. */
function TickerCellsInert({ fixtures, locale }: TickerStripProps) {
  return (
    <>
      {fixtures.map((fixture, i) => {
        const live = isLiveStatus(fixture.statusCode as FixtureStatus);
        const dir = locale === 'ar' ? 'rtl' : undefined;
        return (
          <span key={fixture.id} className="flex shrink-0 items-center">
            {i > 0 && <span className="mx-1 h-4 w-px shrink-0 bg-border-strong" />}
            <span dir={dir} className="flex shrink-0 items-center gap-2 px-4 py-1">
              <TeamCell team={fixture.homeTeam} locale={locale} />
              {live ? (
                <span className="flex items-center gap-1.5 rounded px-2 py-0.5">
                  <span className="live-pulse size-1.5 rounded-full bg-red-500" />
                  <span className="text-sm font-semibold tabular-nums text-text-primary">
                    {fixture.homeScore ?? 0}&ndash;{fixture.awayScore ?? 0}
                  </span>
                  {fixture.minute != null && (
                    <span className="text-xs tabular-nums text-text-secondary">
                      {fixture.minute}&apos;
                    </span>
                  )}
                </span>
              ) : (
                <span
                  className="rounded px-2 py-0.5 text-sm tabular-nums text-text-secondary"
                  suppressHydrationWarning
                >
                  <LocalTime date={fixture.kickoffAt} locale={locale} format="time" />
                </span>
              )}
              <TeamCell team={fixture.awayTeam} locale={locale} reverse />
            </span>
          </span>
        );
      })}
    </>
  );
}

function isRenderable(f: TickerFixture, locale: string): boolean {
  if (!f.homeTeam || !f.awayTeam) return false;
  const hasName = (t: NonNullable<TickerFixture['homeTeam']>) =>
    t.code || t.shortName?.[locale] || t.shortName?.en || t.name?.[locale] || t.name?.en;
  return !!(hasName(f.homeTeam) && hasName(f.awayTeam));
}

export function TickerStrip({ fixtures, locale }: TickerStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('topStrip');

  const queryClient = useQueryClient();

  // Pusher = instant nudge: on any score event just refetch the live poll (the single
  // source of truth) rather than keeping a second patch state. Degrades gracefully if
  // Pusher isn't configured — the 30s poll still drives updates.
  const handleScoreUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['live-fixtures'] });
  }, [queryClient]);

  useEffect(() => {
    let client: ReturnType<typeof getPusherClient>;
    try {
      client = getPusherClient();
    } catch {
      return;
    }
    const channel = client.subscribe(CHANNELS.LIVE_SCORES);
    channel.bind(EVENTS.SCORE_UPDATE, handleScoreUpdate);
    return () => {
      channel.unbind(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      client.unsubscribe(CHANNELS.LIVE_SCORES);
    };
  }, [handleScoreUpdate]);

  const [paused, setPaused] = useState(false);

  // The 30s live poll is the source of truth — rebuild patches/removals from it.
  const livePatches = useLiveFixtures();
  const merged = useMemo(() => {
    const patches = new Map<number, ScorePatch>();
    const removed = new Set<number>();
    for (const [id, p] of livePatches) {
      if (TERMINAL_STATUSES.has(p.statusCode)) {
        removed.add(id);
      } else {
        patches.set(id, {
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          statusCode: p.statusCode,
          minute: p.minute,
        });
      }
    }
    return applyPatches(fixtures, patches, removed);
  }, [fixtures, livePatches]);
  const renderable = merged.filter((f) => isRenderable(f, locale));

  // Duration = original copy width / speed (60 px/s).
  // translateX(-50%) scrolls exactly one copy width, then resets seamlessly.
  useEffect(() => {
    const copy = copyRef.current;
    const track = trackRef.current;
    if (!copy || !track) return;
    const copyWidth = copy.offsetWidth;
    const duration = Math.max(10, copyWidth / 60);
    track.style.setProperty('--ticker-duration', `${duration}s`);
  }, [renderable.length]);

  if (renderable.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-sm text-text-secondary">{t('emptyState')}</span>
      </div>
    );
  }

  const PausePlayIcon = paused ? Play : Pause;

  return (
    <div
      role="marquee"
      aria-label={t('tickerLabel')}
      className="ticker relative h-full overflow-hidden"
    >
      <div
        ref={trackRef}
        className="ticker-track flex h-full w-max items-center"
        style={paused ? { animationPlayState: 'paused' } : undefined}
      >
        {/* Original copy — measured for duration calc */}
        <span ref={copyRef} className="flex shrink-0 items-center">
          <TickerCells fixtures={renderable} locale={locale} />
        </span>
        {/* Duplicate copy — inert, no Links, aria-hidden */}
        <span className="ticker-duplicate flex shrink-0 items-center" aria-hidden="true">
          <TickerCellsInert fixtures={renderable} locale={locale} />
        </span>
      </div>

      {/* WCAG 2.2.2 — pause/play toggle for auto-scrolling content */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? t('playTicker') : t('pauseTicker')}
        className="absolute end-0 top-0 z-10 flex h-full w-11 items-center justify-center bg-bg-canvas/80 backdrop-blur-sm transition-colors hover:bg-bg-canvas"
      >
        <PausePlayIcon className="size-3.5 text-text-secondary" />
      </button>
    </div>
  );
}
