import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getFixturesByDay } from '@/lib/db/queries/fixtures-by-day';
import { MatchRowGroup } from './MatchRowGroup';
import type { Locale } from '@/lib/i18n/config';

interface FixtureListProps {
  locale: Locale;
}

export async function FixtureList({ locale }: FixtureListProps) {
  const t = await getTranslations({ locale, namespace: 'fixtureList' });
  const today = new Date();
  const groups = await getFixturesByDay(db, today);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* H2 heading */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-lg font-semibold text-text-primary">{t('h2Today')}</h2>
      </div>

      {/* Filter pills (static — functional filtering deferred to Phase 7 Pusher) */}
      <div className="flex gap-2 border-b border-border-subtle px-4 pb-3">
        <span className="rounded-full bg-accent-gold/10 px-3 py-1 text-xs font-medium text-accent-gold">
          {t('filterAll')}
        </span>
        <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
          {t('filterLive')}
        </span>
        <span className="rounded-full px-3 py-1 text-xs font-medium text-text-tertiary">
          {t('filterFinished')}
        </span>
        <span className="rounded-full px-3 py-1 text-xs font-medium text-text-tertiary">
          {t('filterUpcoming')}
        </span>
      </div>

      {/* Competition groups or empty state */}
      {groups.length > 0 ? (
        <div>
          {groups.map((group, idx) => (
            <MatchRowGroup
              key={group.competition.id}
              group={group}
              locale={locale}
              defaultExpanded={idx < 5}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-tertiary">{t('emptyState')}</p>
        </div>
      )}
    </div>
  );
}
