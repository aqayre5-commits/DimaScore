import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface MatchesListProps {
  fixtures: FixtureWithTeams[];
  locale: Locale;
}

/**
 * Matches list card — left rail Card 2 for cup/tournament pages.
 * Single chronological list grouped by date headers.
 */
export function MatchesList({ fixtures, locale }: MatchesListProps) {
  const t = useTranslations('tournament');

  const byDate = groupByDate(fixtures);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('matches')}</h3>
      </div>

      <div className="divide-y divide-border-subtle px-4">
        {byDate.map(([dateLabel, dayFixtures]) => (
          <div key={dateLabel}>
            <p className="py-2 text-xs font-medium text-text-secondary">{dateLabel}</p>
            {dayFixtures.map((f) => (
              <FixtureRow
                key={f.id}
                fixtureId={f.id}
                kickoffAt={f.kickoffAt}
                statusCode={f.statusCode}
                homeTeam={f.homeTeam}
                awayTeam={f.awayTeam}
                homeScore={f.homeScore}
                awayScore={f.awayScore}
                homeScorePen={f.homeScorePen}
                awayScorePen={f.awayScorePen}
                locale={locale}
              />
            ))}
          </div>
        ))}
      </div>

      {fixtures.length === 0 && (
        <div className="px-4 py-6 text-center text-xs text-text-tertiary">{t('noMatches')}</div>
      )}
    </div>
  );
}

function groupByDate(fixtures: FixtureWithTeams[]): [string, FixtureWithTeams[]][] {
  const map = new Map<string, FixtureWithTeams[]>();
  for (const f of fixtures) {
    const key = f.kickoffAt.toISOString().slice(0, 10);
    const arr = map.get(key) ?? [];
    arr.push(f);
    map.set(key, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
