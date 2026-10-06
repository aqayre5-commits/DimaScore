'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

const STORAGE_KEY = 'dimascore-cookie-notice';

/**
 * Non-blocking cookie notice. Analytics (GTM/GA4, Meta Pixel) load unconditionally; this banner only
 * informs and links to the privacy page — it does not gate anything. Dismissal is persisted per
 * browser in localStorage. SSR renders nothing (server snapshot = dismissed) to avoid a hydration
 * mismatch; after mount the client snapshot reads localStorage.
 */
const emptySubscribe = () => () => {};

function getStoredDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dismissed';
  } catch {
    return false;
  }
}

export function CookieNotice() {
  const t = useTranslations('cookieNotice');
  const locale = useLocale();
  const storedDismissed = useSyncExternalStore(
    emptySubscribe,
    getStoredDismissed,
    () => true, // server / first hydration render: treat as dismissed → render nothing
  );
  const [dismissedNow, setDismissedNow] = useState(false);

  if (storedDismissed || dismissedNow) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      // ignore — private mode / blocked storage
    }
    setDismissedNow(true);
  };

  return (
    <div
      role="dialog"
      aria-label={t('message')}
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-50 border-t border-border-subtle bg-bg-surface px-4 py-3 shadow-lg md:bottom-0"
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          {t('message')}{' '}
          <Link href={`/${locale}/privacy`} className="font-medium text-text-primary underline">
            {t('learnMore')}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg bg-accent-azure px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-azure/90"
        >
          {t('dismiss')}
        </button>
      </div>
    </div>
  );
}
