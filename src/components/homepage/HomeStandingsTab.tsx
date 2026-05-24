import { StandingsWidget } from './StandingsWidget';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface LeagueStandingsData {
  compId: number;
  countryKey: string;
  slug: Record<Locale, string>;
  heading: string;
  rows: StandingRow[];
}

interface HomeStandingsTabProps {
  leagues: LeagueStandingsData[];
  locale: Locale;
  labels: {
    viewAll: string;
    rank: string;
    team: string;
    played: string;
    points: string;
  };
}

export function HomeStandingsTab({ leagues, locale, labels }: HomeStandingsTabProps) {
  const nonEmpty = leagues.filter((l) => l.rows.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">—</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nonEmpty.map((league) => (
        <StandingsWidget
          key={league.compId}
          heading={league.heading}
          rows={league.rows}
          viewAllHref={`/${locale}/competition/${getCountrySlug(league.countryKey, locale)}/${league.slug[locale]}`}
          viewAllLabel={labels.viewAll}
          locale={locale}
          rankLabel={labels.rank}
          teamLabel={labels.team}
          playedLabel={labels.played}
          pointsLabel={labels.points}
        />
      ))}
    </div>
  );
}
