'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { RefreshCw, X } from 'lucide-react';
import { useUpdateAvailable } from '@/hooks/useLiveFixtures';

/**
 * Bottom pill shown when a new deployment is live and this tab is running stale code. Lets the
 * user reload on their terms — we never auto-reload mid-session. Dismissible for the session.
 */
export function UpdateBanner() {
  const t = useTranslations('chrome');
  const updateAvailable = useUpdateAvailable();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-bg-surface px-4 py-2 shadow-lg">
        <span className="text-sm text-text-secondary">{t('updateAvailable')}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent-azure px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-accent-azure/90"
        >
          <RefreshCw className="size-3.5" />
          {t('refresh')}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-text-tertiary transition-colors hover:text-text-secondary"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
