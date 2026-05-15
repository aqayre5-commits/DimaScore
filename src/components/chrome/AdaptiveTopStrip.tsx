import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getTickerFixtures } from '@/lib/db/queries';
import { TickerStrip } from './TickerStrip';
import type { Locale } from '@/lib/i18n/config';

interface AdaptiveTopStripProps {
  locale: Locale;
}

/**
 * Global match ticker — renders at the top of every page.
 * Async RSC: fetches live or upcoming fixtures from DB on each page load.
 * Phase 7+ follow-up: TickerStrip subscribes to Pusher for live score pushes.
 */
export async function AdaptiveTopStrip({ locale }: AdaptiveTopStripProps) {
  const result = await getTickerFixtures(db);

  if (result.mode === 'empty') {
    const t = await getTranslations({ locale, namespace: 'topStrip' });
    return (
      <div className="sticky top-0 z-50 flex h-10 items-center justify-center bg-[#0c0c0d] px-4">
        <span className="text-sm text-text-secondary">{t('emptyState')}</span>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 h-10 bg-[#0c0c0d]">
      <TickerStrip fixtures={result.fixtures} locale={locale} />
    </div>
  );
}
