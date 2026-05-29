'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { TeamSeasonStatsResult } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamStatisticsProps {
  data: TeamSeasonStatsResult;
  locale: Locale;
}

// ── SVG Donut circle ──

function DonutCircle({
  value,
  label,
  subtitle,
  color = 'var(--color-accent-green)',
}: {
  value: string;
  label: string;
  subtitle: string;
  color?: string;
}) {
  const pct = parseFloat(value) || 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const isPercentage = value.includes('%') || !isNaN(parseFloat(value));

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative size-[88px]">
        <svg className="size-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth="5"
          />
          {isPercentage && (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold tabular-nums text-text-primary">{value}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wide text-text-tertiary">
            {label}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-text-secondary">{subtitle}</span>
    </div>
  );
}

// ── Horizontal home/away bar ──

function HomeAwayBar({
  label,
  home,
  away,
  total,
}: {
  label: string;
  home: number;
  away: number;
  total: number;
}) {
  const max = Math.max(home, away, 1);
  const homePct = (home / max) * 50;
  const awayPct = (away / max) * 50;

  return (
    <div className="py-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="w-8 text-center tabular-nums font-semibold text-text-primary">{home}</span>
        <span className="text-text-secondary">
          {label} <span className="text-text-tertiary">: {total}</span>
        </span>
        <span className="w-8 text-center tabular-nums font-semibold text-text-primary">{away}</span>
      </div>
      <div className="relative flex h-[5px] items-center">
        <div className="absolute inset-0 rounded-full bg-bg-surface-2" />
        <div className="absolute left-0 right-1/2 flex justify-end">
          <div
            className="h-[5px] rounded-l-full bg-accent-green transition-all"
            style={{ width: `${homePct * 2}%` }}
          />
        </div>
        <div className="absolute left-1/2 right-0 flex justify-start">
          <div
            className="h-[5px] rounded-r-full bg-accent-amber transition-all"
            style={{ width: `${awayPct * 2}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Cards summary ──

function CardsSummary({ cards }: { cards: Record<string, unknown> }) {
  const yellow = cards.yellow as Record<string, { total: number | null }> | undefined;
  const red = cards.red as Record<string, { total: number | null }> | undefined;

  let yellowTotal = 0;
  let redTotal = 0;
  if (yellow) {
    for (const v of Object.values(yellow)) yellowTotal += v.total ?? 0;
  }
  if (red) {
    for (const v of Object.values(red)) redTotal += v.total ?? 0;
  }

  return (
    <div className="flex items-center justify-center gap-10 py-4">
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-5 rounded-sm bg-yellow-400 shadow-sm" />
        <span className="text-lg font-bold tabular-nums text-text-primary">{yellowTotal}</span>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-5 rounded-sm bg-red-500 shadow-sm" />
        <span className="text-lg font-bold tabular-nums text-text-primary">{redTotal}</span>
      </div>
    </div>
  );
}

// ── Main component ──

export function TeamStatistics({ data, locale }: TeamStatisticsProps) {
  const t = useTranslations('teamPage');
  const { competitions, seasons, statsByCompSeason } = data;

  const [activeCompId, setActiveCompId] = useState<number>(competitions[0]?.id ?? 0);
  const [activeSeason, setActiveSeason] = useState<number>(seasons[0] ?? 0);

  if (competitions.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noStatsData')}</p>
      </div>
    );
  }

  const key = `${activeCompId}-${activeSeason}`;
  const entry = statsByCompSeason[key];
  const stats = entry?.stats as Record<string, unknown> | undefined;

  // Extract nested data
  const fixtures = stats?.fixtures as
    | {
        played: { home: number; away: number; total: number };
        wins: { home: number; away: number; total: number };
        draws: { home: number; away: number; total: number };
        loses: { home: number; away: number; total: number };
      }
    | undefined;

  const cleanSheet = stats?.clean_sheet as
    | { home: number; away: number; total: number }
    | undefined;
  const failedToScore = stats?.failed_to_score as
    | { home: number; away: number; total: number }
    | undefined;
  const penalty = stats?.penalty as
    | {
        total: number;
        scored: { total: number; percentage: string };
        missed: { total: number; percentage: string };
      }
    | undefined;
  const lineups = stats?.lineups as Array<{ formation: string; played: number }> | undefined;
  const form = stats?.form as string | undefined;
  const cards = stats?.cards as Record<string, unknown> | undefined;
  const goals = stats?.goals as
    | {
        for: { total: { home: number; away: number; total: number } };
        against: { total: { home: number; away: number; total: number } };
      }
    | undefined;

  const played = fixtures?.played.total ?? 0;
  const wins = fixtures?.wins.total ?? 0;
  const winPct = played > 0 ? ((wins / played) * 100).toFixed(0) : '0';
  const topFormation = lineups?.[0]?.formation ?? '\u2014';
  const formationPct =
    lineups && lineups.length > 0 && played > 0
      ? ((lineups[0].played / played) * 100).toFixed(0)
      : '0';
  const penScoredPct = penalty?.scored.percentage?.replace('.00', '') ?? '0%';

  const activeComp = competitions.find((c) => c.id === activeCompId);

  // Select classes (shared)
  const selectCls =
    'rounded-lg border border-border-subtle bg-bg-surface-2 px-2.5 py-1.5 pr-7 text-[13px] text-text-primary focus:border-accent-azure focus:outline-none focus:ring-1 focus:ring-accent-azure';

  return (
    <div className="space-y-3">
      {/* Competition + Season selectors */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          {activeComp?.logoUrl && (
            <img src={activeComp.logoUrl} alt="" className="size-5 object-contain" loading="lazy" />
          )}
          <select
            value={activeCompId}
            onChange={(e) => setActiveCompId(Number(e.target.value))}
            className={`min-w-[140px] flex-1 ${selectCls}`}
          >
            {competitions.map((c) => {
              const name = c.name[locale] ?? c.name['en'] ?? `ID ${c.id}`;
              return (
                <option key={c.id} value={c.id}>
                  {name}
                </option>
              );
            })}
          </select>
          <select
            value={activeSeason}
            onChange={(e) => setActiveSeason(Number(e.target.value))}
            className={`min-w-[90px] ${selectCls}`}
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}/{(s + 1) % 100}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!stats ? (
        <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{t('noStatsData')}</p>
        </div>
      ) : (
        <>
          {/* Donut circles row */}
          <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-5">
            <div className="flex items-start justify-around">
              <DonutCircle
                value={`${winPct}%`}
                label={t('won')}
                subtitle={`${t('played')} : ${played}`}
              />
              <DonutCircle
                value={formationPct + '%'}
                label={topFormation}
                subtitle={t('lineups')}
                color="var(--color-accent-azure)"
              />
              <DonutCircle
                value={penScoredPct}
                label={t('scored')}
                subtitle={`${t('penalty')} : ${penalty?.total ?? 0}`}
              />
            </div>
          </div>

          {/* Home / Away section */}
          <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle px-4 py-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-green">
                {t('home')}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-amber">
                {t('away')}
              </span>
            </div>

            <div className="divide-y divide-border-subtle/50 px-4">
              {fixtures && (
                <>
                  <HomeAwayBar
                    label={t('won')}
                    home={fixtures.wins.home}
                    away={fixtures.wins.away}
                    total={fixtures.wins.total}
                  />
                  <HomeAwayBar
                    label={t('lost')}
                    home={fixtures.loses.home}
                    away={fixtures.loses.away}
                    total={fixtures.loses.total}
                  />
                  <HomeAwayBar
                    label={t('drawn')}
                    home={fixtures.draws.home}
                    away={fixtures.draws.away}
                    total={fixtures.draws.total}
                  />
                </>
              )}
              {cleanSheet && (
                <HomeAwayBar
                  label={t('cleanSheets')}
                  home={cleanSheet.home}
                  away={cleanSheet.away}
                  total={cleanSheet.total}
                />
              )}
              {failedToScore && (
                <HomeAwayBar
                  label={t('failedToScore')}
                  home={failedToScore.home}
                  away={failedToScore.away}
                  total={failedToScore.total}
                />
              )}
              {goals && (
                <>
                  <HomeAwayBar
                    label={t('goalsFor')}
                    home={goals.for.total.home}
                    away={goals.for.total.away}
                    total={goals.for.total.total}
                  />
                  <HomeAwayBar
                    label={t('goalsAgainst')}
                    home={goals.against.total.home}
                    away={goals.against.total.away}
                    total={goals.against.total.total}
                  />
                </>
              )}
            </div>
          </div>

          {/* Cards */}
          {cards && (
            <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="border-b border-border-subtle px-4 py-2.5">
                <h3 className="label-caps text-center">{t('cards')}</h3>
              </div>
              <CardsSummary cards={cards} />
            </div>
          )}

          {/* Form */}
          {form && (
            <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
              <div className="border-b border-border-subtle px-4 py-2.5">
                <h3 className="label-caps text-center">{t('form')}</h3>
              </div>
              <div className="flex flex-wrap gap-1 px-4 py-3 justify-center">
                {form
                  .split('')
                  .slice(-20)
                  .map((ch, i) => (
                    <span
                      key={i}
                      className={`inline-flex size-7 items-center justify-center rounded text-[11px] font-bold text-white ${
                        ch === 'W'
                          ? 'bg-accent-green'
                          : ch === 'D'
                            ? 'bg-text-tertiary'
                            : 'bg-accent-crimson'
                      }`}
                    >
                      {ch === 'W' ? t('formWin') : ch === 'D' ? t('formDraw') : t('formLoss')}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
