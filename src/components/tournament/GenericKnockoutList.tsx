import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface GenericKnockoutListProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

/** Round display order: R128 → R64 → R32 → R16 → QF → SF → 3rd → Final. */
const ROUND_ORDER: Record<string, number> = {
  'Round of 128': 1,
  'Round of 64': 2,
  'Round of 32': 3,
  'Round of 16': 4,
  'Quarter-finals': 5,
  'Semi-finals': 6,
  'Semi-Finals': 6,
  '3rd Place Final': 7,
  '3rd place': 7,
  Final: 8,
};

const ROUND_LABEL_KEYS: Record<string, string> = {
  'Round of 128': 'roundOf128',
  'Round of 64': 'roundOf64',
  'Round of 32': 'roundOf32',
  'Round of 16': 'roundOf16',
  'Quarter-finals': 'quarterFinals',
  'Semi-finals': 'semiFinals',
  'Semi-Finals': 'semiFinals',
  '3rd Place Final': 'thirdPlace',
  '3rd place': 'thirdPlace',
  Final: 'finalMatch',
};

/**
 * Generic knockout fixture list for cups without a custom bracket builder.
 * Groups fixtures by round (QF → SF → 3rd → Final) and renders
 * each as a FixtureRow card.
 */
export function GenericKnockoutList({ fixtures, locale }: GenericKnockoutListProps) {
  const t = useTranslations('tournament');

  if (fixtures.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-tertiary">{t('noDataPreTournament')}</p>
    );
  }

  // Group by round name
  const byRound = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    const round = f.round ?? t('unknownRound');
    if (!byRound.has(round)) byRound.set(round, []);
    byRound.get(round)!.push(f);
  }

  // Sort rounds by known order, unknown rounds go last
  const sortedRounds = [...byRound.entries()].sort(
    ([a], [b]) => (ROUND_ORDER[a] ?? 99) - (ROUND_ORDER[b] ?? 99),
  );

  return (
    <div className="space-y-6">
      {sortedRounds.map(([round, roundFixtures]) => (
        <div key={round}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            {ROUND_LABEL_KEYS[round] ? t(ROUND_LABEL_KEYS[round] as never) : round}
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
