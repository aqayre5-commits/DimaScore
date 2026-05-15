import { useTranslations } from 'next-intl';
import { BestThirdTable } from './BestThirdTable';
import type { BestThirdRow } from '@/lib/standings/best-third';
import type { Locale } from '@/lib/i18n/config';

interface BestThirdTabProps {
  rows: BestThirdRow[];
  locale: Locale;
  qualifiedCount: number;
  hasTiesRequiringFallback: boolean;
}

/**
 * Best 3rd-placed teams tab.
 * Caption + optional disclaimer + 12-row cross-group table.
 */
export function BestThirdTab({
  rows,
  locale,
  qualifiedCount,
  hasTiesRequiringFallback,
}: BestThirdTabProps) {
  const t = useTranslations('tournament');

  return (
    <div className="space-y-4">
      {/* Caption + optional disclaimer */}
      <p className="text-sm text-text-secondary">
        {t('bestThirdCaption')}
        {hasTiesRequiringFallback && (
          <span
            className="ml-1.5 inline-flex cursor-help text-text-tertiary"
            title={t('bestThirdDisclaimer')}
          >
            &#9432;
          </span>
        )}
      </p>

      <BestThirdTable rows={rows} locale={locale} qualifiedCount={qualifiedCount} />
    </div>
  );
}
