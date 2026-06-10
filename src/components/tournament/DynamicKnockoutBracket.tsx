import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch } from './BracketMatchCell';
import type { BracketGridConfig } from '@/lib/constants/dynamic-bracket-builder';
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
 * Desktop: UCLDesktopBracket (converging bracket with merge connectors).
 * Mobile: horizontal scroll-snap via MobileBracket.
 */
export function DynamicKnockoutBracket({
  matches,
  thirdPlaceMatch,
  locale,
  competitionId,
}: DynamicKnockoutBracketProps) {
  const activePhase =
    matches.find((m) => m.status === 'live' || m.status === 'upcoming')?.phase ??
    matches[matches.length - 1]?.phase ??
    'r16';

  // AFCON (6) uses the polished flag + code + score + status node; other cups keep the default.
  const variant = competitionId === 6 ? 'card' : 'default';

  // AFCON (card variant) shows the same converging tree on every breakpoint — it scrolls
  // horizontally on mobile. Other cups keep the desktop-tree / mobile-slides split.
  if (variant === 'card') {
    return <UCLDesktopBracket matches={matches} locale={locale} variant={variant} />;
  }

  return (
    <>
      <div className="hidden md:block">
        <UCLDesktopBracket matches={matches} locale={locale} variant={variant} />
      </div>
      <div className="block md:hidden">
        <MobileBracket
          matches={matches}
          thirdPlaceMatch={thirdPlaceMatch}
          locale={locale}
          activePhase={activePhase}
          variant={variant}
        />
      </div>
    </>
  );
}
