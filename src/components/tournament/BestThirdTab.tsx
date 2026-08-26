import { useTranslations } from 'next-intl';
import { BestThirdTable } from './BestThirdTable';
import type { BestThirdRow } from '@/lib/standings/best-third';
import type { Locale } from '@/lib/i18n/config';

interface BestThirdTabProps {
  rows: BestThirdRow[];
  locale: Locale;
  qualifiedCount: number;
  /** i18n key (tournament namespace) for the round best-third teams advance to, e.g. 'roundOf16'. */
  targetRoundKey: string;
  hasTiesRequiringFallback: boolean;
}

/**
 * Best 3rd-placed teams tab.
 * Caption + optional disclaimer + cross-group table. The caption's count + target round are derived
 * from the tournament format (WC: 8 → Round of 32; AFCON: 4 → Round of 16).
 */
export function BestThirdTab({
  rows,
  locale,
  qualifiedCount,
  targetRoundKey,
  hasTiesRequiringFallback,
}: BestThirdTabProps) {
  const t = useTranslations('tournament');

  return (
    <div className="space-y-4">
      {/* Caption + optional disclaimer */}
      <p className="text-sm text-text-secondary">
        {t('bestThirdCaption', { count: qualifiedCount, round: t(targetRoundKey) })}
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
