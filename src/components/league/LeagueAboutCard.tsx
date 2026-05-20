import type { CompetitionRecord } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { getLeagueCountryName } from '@/lib/constants/league-content';

interface LeagueAboutCardProps {
  competition: CompetitionRecord;
  seasonYear: number;
  locale: Locale;
}

function formatSeason(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, '0')}`;
}

export function LeagueAboutCard({ competition, seasonYear, locale }: LeagueAboutCardProps) {
  const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const countryName = getLeagueCountryName(competition.countryCode, locale);

  const rows: { label: string; value: string }[] = [
    { label: 'Competition', value: name },
    { label: 'Type', value: competition.type },
    { label: 'Season', value: formatSeason(seasonYear) },
  ];

  if (countryName) {
    rows.push({ label: 'Country', value: countryName });
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">About</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-text-tertiary">{row.label}</span>
            <span className="text-sm font-medium text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
