import { MiniStandingsPreview } from './MiniStandingsPreview';
import { HistoricalWinners } from './HistoricalWinners';
import { RelatedCompetitions } from './RelatedCompetitions';
import { FactsPanel } from './FactsPanel';
import { CupFixturesByRound } from './CupFixturesByRound';
import { WCFixturesTab } from './WCFixturesTab';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';

interface OverviewTabProps {
  fixtures: FixtureWithTeams[];
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
  fixtures,
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

  // Build team → group mapping from standings
  const teamGroupMap: Record<number, string> = {};
  for (const s of standings) {
    if (s.teamId != null) teamGroupMap[s.teamId] = s.groupLabel;
  }

  return (
    <div className="space-y-4">
      {fixtures.length > 0 &&
        (metadata.groups.length > 0 ? (
          <WCFixturesTab
            fixtures={fixtures}
            locale={locale}
            groupLabels={groupLabels}
            teamGroupMap={teamGroupMap}
          />
        ) : (
          <CupFixturesByRound fixtures={fixtures} locale={locale} />
        ))}

      {standings.length > 0 && (
        <MiniStandingsPreview
          standings={standings}
          locale={locale}
          defaultGroup={defaultGroup}
          moroccoGroupLabel={moroccoGroup?.label ?? null}
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
