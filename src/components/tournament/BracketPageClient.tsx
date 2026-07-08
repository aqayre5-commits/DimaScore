import { getTranslations } from 'next-intl/server';
import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import { DynamicKnockoutBracket } from './DynamicKnockoutBracket';
import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch } from './BracketMatchCell';
import type { BracketGridConfig } from '@/lib/constants/dynamic-bracket-builder';

interface BracketPageClientProps {
  locale: Locale;
  competitionId: number;
  /** DB-driven matches. The World Cup falls back to its static schedule when absent. */
  matches?: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  gridConfig?: BracketGridConfig;
}

/**
 * Full-page bracket. The World Cup (1) uses the symmetric 9-column KnockoutBracket (with a static
 * pre-tournament fallback); AFCON (6) / WAFCON (922) use the linear DynamicKnockoutBracket — the
 * same components shown in each competition's Knockout tab, rendered full-width.
 */
export async function BracketPageClient({
  locale,
  competitionId,
  matches,
  thirdPlaceMatch,
  gridConfig,
}: BracketPageClientProps) {
  if (competitionId === 1) {
    const data = matches ? { matches, thirdPlaceMatch } : WC_2026_BRACKETS_BY_LOCALE[locale];
    return (
      <KnockoutBracket
        matches={data.matches}
        thirdPlaceMatch={data.thirdPlaceMatch}
        locale={locale}
        activePhase="r32"
      />
    );
  }

  if (!matches || !gridConfig) {
    const t = await getTranslations({ locale, namespace: 'tournament' });
    return <div className="p-8 text-center text-text-tertiary">{t('bracketNotAvailable')}</div>;
  }

  return (
    <DynamicKnockoutBracket
      matches={matches}
      thirdPlaceMatch={thirdPlaceMatch}
      locale={locale}
      gridConfig={gridConfig}
      competitionId={competitionId}
    />
  );
}
