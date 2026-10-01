'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useConsent, setConsent } from '@/lib/consent';

/**
 * Opt-in cookie-consent banner.
 *
 * Shown only while the visitor has made no choice (consent === null). Accept enables analytics /
 * marketing tags (GTM/GA4, Meta Pixel); Reject keeps only essential cookies. Both persist via the
 * consent store, which the tag components subscribe to — no reload needed. SSR renders nothing
 * (consent is null on the server), so there is no hydration mismatch.
 */
export function CookieNotice() {
  const t = useTranslations('cookieNotice');
  const locale = useLocale();
  const consent = useConsent();

  if (consent !== null) return null;

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
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setConsent('denied')}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('reject')}
          </button>
          <button
            type="button"
            onClick={() => setConsent('granted')}
            className="rounded-lg bg-accent-azure px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-azure/90"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
