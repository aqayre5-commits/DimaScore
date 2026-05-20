import { useTranslations } from 'next-intl';
import type { PlayerSeasonStat } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerSeasonStatsProps {
  stats: PlayerSeasonStat[];
  locale: Locale;
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

  return (
    <div className="space-y-4">
      {stats.map((stat) => {
        const compName = stat.competitionName[locale] ?? stat.competitionName['en'] ?? '—';
        const teamName = stat.teamName[locale] ?? stat.teamName['en'] ?? '—';
        const s = stat.stats as Record<string, number | null>;

        return (
          <div
            key={`${stat.competitionId}-${stat.seasonYear}-${stat.teamId}`}
            className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
          >
            <div className="border-b border-border-subtle px-4 py-2">
              <h3 className="text-sm font-semibold text-text-primary">
                {compName} · {stat.seasonYear}
              </h3>
              <p className="text-xs text-text-tertiary">{teamName}</p>
            </div>

            <div className="grid grid-cols-3 gap-px bg-border-subtle sm:grid-cols-6">
              <StatCell label={t('appearances')} value={s.appearances} />
              <StatCell label={t('goals')} value={s.goals} />
              <StatCell label={t('assists')} value={s.assists} />
              <StatCell label={t('minutes')} value={s.minutes} />
              <StatCell label={t('yellowCards')} value={s.yellowCards ?? s.yellow_cards} />
              <StatCell label={t('redCards')} value={s.redCards ?? s.red_cards} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="flex flex-col items-center bg-bg-surface px-3 py-3">
      <span className="text-lg font-semibold tabular-nums text-text-primary">{value ?? '—'}</span>
      <span className="text-xs text-text-tertiary">{label}</span>
    </div>
  );
}
