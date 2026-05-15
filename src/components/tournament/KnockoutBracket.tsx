import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch, KnockoutPhase } from './BracketMatchCell';
import { DesktopBracket } from './DesktopBracket';
import { MobileBracket } from './MobileBracket';

interface KnockoutBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  activePhase: KnockoutPhase;
}

/**
 * Responsive knockout bracket wrapper.
 * Desktop (>=768px): converging 9-column grid with SVG connectors.
 * Mobile (<768px): horizontal scroll-snap with one slide per round.
 *
 * Uses CSS display switching (hidden/block) to avoid useMediaQuery
 * hydration mismatches. Both components render in the DOM; one is
 * hidden via display: none. Match data is identical for both, so
 * the duplication cost is negligible.
 */
export function KnockoutBracket({
  matches,
  thirdPlaceMatch,
  locale,
  activePhase,
}: KnockoutBracketProps) {
  return (
    <>
      <div className="hidden md:block">
        <DesktopBracket matches={matches} thirdPlaceMatch={thirdPlaceMatch} locale={locale} />
      </div>
      <div className="block md:hidden">
        <MobileBracket
          matches={matches}
          thirdPlaceMatch={thirdPlaceMatch}
          locale={locale}
          activePhase={activePhase}
        />
      </div>
    </>
  );
}
