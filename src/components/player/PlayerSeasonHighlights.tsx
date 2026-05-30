import { useTranslations } from 'next-intl';
import type { PlayerSeasonStat } from '@/lib/db/queries/player';

interface PlayerSeasonHighlightsProps {
  stats: PlayerSeasonStat[];
}

function aggregate(stats: PlayerSeasonStat[]) {
  let apps = 0;
  let goals = 0;
  let assists = 0;
  let ratingSum = 0;
  let ratingCount = 0;

  for (const s of stats) {
    const d = s.stats as Record<string, unknown>;
    apps += Number(d.appearances ?? 0);
    goals += Number(d.goals ?? 0);
    assists += Number(d.assists ?? 0);
    const r = Number(d.rating);
    if (r > 0) {
      ratingSum += r;
      ratingCount++;
    }
  }

  return {
    apps,
    goals,
    assists,
    avgRating: ratingCount > 0 ? (ratingSum / ratingCount).toFixed(1) : null,
  };
}

export function PlayerSeasonHighlights({ stats }: PlayerSeasonHighlightsProps) {
  const t = useTranslations('playerPage');

  if (stats.length === 0) return null;

  // Use latest season
  const latestYear = Math.max(...stats.map((s) => s.seasonYear));
  const latestStats = stats.filter((s) => s.seasonYear === latestYear);
  const agg = aggregate(latestStats);

  if (agg.apps === 0) return null;

  const items = [
    { value: agg.goals, label: t('goals') },
    { value: agg.assists, label: t('assists') },
    { value: agg.apps, label: t('appearances') },
    { value: agg.avgRating, label: t('rating') },
  ].filter((item) => item.value != null && item.value !== 0);

  if (items.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('seasonHighlights')}</h3>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border-subtle">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 bg-bg-surface py-4">
            <span className="text-xl font-bold tabular-nums text-text-primary">{item.value}</span>
            <span className="text-[10px] font-medium text-text-tertiary">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
