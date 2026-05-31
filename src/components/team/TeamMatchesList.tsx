'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { getMatchState, isLive as isLiveStatus } from '@/lib/match-status';
import { formatShortDate, formatMatchTime } from '@/lib/utils/date';
import type { FixtureWithCompetition } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface TeamMatchesListProps {
  fixtures: FixtureWithCompetition[];
  locale: Locale;
  teamId: number;
}

function resolveTeamName(
  team: {
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
  } | null,
  locale: Locale,
): string {
  if (!team) return '\u2014';
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.name[locale] ??
    team.name['en'] ??
    team.code ??
    '\u2014'
  );
}

type Tab = 'upcoming' | 'results';

function getResult(f: FixtureWithCompetition, teamId: number): 'W' | 'D' | 'L' | null {
  if (f.homeScore == null || f.awayScore == null) return null;
  const isHome = f.homeTeam?.id === teamId;
  const teamGoals = isHome ? f.homeScore : f.awayScore;
  const oppGoals = isHome ? f.awayScore : f.homeScore;
  if (teamGoals > oppGoals) return 'W';
  if (teamGoals < oppGoals) return 'L';
  return 'D';
}

const RESULT_STYLES: Record<string, string> = {
  W: 'bg-emerald-500/15 text-emerald-600',
  D: 'bg-amber-500/15 text-amber-600',
  L: 'bg-red-500/15 text-red-600',
};

export function TeamMatchesList({ fixtures, locale, teamId }: TeamMatchesListProps) {
  const t = useTranslations('teamPage');
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noMatchesData')}</p>
      </div>
    );
  }

  const live: FixtureWithCompetition[] = [];
  const upcoming: FixtureWithCompetition[] = [];
  const completed: FixtureWithCompetition[] = [];

  for (const f of fixtures) {
    const state = getMatchState(f.statusCode, f.kickoffAt);
    if (state === 'live') live.push(f);
    else if (state === 'upcoming') upcoming.push(f);
    else completed.push(f);
  }

  // Completed: most recent first
  completed.reverse();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'upcoming', label: t('upcoming'), count: upcoming.length + live.length },
    { key: 'results', label: t('completed'), count: completed.length },
  ];

  const visibleFixtures = activeTab === 'upcoming' ? [...live, ...upcoming] : completed;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps">{t('matches')}</h3>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 text-center text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-b-2 border-accent-azure text-accent-azure'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label} <span className="text-text-quaternary">({tab.count})</span>
          </button>
        ))}
      </div>

      <div className="divide-y divide-border-subtle/40">
        {live.length > 0 && activeTab === 'upcoming' && (
          <MatchSection label={t('live')} fixtures={live} locale={locale} isLive teamId={teamId} />
        )}
        {visibleFixtures.length > 0 ? (
          activeTab === 'upcoming' ? (
            upcoming.length > 0 && (
              <MatchSection label="" fixtures={upcoming} locale={locale} teamId={teamId} />
            )
          ) : (
            <MatchSection label="" fixtures={completed} locale={locale} teamId={teamId} />
          )
        ) : (
          <div className="px-4 py-8 text-center text-sm text-text-tertiary">
            {t('noMatchesData')}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchSection({
  label,
  fixtures,
  locale,
  isLive = false,
  teamId,
}: {
  label: string;
  fixtures: FixtureWithCompetition[];
  locale: Locale;
  isLive?: boolean;
  teamId: number;
}) {
  const groups: {
    comp: FixtureWithCompetition['competition'];
    matches: FixtureWithCompetition[];
  }[] = [];
  let lastCompId: number | null = null;

  for (const f of fixtures) {
    const compId = f.competition?.id ?? null;
    if (compId !== lastCompId) {
      groups.push({ comp: f.competition, matches: [f] });
      lastCompId = compId;
    } else {
      groups[groups.length - 1].matches.push(f);
    }
  }

  return (
    <div className="px-3 py-2">
      {label && (
        <div className="flex items-center gap-1.5 py-2">
          {isLive && (
            <span className="inline-block size-1.5 rounded-full bg-accent-crimson live-pulse" />
          )}
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green">
            {label}
          </span>
          <span className="text-[10px] text-text-tertiary">({fixtures.length})</span>
        </div>
      )}
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.comp && <CompDivider comp={group.comp} locale={locale} />}
          {group.matches.map((f) => (
            <MatchRow key={f.id} fixture={f} locale={locale} teamId={teamId} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CompDivider({
  comp,
  locale,
}: {
  comp: NonNullable<FixtureWithCompetition['competition']>;
  locale: Locale;
}) {
  const name = comp.name[locale] ?? comp.name['en'] ?? '\u2014';
  return (
    <div className="flex items-center gap-1.5 py-1.5 text-[10px] text-text-tertiary">
      {comp.logoUrl && (
        <Image
          src={comp.logoUrl}
          alt=""
          width={14}
          height={14}
          className="size-3.5 object-contain opacity-70"
        />
      )}
      <span className="truncate font-medium">{name}</span>
    </div>
  );
}

function MatchRow({
  fixture: f,
  locale,
  teamId,
}: {
  fixture: FixtureWithCompetition;
  locale: Locale;
  teamId: number;
}) {
  const t = useTranslations('teamPage');
  const state = getMatchState(f.statusCode, f.kickoffAt);
  const isLive = state === 'live';
  const isDone = state === 'finished';
  const hasScore = f.homeScore != null && f.awayScore != null;
  const showScore = (isDone || isLive) && hasScore;
  const hGoals = f.homeScore;
  const aGoals = f.awayScore;
  const hWin = hasScore && hGoals! > aGoals!;
  const aWin = hasScore && aGoals! > hGoals!;
  const result = isDone ? getResult(f, teamId) : null;

  return (
    <a
      href={`/${locale}/match/${f.id}`}
      className="flex items-center gap-0 rounded-lg py-1.5 text-xs transition-colors hover:bg-bg-surface-2"
    >
      {/* Date */}
      <div className="w-10 shrink-0 text-center text-[10px] leading-tight text-text-tertiary tabular-nums">
        {formatShortDate(f.kickoffAt.toISOString(), locale)}
      </div>

      {/* Teams */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {f.homeTeam?.logoUrl && (
            <Image
              src={f.homeTeam.logoUrl}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0 object-contain"
            />
          )}
          <span
            className={`flex-1 truncate text-[12px] ${hWin && isDone ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
          >
            {resolveTeamName(f.homeTeam, locale)}
          </span>
          {showScore && (
            <span
              className={`w-5 text-end text-[12px] font-bold tabular-nums ${hWin ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              {hGoals}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {f.awayTeam?.logoUrl && (
            <Image
              src={f.awayTeam.logoUrl}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0 object-contain"
            />
          )}
          <span
            className={`flex-1 truncate text-[12px] ${aWin && isDone ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
          >
            {resolveTeamName(f.awayTeam, locale)}
          </span>
          {showScore && (
            <span
              className={`w-5 text-end text-[12px] font-bold tabular-nums ${aWin ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              {aGoals}
            </span>
          )}
        </div>
      </div>

      {/* Status / Result badge */}
      <div className="w-10 shrink-0 text-center text-[10px] font-semibold">
        {isLive ? (
          <span className="text-accent-crimson">
            {isLiveStatus(f.statusCode) ? f.statusCode : 'LIVE'}
          </span>
        ) : result ? (
          <span
            className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold ${RESULT_STYLES[result]}`}
          >
            {t(`form${result === 'W' ? 'Win' : result === 'D' ? 'Draw' : 'Loss'}`)}
          </span>
        ) : isDone ? (
          <span className="text-text-tertiary">FT</span>
        ) : (
          <span className="text-text-secondary tabular-nums">
            {formatMatchTime(f.kickoffAt, locale)}
          </span>
        )}
      </div>
    </a>
  );
}
