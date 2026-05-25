'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PlayerSeasonStat } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerSeasonStatsProps {
  stats: PlayerSeasonStat[];
  locale: Locale;
}

function ratingClass(rating: number | null | undefined): string {
  if (rating == null) return '';
  if (rating >= 7.5) return 'text-accent-green font-bold';
  if (rating >= 6.5) return 'text-accent-amber font-bold';
  return 'text-accent-crimson font-bold';
}

export function PlayerSeasonStats({ stats, locale }: PlayerSeasonStatsProps) {
  const t = useTranslations('playerPage');

  // All available seasons (desc)
  const seasons = [...new Set(stats.map((s) => s.seasonYear))].sort((a, b) => b - a);
  const [activeSeason, setActiveSeason] = useState<number>(seasons[0] ?? 0);

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noSeasonData')}</p>
      </div>
    );
  }

  // Filter to active season, sort by appearances desc
  const seasonStats = stats
    .filter((s) => s.seasonYear === activeSeason)
    .sort((a, b) => {
      const aApps = (a.stats as Record<string, number>).appearances ?? 0;
      const bApps = (b.stats as Record<string, number>).appearances ?? 0;
      return bApps - aApps;
    });

  return (
    <div>
      {/* Season dropdown */}
      <div className="flex flex-wrap gap-2.5 py-3">
        <select
          value={activeSeason}
          onChange={(e) => setActiveSeason(Number(e.target.value))}
          className="min-w-[120px] rounded-lg border border-border-subtle bg-bg-page px-2.5 py-1.5 pr-7 text-[13px] text-text-primary focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green"
        >
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}/{(s + 1) % 100}
            </option>
          ))}
        </select>
      </div>

      {/* Stats table */}
      {seasonStats.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{t('noSeasonData')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase text-text-tertiary">
                <th className="px-3 py-2 text-start">{t('competition')}</th>
                <th className="px-2 py-2 text-center">{t('appearances')}</th>
                <th className="px-2 py-2 text-center">{t('goals')}</th>
                <th className="px-2 py-2 text-center">{t('assists')}</th>
                <th className="px-2 py-2 text-center">{t('minutes')}</th>
                <th className="px-2 py-2 text-center">{t('rating')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {seasonStats.map((stat) => {
                const s = stat.stats as Record<string, number | null>;
                const compName = stat.competitionName[locale] ?? stat.competitionName['en'] ?? '—';
                const rating = s.rating ?? null;
                return (
                  <tr
                    key={`${stat.competitionId}-${stat.teamId}`}
                    className="transition-colors hover:bg-bg-surface-2"
                  >
                    <td className="px-3 py-2 text-text-primary">{compName}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.appearances ?? '—'}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.goals ?? '—'}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.assists ?? '—'}</td>
                    <td className="px-2 py-2 text-center tabular-nums">{s.minutes ?? '—'}</td>
                    <td className={cn('px-2 py-2 text-center tabular-nums', ratingClass(rating))}>
                      {rating != null ? Number(rating).toFixed(1) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
