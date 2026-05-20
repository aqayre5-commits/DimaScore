import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface CupFixturesByRoundProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

/**
 * All cup fixtures grouped by round name, sorted chronologically
 * (earliest round first). Works for group stage + knockout.
 */
export function CupFixturesByRound({ fixtures, locale }: CupFixturesByRoundProps) {
  const t = useTranslations('tournament');

  if (fixtures.length === 0) {
    return <p className="py-8 text-center text-sm text-text-tertiary">{t('noMatches')}</p>;
  }

  // Group by round name
  const byRound = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    const round = f.round ?? 'Unknown';
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(f);
  }

  // Sort rounds by earliest kickoff in each group
  const sortedRounds = [...byRound.entries()].sort(([, a], [, b]) => {
    const aMin = Math.min(...a.map((f) => f.kickoffAt.getTime()));
    const bMin = Math.min(...b.map((f) => f.kickoffAt.getTime()));
    return aMin - bMin;
  });

  return (
    <div className="space-y-6">
      {sortedRounds.map(([round, roundFixtures]) => (
        <div key={round}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {round}
          </h3>
          <div className="divide-y divide-border-default rounded-lg border border-border-default bg-bg-surface-1">
            {roundFixtures.map((f) => (
              <div key={f.id} className="px-3">
                <FixtureRow
                  fixtureId={f.id}
                  kickoffAt={f.kickoffAt}
                  statusCode={f.statusCode}
                  homeTeam={f.homeTeam}
                  awayTeam={f.awayTeam}
                  homeScore={f.homeScore}
                  awayScore={f.awayScore}
                  locale={locale}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
