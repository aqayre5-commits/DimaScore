import { getTranslations } from 'next-intl/server';
import { MatchesThisWeek } from './cards/MatchesThisWeek';
import type { Locale } from '@/lib/i18n/config';

interface EditorialCardsProps {
  locale: Locale;
}

export async function EditorialCards({ locale }: EditorialCardsProps) {
  const t = await getTranslations({ locale, namespace: 'editorialCards' });

  return (
    <div className="flex flex-col gap-4">
      {/* Card 1 — Featured matches */}
      <Card heading={t('featuredMatches')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 2 — International rankings */}
      <Card heading={t('rankings')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 3 — Players of the season */}
      <Card heading={t('playerOfSeason')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 4 — Compare players */}
      <Card heading={t('comparePlayers')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 5 — Compare teams */}
      <Card heading={t('compareTeams')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 6 — Matches this week (data-driven) */}
      <Card heading={t('matchesThisWeek')}>
        <MatchesThisWeek locale={locale} />
      </Card>

      {/* Card 7 — Top performances */}
      <Card heading={t('topPerformances')}>
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </Card>

      {/* Card 8 — Newsletter */}
      <Card heading={t('newsletter')}>
        <p className="text-sm text-text-secondary">{t('newsletterCta')}</p>
        <div className="mt-3 flex gap-2">
          <input
            type="email"
            placeholder={t('emailPlaceholder')}
            className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-bg-canvas px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary"
            disabled
          />
          <button
            type="button"
            disabled
            className="shrink-0 rounded-lg bg-accent-gold px-4 py-2 text-sm font-medium text-bg-canvas opacity-50"
          >
            {t('subscribe')}
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-base font-semibold text-text-primary">{heading}</h2>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}
