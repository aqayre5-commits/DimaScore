import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { StandingRow } from '@/lib/db/queries';
import { TopScorersWidget } from './TopScorersWidget';
import { TopAssistsWidget } from './TopAssistsWidget';

interface RightRailProps {
  metadata: CupMetadata;
  standings: StandingRow[];
  locale: Locale;
  tournamentName: string;
}

/**
 * Right rail composition — widgets stacked.
 * Widget order: Top Scorers → Top Assists.
 */
export function RightRail({ metadata, standings, locale, tournamentName }: RightRailProps) {
  return (
    <div className="space-y-4">
      <TopScorersWidget />
      <TopAssistsWidget />
    </div>
  );
}
