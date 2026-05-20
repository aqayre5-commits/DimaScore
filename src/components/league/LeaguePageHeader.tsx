import type { Locale } from '@/lib/i18n/config';
import type { CompetitionRecord } from '@/lib/db/queries/league';

interface LeaguePageHeaderProps {
  competition: CompetitionRecord;
  seasonYear: number;
  locale: Locale;
  countryName: string | null;
  introText: string | null;
}

function formatSeason(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, '0')}`;
}

export function LeaguePageHeader({
  competition,
  seasonYear,
  locale,
  countryName,
  introText,
}: LeaguePageHeaderProps) {
  const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const season = formatSeason(seasonYear);

  return (
    <div className="space-y-3">
      {/* Identity row */}
      <div className="flex items-center gap-4">
        {competition.logoUrl ? (
          <img
            src={competition.logoUrl}
            alt=""
            className="size-16 rounded-lg object-contain"
            loading="eager"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-lg bg-bg-surface-2">
            <span className="text-2xl">🏆</span>
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {name} {season}
          </h1>
          {countryName && <p className="text-sm text-text-tertiary">{countryName}</p>}
        </div>
      </div>

      {/* Intro paragraph */}
      {introText && (
        <p className="max-w-[720px] text-sm leading-relaxed text-text-secondary">{introText}</p>
      )}
    </div>
  );
}
