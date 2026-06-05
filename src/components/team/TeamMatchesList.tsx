'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import { getMatchState, isLive as isLiveStatus } from '@/lib/match-status';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
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
    const header = formatMatchDate(f.kickoffAt, locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toUpperCase();
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
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps">{t('matches')}</h3>
      </div>

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

  let subLabel = '';
  if (isLive) subLabel = isLiveStatus(f.statusCode) ? f.statusCode : 'LIVE';
  else if (isDone) {
    if (f.statusCode === 'PEN') {
      subLabel =
        f.homeScorePen != null && f.awayScorePen != null
          ? `PEN ${f.homeScorePen}-${f.awayScorePen}`
          : 'PEN';
    } else if (f.statusCode === 'AET') {
      subLabel = 'AET';
    } else {
      subLabel = 'FT';
    }
  }

  return (
    <a
      href={`/${locale}/match/${f.id}`}
      className="flex items-center gap-2 px-3 py-3 transition-colors hover:bg-bg-surface-2"
    >
      {/* kickoff time */}
      <div className="w-11 shrink-0 text-center text-xs tabular-nums text-text-tertiary">
        {formatMatchTime(f.kickoffAt, locale)}
      </div>

      {/* home */}
      <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
        {f.homeTeam?.logoUrl && (
          <Image
            src={f.homeTeam.logoUrl}
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0 object-contain"
          />
        )}
        <span className="truncate text-sm text-text-primary">{teamName(f.homeTeam, locale)}</span>
      </div>

      {/* centre — vs / score, with state sub-label (FT / AET / PEN x-y) */}
      <div className="flex w-16 shrink-0 flex-col items-center justify-center leading-tight">
        {showScore ? (
          <span
            className={`text-sm font-bold tabular-nums ${isLive ? 'text-accent-crimson' : 'text-text-primary'}`}
          >
            {f.homeScore} - {f.awayScore}
          </span>
        ) : (
          <span className="text-xs font-medium text-text-tertiary">vs</span>
        )}
        {subLabel && (
          <span className="whitespace-nowrap text-[10px] uppercase tracking-wide text-text-quaternary">
            {subLabel}
          </span>
        )}
      </div>

      {/* away */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <span className="truncate text-end text-sm text-text-primary">
          {teamName(f.awayTeam, locale)}
        </span>
        {f.awayTeam?.logoUrl && (
          <Image
            src={f.awayTeam.logoUrl}
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0 object-contain"
          />
        )}
      </div>
    </a>
  );
}
