import { db } from '@/lib/db/client';
import { getTopMatches } from '@/lib/db/queries/top-matches';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface EditorialCardsProps {
  locale: Locale;
}

export async function EditorialCards({ locale }: EditorialCardsProps) {
  const matches = await getTopMatches(db, 2);

  if (matches.length === 0) return null;

  // Map TopMatch → FixtureWithTeams shape expected by FeaturedMatchCard
  const fixtures: FixtureWithTeams[] = matches.map((m) => ({
    id: m.id,
    round: null,
    roundNumber: null,
    kickoffAt: m.kickoffAt,
    statusCode: m.statusCode,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeScoreHt: null,
    awayScoreHt: null,
    venueId: null,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    venue: null,
  }));

  return (
    <div className="grid grid-cols-1 gap-3 self-start">
      {fixtures.map((fixture, i) => (
        <FeaturedMatchCard
          key={fixture.id}
          fixture={fixture}
          locale={locale}
          cardTitle=""
          shareHash={`homepage-featured-${i + 1}`}
        />
      ))}
    </div>
  );
}
