import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch, KnockoutPhase } from './BracketMatchCell';
import { DesktopBracket } from './DesktopBracket';

interface KnockoutBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  activePhase: KnockoutPhase;
}

/**
 * Knockout bracket wrapper. Renders the symmetric converging DesktopBracket at every breakpoint —
 * on mobile it scrolls horizontally (and vertically), showing the same tree as desktop rather than
 * per-round slides.
 */
export function KnockoutBracket({
  matches,
  thirdPlaceMatch,
  locale,
  activePhase,
}: KnockoutBracketProps) {
  return (
    <DesktopBracket
      matches={matches}
      thirdPlaceMatch={thirdPlaceMatch}
      locale={locale}
      activePhase={activePhase}
    />
  );
}
