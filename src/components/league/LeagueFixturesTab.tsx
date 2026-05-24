import type { FixtureWithTeams } from '@/lib/db/queries';
import type { RoundInfo } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { LeagueFixturesCard } from './LeagueFixturesCard';

interface LeagueFixturesTabProps {
  fixtures: FixtureWithTeams[];
  rounds: RoundInfo[];
  defaultRound: number;
  locale: Locale;
}

export function LeagueFixturesTab({
  fixtures,
  rounds,
  defaultRound,
  locale,
}: LeagueFixturesTabProps) {
  if (rounds.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">No fixtures available.</p>
      </div>
    );
  }

  return (
    <LeagueFixturesCard
      fixtures={fixtures}
      rounds={rounds}
      defaultRound={defaultRound}
      locale={locale}
    />
  );
}
