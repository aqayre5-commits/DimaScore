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
  if (rating >= 7) return 'text-accent-green font-bold';
  if (rating >= 6) return 'text-accent-amber font-bold';
  return 'text-accent-crimson font-bold';
}

export function PlayerSeasonStats({ stats, locale }: PlayerSeasonStatsProps) {
  const t = useTranslations('playerPage');

  if (stats.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noSeasonData')}</p>
      </div>
    );
  }

  // Group by season year
  const seasons = [...new Set(stats.map((s) => s.seasonYear))].sort((a, b) => b - a);

  // For the selected season (first = most recent), sort by appearances desc
  const currentSeason = seasons[0];
  const seasonStats = stats
    .filter((s) => s.seasonYear === currentSeason)
    .sort((a, b) => {
      const aApps = (a.stats as Record<string, number>).appearances ?? 0;
      const bApps = (b.stats as Record<string, number>).appearances ?? 0;
      return bApps - aApps;
    });

  // All seasons for career tab
  const allStats = [...stats].sort((a, b) => {
    if (b.seasonYear !== a.seasonYear) return b.seasonYear - a.seasonYear;
    const aApps = (a.stats as Record<string, number>).appearances ?? 0;
    const bApps = (b.stats as Record<string, number>).appearances ?? 0;
    return bApps - aApps;
  });

  return (
    <div className="space-y-4">
      {/* Current season table */}
      <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
        <div className="border-b border-border-subtle px-4 py-2">
          <h3 className="label-caps">
            {currentSeason}/{(currentSeason + 1) % 100}
          </h3>
        </div>
        <StatsTable stats={seasonStats} locale={locale} t={t} />
      </div>

      {/* Career table (all seasons) */}
      {allStats.length > seasonStats.length && (
        <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
          <div className="border-b border-border-subtle px-4 py-2">
            <h3 className="label-caps">{t('career')}</h3>
          </div>
          <CareerTable stats={allStats} locale={locale} t={t} currentSeason={currentSeason} />
        </div>
      )}
    </div>
  );
}

function StatsTable({
  stats,
  locale,
  t,
}: {
  stats: PlayerSeasonStat[];
  locale: Locale;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
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
          {stats.map((stat) => {
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
  );
}

function CareerTable({
  stats,
  locale,
  t,
  currentSeason,
}: {
  stats: PlayerSeasonStat[];
  locale: Locale;
  t: ReturnType<typeof useTranslations>;
  currentSeason: number;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-[11px] font-semibold uppercase text-text-tertiary">
            <th className="px-3 py-2 text-start">{t('season')}</th>
            <th className="px-3 py-2 text-start">{t('teamCol')}</th>
            <th className="px-3 py-2 text-start">{t('competition')}</th>
            <th className="px-2 py-2 text-center">{t('appearances')}</th>
            <th className="px-2 py-2 text-center">{t('goals')}</th>
            <th className="px-2 py-2 text-center">{t('assists')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {stats.map((stat) => {
            const s = stat.stats as Record<string, number | null>;
            const compName = stat.competitionName[locale] ?? stat.competitionName['en'] ?? '—';
            const teamName = stat.teamName[locale] ?? stat.teamName['en'] ?? '—';
            const isCurrent = stat.seasonYear === currentSeason;
            return (
              <tr
                key={`${stat.seasonYear}-${stat.competitionId}-${stat.teamId}`}
                className={cn(
                  'transition-colors',
                  isCurrent ? 'bg-accent-green/[0.06]' : 'hover:bg-bg-surface-2',
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
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
