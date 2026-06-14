import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { StandingRow } from '@/lib/db/queries';
import type { LeagueCoverageRecord, TopPlayerRow } from '@/lib/db/queries/league';
import { TopScorersWidget } from './TopScorersWidget';
import { TopAssistsWidget } from './TopAssistsWidget';

interface RightRailProps {
  metadata: CupMetadata;
  standings: StandingRow[];
  locale: Locale;
  tournamentName: string;
  coverage: LeagueCoverageRecord | null;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
}

/**
 * Right rail composition — widgets stacked.
 * Widget order: Top Scorers → Top Assists. Each is coverage-gated (Rule 12): a card only renders
 * when API-Football provides that stat for the competition; before data lands it shows a placeholder.
 */
export function RightRail({ locale, coverage, topScorers, topAssists }: RightRailProps) {
  return (
    <div className="space-y-4">
      {coverage?.topScorers && <TopScorersWidget players={topScorers} locale={locale} />}
      {coverage?.topAssists && <TopAssistsWidget players={topAssists} locale={locale} />}
    </div>
  );
}
