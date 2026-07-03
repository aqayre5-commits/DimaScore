'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { getMatchState, isLive as isLiveStatus } from '@/lib/match-status';
import { formatMatchDate, SITE_TZ } from '@/lib/utils/date';
import { LocalTime } from '@/components/shared/LocalTime';
import type { FixtureWithCompetition } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamMatchesListProps {
  fixtures: FixtureWithCompetition[];
  locale: Locale;
  teamId: number;
}

type State = 'upcoming' | 'live' | 'finished';
const INITIAL_VISIBLE = 5;

function teamName(team: FixtureWithCompetition['homeTeam'], locale: Locale): string {
  if (!team) return '—';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '—'
  );
}

export function TeamMatchesList({ fixtures, locale }: TeamMatchesListProps) {
  const t = useTranslations('teamPage');

  const buckets: Record<State, FixtureWithCompetition[]> = { upcoming: [], live: [], finished: [] };
  for (const f of fixtures) buckets[getMatchState(f.statusCode, f.kickoffAt)].push(f);
  buckets.upcoming.sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());
  buckets.finished.sort((a, b) => b.kickoffAt.getTime() - a.kickoffAt.getTime());

  const states = (['upcoming', 'live', 'finished'] as State[]).filter((s) => buckets[s].length > 0);

  const [activeState, setActiveState] = useState<State>(
    buckets.live.length ? 'live' : buckets.upcoming.length ? 'upcoming' : 'finished',
  );
  const [expanded, setExpanded] = useState(false);

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noMatchesData')}</p>
      </div>
    );
  }

  const active = states.includes(activeState) ? activeState : states[0];
  const all = buckets[active];
  const visible = expanded ? all : all.slice(0, INITIAL_VISIBLE);

  // Group the visible fixtures by display date (one header per calendar day).
  const groups: { header: string; matches: FixtureWithCompetition[] }[] = [];
  for (const f of visible) {
    // Day-group headers are pinned to the site timezone — deterministic across
    // SSR/hydration and consistent with the server-side day bucketing.
    const header = formatMatchDate(
      f.kickoffAt,
      locale,
      { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' },
      SITE_TZ,
    ).toUpperCase();
    const last = groups[groups.length - 1];
    if (last && last.header === header) last.matches.push(f);
    else groups.push({ header, matches: [f] });
  }

  const stateLabel: Record<State, string> = {
    upcoming: t('upcoming'),
    live: t('live'),
    finished: t('completed'),
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* upcoming / live / finished toggle */}
      <div className="flex border-b border-border-subtle">
        {states.map((s) => (
          <button
            key={s}
            onClick={() => {
              setActiveState(s);
              setExpanded(false);
            }}
            className={`flex-1 px-3 py-2 text-center text-xs font-medium transition-colors ${
              active === s
                ? 'border-b-2 border-accent-azure text-accent-azure'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {s === 'live' && (
              <span className="live-pulse mr-1 inline-block size-1.5 rounded-full bg-accent-crimson align-middle" />
            )}
            {stateLabel[s]} <span className="text-text-quaternary">({buckets[s].length})</span>
          </button>
        ))}
      </div>

      <div>
        {groups.map((g) => (
          <div key={g.header}>
            <div className="bg-bg-surface-2 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
              {g.header}
            </div>
            <div className="divide-y divide-border-subtle/60">
              {g.matches.map((f) => (
                <FixtureRow key={f.id} fixture={f} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {all.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-border-subtle py-3 text-[13px] font-semibold text-accent-azure transition-colors hover:bg-accent-azure/5"
        >
          {expanded ? t('showLess') : t('viewFullFixtureList')}
          <ChevronDown className={`size-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

function FixtureRow({ fixture: f, locale }: { fixture: FixtureWithCompetition; locale: Locale }) {
  const state = getMatchState(f.statusCode, f.kickoffAt);
  const isLive = state === 'live';
  const isDone = state === 'finished';
  const showScore = (isLive || isDone) && f.homeScore != null && f.awayScore != null;
  const showPens = f.statusCode === 'PEN' && f.homeScorePen != null && f.awayScorePen != null;
  const homeWon = isDone && showScore && (f.homeScore ?? 0) > (f.awayScore ?? 0);
  const awayWon = isDone && showScore && (f.awayScore ?? 0) > (f.homeScore ?? 0);

  const compName = f.competition
    ? (f.competition.name[locale] ?? f.competition.name['en'] ?? '')
    : '';

  return (
    <a href={`/${locale}/match/${f.id}`} className="block transition-colors hover:bg-bg-surface-2">
      {/* ── Single layout (all breakpoints): competition header (multi-comp) + teams · divider · meta ── */}
      <div className="px-3">
        {compName && (
          <div className="flex items-center gap-1.5 pt-2 text-xs text-text-tertiary">
            {f.competition?.logoUrl && (
              <Image
                src={f.competition.logoUrl}
                alt=""
                width={16}
                height={16}
                className="size-4 shrink-0 object-contain"
              />
            )}
            <span className="truncate">{compName}</span>
          </div>
        )}

        <div className="flex items-stretch gap-3 py-2.5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2.5">
              {f.homeTeam?.logoUrl ? (
                <Image
                  src={f.homeTeam.logoUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 shrink-0 object-contain"
                />
              ) : (
                <span className="inline-block size-6 shrink-0 rounded bg-bg-surface-2" />
              )}
              <span
                className={`min-w-0 flex-1 truncate text-base ${awayWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
              >
                {teamName(f.homeTeam, locale)}
              </span>
              {showScore && (
                <span
                  className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : awayWon ? 'text-text-tertiary' : 'text-text-primary'}`}
                >
                  {f.homeScore}
                  {showPens && (
                    <span className="text-xs font-semibold text-text-tertiary">
                      {' '}
                      ({f.homeScorePen})
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {f.awayTeam?.logoUrl ? (
                <Image
                  src={f.awayTeam.logoUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="size-6 shrink-0 object-contain"
                />
              ) : (
                <span className="inline-block size-6 shrink-0 rounded bg-bg-surface-2" />
              )}
              <span
                className={`min-w-0 flex-1 truncate text-base ${homeWon ? 'text-text-tertiary' : 'font-medium text-text-primary'}`}
              >
                {teamName(f.awayTeam, locale)}
              </span>
              {showScore && (
                <span
                  className={`text-base font-bold tabular-nums ${isLive ? 'text-score-live' : homeWon ? 'text-text-tertiary' : 'text-text-primary'}`}
                >
                  {f.awayScore}
                  {showPens && (
                    <span className="text-xs font-semibold text-text-tertiary">
                      {' '}
                      ({f.awayScorePen})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="w-px shrink-0 self-stretch bg-border-subtle" />

          <div className="flex w-12 shrink-0 flex-col items-center justify-center text-center leading-tight">
            {isLive ? (
              <span className="text-sm font-bold tabular-nums text-score-live">
                {isLiveStatus(f.statusCode) ? f.statusCode : 'LIVE'}
              </span>
            ) : isDone ? (
              <span className="text-xs font-medium text-text-tertiary">
                {f.statusCode === 'AET' ? 'AET' : 'FT'}
              </span>
            ) : (
              <span className="text-sm tabular-nums text-text-secondary" suppressHydrationWarning>
                <LocalTime date={f.kickoffAt} locale={locale} format="time" />
              </span>
            )}
            {isDone && showPens && (
              <span className="mt-0.5 text-[9px] font-semibold uppercase text-text-tertiary">
                PEN
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
