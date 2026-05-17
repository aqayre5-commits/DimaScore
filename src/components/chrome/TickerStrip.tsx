'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { codeToFlag } from '@/lib/flags';
import { isLiveStatus } from '@/lib/data/types';
import type { TickerFixture } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import type { FixtureStatus } from '@/lib/data/types';

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

function teamLabel(team: TickerFixture['homeTeam']): string {
  if (!team) return '—';
  return (
    team.code ??
    (team.shortName?.en ? team.shortName.en.slice(0, 4) : null) ??
    (team.name?.en ? team.name.en.replace(/\s+/g, '').slice(0, 4).toUpperCase() : null) ??
    '???'
  );
}

function TeamCell({ team }: { team: TickerFixture['homeTeam'] }) {
  if (!team) return <span className="text-sm text-text-tertiary">&mdash;</span>;

  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;
  const code = teamLabel(team);

  return (
    <span className="flex items-center gap-1.5">
      {flag ? (
        <span className="text-base leading-none">{flag}</span>
      ) : team.logoUrl ? (
        <img src={team.logoUrl} alt="" className="size-4 object-contain" />
      ) : null}
      <span className="text-sm font-medium text-text-primary">{code}</span>
    </span>
  );
}

function TickerItemContent({ fixture, locale }: { fixture: TickerFixture; locale: Locale }) {
  const live = isLiveStatus(fixture.statusCode as FixtureStatus);
  const compName =
    fixture.competition.name[locale] ?? fixture.competition.name['en'] ?? fixture.competition.slug;
  const matchSlug = `${fixture.id}`;

  return (
    <Link
      href={`/${locale}/match/${matchSlug}`}
      className="flex shrink-0 items-center gap-2 px-4 py-1 transition-colors hover:bg-white/5"
    >
      {/* Competition shield */}
      {fixture.competition.logoUrl ? (
        <img
          src={fixture.competition.logoUrl}
          alt={compName}
          loading="lazy"
          className="size-5 shrink-0 object-contain"
        />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-[8px] font-bold uppercase leading-none text-text-tertiary">
          {compName.slice(0, 3)}
        </span>
      )}

      {/* Home team */}
      <TeamCell team={fixture.homeTeam} />

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

      {/* Away team */}
      <TeamCell team={fixture.awayTeam} />
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

function isRenderable(f: TickerFixture): boolean {
  if (!f.homeTeam || !f.awayTeam) return false;
  const hasHome = f.homeTeam.name?.en || f.homeTeam.shortName?.en || f.homeTeam.code;
  const hasAway = f.awayTeam.name?.en || f.awayTeam.shortName?.en || f.awayTeam.code;
  return !!(hasHome && hasAway);
}

export function TickerStrip({ fixtures, locale }: TickerStripProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('topStrip');
  const renderable = fixtures.filter(isRenderable);

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

  return (
    <div
      role="marquee"
      aria-label={t('tickerLabel')}
      className="ticker relative h-full overflow-hidden"
    >
      <div ref={trackRef} className="ticker-track flex h-full w-max items-center">
        {/* Original copy — measured for duration calc */}
        <span ref={copyRef} className="flex shrink-0 items-center">
          <TickerCells fixtures={renderable} locale={locale} />
        </span>
        {/* Duplicate copy — seamless continuation */}
        <span className="ticker-duplicate flex shrink-0 items-center" aria-hidden="true">
          <TickerCells fixtures={renderable} locale={locale} />
        </span>
      </div>
    </div>
  );
}
