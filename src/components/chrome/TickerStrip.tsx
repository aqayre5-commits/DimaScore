'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Pause, Play } from 'lucide-react';
import { codeToFlag } from '@/lib/flags';
import { isLiveStatus } from '@/lib/data/types';
import type { TickerFixture } from '@/lib/db/queries';
import { getCompactTeamLabel } from '@/lib/utils/team-name';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload } from '@/lib/realtime/channels';
import type { Locale } from '@/lib/i18n/config';
import type { FixtureStatus } from '@/lib/data/types';

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

function formatKickoffTime(date: Date, locale: Locale): string {
  const lang = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
  return new Intl.DateTimeFormat(lang, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(date));
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
    <img src={team.logoUrl} alt="" className="size-4 object-contain" />
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
    <Link
      href={`/${locale}/match/${fixture.id}`}
      dir={dir}
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
        <span className="rounded px-2 py-0.5 text-sm tabular-nums text-text-secondary">
          {formatKickoffTime(fixture.kickoffAt, locale)}
        </span>
      )}

      {/* Away team — mirrored: code then logo */}
      <TeamCell team={fixture.awayTeam} locale={locale} reverse />
    </Link>
  );
}

/** Renders one copy of the ticker cells (used twice for seamless loop). */
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

  // Pusher diffs stored as patches + removals. Props (fixtures) stay source of truth.
  // Clear stale patches during render when props change (React docs: "adjusting state
  // during rendering" — no useEffect, no cascading re-renders).
  const fixtureIds = fixtures.map((f) => f.id).join(',');
  const [prevFixtureIds, setPrevFixtureIds] = useState(fixtureIds);
  const [patches, setPatches] = useState(() => new Map<number, ScorePatch>());
  const [removed, setRemoved] = useState(() => new Set<number>());
  if (prevFixtureIds !== fixtureIds) {
    setPrevFixtureIds(fixtureIds);
    setPatches(new Map());
    setRemoved(new Set());
  }

  const handleScoreUpdate = useCallback((payload: ScoreUpdatePayload) => {
    if (TERMINAL_STATUSES.has(payload.statusCode)) {
      setRemoved((prev) => {
        const next = new Set(prev);
        next.add(payload.fixtureId);
        return next;
      });
      return;
    }
    setPatches((prev) => {
      const next = new Map(prev);
      next.set(payload.fixtureId, {
        homeScore: payload.homeScore,
        awayScore: payload.awayScore,
        statusCode: payload.statusCode,
        minute: payload.minute,
      });
      return next;
    });
  }, []);

  useEffect(() => {
    const client = getPusherClient();
    const channel = client.subscribe(CHANNELS.LIVE_SCORES);
    channel.bind(EVENTS.SCORE_UPDATE, handleScoreUpdate);
    return () => {
      channel.unbind(EVENTS.SCORE_UPDATE, handleScoreUpdate);
      client.unsubscribe(CHANNELS.LIVE_SCORES);
    };
  }, [handleScoreUpdate]);

  const [paused, setPaused] = useState(false);

  const merged = useMemo(
    () => applyPatches(fixtures, patches, removed),
    [fixtures, patches, removed],
  );
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
        {/* Duplicate copy — seamless continuation */}
        <span className="ticker-duplicate flex shrink-0 items-center" aria-hidden="true">
          <TickerCells fixtures={renderable} locale={locale} />
        </span>
      </div>

      {/* WCAG 2.2.2 — pause/play toggle for auto-scrolling content */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? t('playTicker') : t('pauseTicker')}
        className="absolute end-0 top-0 z-10 flex h-full w-8 items-center justify-center bg-bg-canvas/80 backdrop-blur-sm transition-colors hover:bg-bg-canvas"
      >
        <PausePlayIcon className="size-3.5 text-text-secondary" />
      </button>
    </div>
  );
}
