import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import type { Locale } from '@/lib/i18n/config';

interface BracketPageClientProps {
  locale: Locale;
}

export function BracketPageClient({ locale }: BracketPageClientProps) {
  const { matches, thirdPlaceMatch } = WC_2026_BRACKETS_BY_LOCALE[locale];

  return (
    <KnockoutBracket
      matches={matches}
      thirdPlaceMatch={thirdPlaceMatch}
      locale={locale}
      activePhase="r32"
    />
  );
}
