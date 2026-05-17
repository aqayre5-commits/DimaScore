'use client';

import { useTranslations } from 'next-intl';

interface NewsletterCardProps {
  tournamentName: string;
}

/**
 * Newsletter subscription card — left rail Card 4 for cup/tournament pages.
 * Per competition-cup.md Section 6 Card 4.
 *
 * Tournament-specific framing. Email submit deferred to Phase 5+
 * (newsletter infrastructure decision). UI renders as a visual shell.
 */
export function NewsletterCard({ tournamentName }: NewsletterCardProps) {
  const t = useTranslations('tournament');

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface p-4">
      <h3 className="label-caps">{t('newsletterTitle')}</h3>
      <p className="mt-2 text-sm text-text-secondary">
        {t('newsletterCta', { tournament: tournamentName })}
      </p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: Phase 5+ — wire to newsletter backend
        }}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          {t('emailPlaceholder')}
        </label>
        <input
          id="newsletter-email"
          type="email"
          placeholder={t('emailPlaceholder')}
          className="min-w-0 flex-1 rounded-md border border-border-subtle bg-bg-surface-2 px-3 py-1.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-gold focus:outline-none"
          required
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-accent-gold px-3 py-1.5 text-sm font-medium text-bg-canvas transition-colors hover:bg-accent-gold-bright"
        >
          {t('subscribe')}
        </button>
      </form>
    </div>
  );
}
