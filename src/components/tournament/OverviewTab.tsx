import { OverviewFeaturedPair } from './OverviewFeaturedPair';
import { MiniStandingsPreview } from './MiniStandingsPreview';
import { HistoricalWinners } from './HistoricalWinners';
import { RelatedCompetitions } from './RelatedCompetitions';
import { FactsPanel } from './FactsPanel';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';

interface OverviewTabProps {
  featuredFixtures: FixtureWithTeams[];
  standings: StandingRow[];
  metadata: CupMetadata;
  locale: Locale;
  facts: string[];
  historicalTeamNames: Record<string, string>;
  standingsHash: string;
}

/**
 * Overview tab content — 5-block stack.
 * Per competition-cup.md Section 7 Tab 1.
 */
export function OverviewTab({
  featuredFixtures,
  standings,
  metadata,
  locale,
  facts,
  historicalTeamNames,
  standingsHash,
}: OverviewTabProps) {
  const moroccoGroup = metadata.groups.find((g) => g.isMoroccoGroup);
  const defaultGroup = moroccoGroup?.label ?? metadata.groups[0]?.label ?? 'A';
  const groupLabels = metadata.groups.map((g) => g.label);

  return (
    <div className="space-y-4">
      <OverviewFeaturedPair fixtures={featuredFixtures} locale={locale} />

      {standings.length > 0 && (
        <MiniStandingsPreview
          standings={standings}
          locale={locale}
          defaultGroup={defaultGroup}
          groupLabels={groupLabels}
          standingsHash={standingsHash}
        />
      )}

      <HistoricalWinners
        winners={metadata.historicalWinners}
        teamNames={historicalTeamNames}
        locale={locale}
      />

      <RelatedCompetitions competitionIds={metadata.relatedCompetitionIds} locale={locale} />

      <FactsPanel facts={facts} />
    </div>
  );
}
