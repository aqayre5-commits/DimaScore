import { useTranslations } from 'next-intl';

/**
 * Right-rail Widget 1 — Top scorers.
 * Pre-tournament: compact empty state (single muted line).
 * ShareButton hidden in empty state — appears when data populates (Phase 7+).
 */
export function TopScorersWidget() {
  const t = useTranslations('tournament');

  return (
    <div id="top-scorers" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-text-primary">{t('topScorers')}</h3>
      <p className="mt-1 text-xs text-text-tertiary">{t('noDataPreTournament')}</p>
    </div>
  );
}
