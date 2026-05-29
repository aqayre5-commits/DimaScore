import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch } from './BracketMatchCell';

interface BracketPageClientProps {
  locale: Locale;
  /** DB-driven matches. Falls back to static WC 2026 schedule when absent. */
  matches?: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
}

export function BracketPageClient({ locale, matches, thirdPlaceMatch }: BracketPageClientProps) {
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
