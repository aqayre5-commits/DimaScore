import { FeaturedMatchCard } from './FeaturedMatchCard';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface OverviewFeaturedPairProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

/**
 * Overview Block 1 — two side-by-side featured match cards.
 * Per competition-cup.md Section 7 Tab 1 Block 1.
 * Shows top 2 upcoming fixtures from current/next round.
 */
export function OverviewFeaturedPair({ fixtures, locale }: OverviewFeaturedPairProps) {
  const pair = fixtures.slice(0, 2);
  if (pair.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {pair.map((fixture, i) => (
        <FeaturedMatchCard
          key={fixture.id}
          fixture={fixture}
          locale={locale}
          cardTitle=""
          shareHash={`featured-${i + 1}`}
        />
      ))}
    </div>
  );
}
