import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import type { Locale } from '@/lib/i18n/config';

interface KnockoutTabProps {
  locale: Locale;
  bracketHref?: string;
}

/**
 * Knockout tab — converging bracket visualization.
 * In-tab preview of the bracket. Links to dedicated /bracket page
 * for full-viewport view when bracketHref is provided.
 */
export function KnockoutTab({ locale, bracketHref }: KnockoutTabProps) {
  const t = useTranslations('tournament');

  const { matches, thirdPlaceMatch } = WC_2026_BRACKETS_BY_LOCALE[locale];

  return (
    <div className="space-y-4">
      {bracketHref && (
        <Link
          href={bracketHref}
          className="inline-flex items-center gap-1 rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-3 py-1.5 text-xs font-medium text-accent-gold transition-colors hover:bg-accent-gold/20"
        >
          {t('viewFullBracket')} →
        </Link>
      )}
      <KnockoutBracket
        matches={matches}
        thirdPlaceMatch={thirdPlaceMatch}
        locale={locale}
        activePhase="r32"
      />
    </div>
  );
}
