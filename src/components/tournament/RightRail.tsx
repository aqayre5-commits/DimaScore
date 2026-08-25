import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { StandingRow } from '@/lib/db/queries';
import type { LeagueCoverageRecord, TopPlayerRow } from '@/lib/db/queries/league';
import { RankedPlayersList } from './RankedPlayersList';

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
 * Right rail composition — widgets stacked (Top Scorers → Top Assists).
 * Cup scorer/assist lists are derived from match events (always available when goals exist), not the
 * optional aggregate `/topscorers` feed — so they are gated on data presence, not the coverage flag.
 */
export function RightRail({ locale, topScorers, topAssists }: RightRailProps) {
  return (
    <div className="space-y-4">
      {topScorers.length > 0 && (
        <RankedPlayersList players={topScorers} locale={locale} stat="goals" />
      )}
      {topAssists.length > 0 && (
        <RankedPlayersList players={topAssists} locale={locale} stat="assists" />
      )}
    </div>
  );
}
