import { getTranslations } from 'next-intl/server';
import { MatchesThisWeek } from './cards/MatchesThisWeek';
import type { Locale } from '@/lib/i18n/config';

interface EditorialCardsProps {
  locale: Locale;
}

export async function EditorialCards({ locale }: EditorialCardsProps) {
  const t = await getTranslations({ locale, namespace: 'editorialCards' });

  const placeholders = [
    t('featuredMatches'),
    t('rankings'),
    t('playerOfSeason'),
    t('comparePlayers'),
    t('compareTeams'),
    t('topPerformances'),
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Matches this week (data-driven) — promoted to top */}
      <Card heading={t('matchesThisWeek')}>
        <MatchesThisWeek locale={locale} />
      </Card>

      {/* Placeholder cards — compact 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {placeholders.map((label) => (
          <div
            key={label}
            className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-3"
          >
            <h2 className="text-sm font-semibold text-text-primary">{label}</h2>
            <p className="mt-1 text-xs text-text-tertiary">{t('comingSoon')}</p>
          </div>
        ))}
      </div>

      {/* Newsletter */}
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
            className="shrink-0 rounded-lg bg-bg-surface-3 px-4 py-2 text-sm font-medium text-text-tertiary cursor-not-allowed"
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
