import { useTranslations } from 'next-intl';

/**
 * Right-rail Widget 4 — More matches today (cross-competition).
 * Pre-tournament: compact empty state.
 * ShareButton hidden in empty state — appears when data populates (Phase 7+).
 */
export function MoreMatchesTodayWidget() {
  const t = useTranslations('tournament');

  return (
    <div
      id="more-matches-today"
      className="rounded-lg border border-border-subtle bg-bg-surface p-4"
    >
      <h3 className="text-sm font-semibold text-text-primary">{t('moreMatchesToday')}</h3>
      <p className="mt-1 text-xs text-text-tertiary">{t('noDataPreTournament')}</p>
    </div>
  );
}
