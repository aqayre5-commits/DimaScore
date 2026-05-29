import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch } from './BracketMatchCell';
import type { BracketGridConfig } from '@/lib/constants/dynamic-bracket-builder';
import { DynamicDesktopBracket } from './DynamicDesktopBracket';
import { UCLDesktopBracket } from './UCLDesktopBracket';
import { MobileBracket } from './MobileBracket';

interface DynamicKnockoutBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  gridConfig: BracketGridConfig;
  competitionId?: number;
}

/**
 * Responsive knockout bracket for generic cups.
 * Desktop: UCLDesktopBracket for Champions League (id=2),
 *          DynamicDesktopBracket for everything else.
 * Mobile: horizontal scroll-snap via MobileBracket.
 */
export function DynamicKnockoutBracket({
  matches,
  thirdPlaceMatch,
  locale,
  gridConfig,
  competitionId,
}: DynamicKnockoutBracketProps) {
  const activePhase =
    matches.find((m) => m.status === 'live' || m.status === 'upcoming')?.phase ??
    matches[matches.length - 1]?.phase ??
    'r16';

  const isUCL = competitionId === 2;

  return (
    <>
      <div className="hidden md:block">
        {isUCL ? (
          <UCLDesktopBracket matches={matches} locale={locale} />
        ) : (
          <DynamicDesktopBracket
            matches={matches}
            thirdPlaceMatch={thirdPlaceMatch}
            locale={locale}
            gridConfig={gridConfig}
          />
        )}
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
