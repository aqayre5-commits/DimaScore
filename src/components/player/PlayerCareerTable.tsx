import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { PlayerSeasonStat } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerCareerTableProps {
  stats: PlayerSeasonStat[];
  locale: Locale;
}

function ratingClass(rating: number | null | undefined): string {
  if (rating == null) return '';
  if (rating >= 7.5) return 'text-accent-green font-bold';
  if (rating >= 6.5) return 'text-accent-amber font-bold';
  return 'text-accent-crimson font-bold';
}

export function PlayerCareerTable({ stats, locale }: PlayerCareerTableProps) {
  const t = useTranslations('playerPage');

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noSeasonData')}</p>
      </div>
    );
  }

  // Sort: most recent season first, within season by appearances desc
  const sorted = [...stats].sort((a, b) => {
    if (b.seasonYear !== a.seasonYear) return b.seasonYear - a.seasonYear;
    const aApps = (a.stats as Record<string, number>).appearances ?? 0;
    const bApps = (b.stats as Record<string, number>).appearances ?? 0;
    return bApps - aApps;
  });

  const latestSeason = sorted[0]?.seasonYear;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase text-text-tertiary">
            <th className="px-3 py-2 text-start">{t('season')}</th>
            <th className="px-3 py-2 text-start">{t('teamCol')}</th>
            <th className="px-3 py-2 text-start">{t('competition')}</th>
            <th className="px-2 py-2 text-center">{t('appearances')}</th>
            <th className="px-2 py-2 text-center">{t('goals')}</th>
            <th className="px-2 py-2 text-center">{t('assists')}</th>
            <th className="px-2 py-2 text-center">{t('rating')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {sorted.map((stat) => {
            const s = stat.stats as Record<string, number | null>;
            const compName = stat.competitionName[locale] ?? stat.competitionName['en'] ?? '—';
            const teamName = stat.teamName[locale] ?? stat.teamName['en'] ?? '—';
            const isCurrent = stat.seasonYear === latestSeason;
            const rating = s.rating ?? null;
            return (
              <tr
                key={`${stat.seasonYear}-${stat.competitionId}-${stat.teamId}`}
                className={cn(
                  'transition-colors',
                  isCurrent ? 'bg-accent-azure/[0.06]' : 'hover:bg-bg-surface-2',
                )}
              >
                <td className="px-3 py-2 tabular-nums text-text-secondary">
                  {stat.seasonYear}/{(stat.seasonYear + 1) % 100}
                </td>
                <td className="px-3 py-2 text-text-primary">{teamName}</td>
                <td className="px-3 py-2 text-text-secondary">{compName}</td>
                <td className="px-2 py-2 text-center tabular-nums">{s.appearances ?? '—'}</td>
                <td className="px-2 py-2 text-center tabular-nums">{s.goals ?? '—'}</td>
                <td className="px-2 py-2 text-center tabular-nums">{s.assists ?? '—'}</td>
                <td className={cn('px-2 py-2 text-center tabular-nums', ratingClass(rating))}>
                  {rating != null ? Number(rating).toFixed(1) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
