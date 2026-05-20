'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { CompetitionRecord } from '@/lib/db/queries/league';

interface LeaguePageHeaderProps {
  competition: CompetitionRecord;
  seasonYear: number;
  locale: Locale;
  countryName: string | null;
  introText: string | null;
  availableSeasons: { year: number; isCurrent: boolean }[];
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
  availableSeasons,
}: LeaguePageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value;
    const currentSeason = availableSeasons.find((s) => s.isCurrent);
    if (currentSeason && Number(year) === currentSeason.year) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?season=${year}`);
    }
  }

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
          <h1 className="font-display text-2xl font-semibold text-text-primary">{name}</h1>
          <div className="mt-0.5 flex items-center gap-2">
            {countryName && <span className="text-sm text-text-tertiary">{countryName}</span>}
            {countryName && availableSeasons.length > 1 && (
              <span className="text-text-tertiary">·</span>
            )}
            {availableSeasons.length > 1 ? (
              <select
                value={seasonYear}
                onChange={handleSeasonChange}
                className="rounded-md border border-border-subtle bg-bg-surface px-2 py-0.5 text-sm font-medium text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {availableSeasons.map((s) => (
                  <option key={s.year} value={s.year}>
                    {formatSeason(s.year)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-text-secondary">
                {formatSeason(seasonYear)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Intro paragraph */}
      {introText && (
        <p className="max-w-[720px] text-sm leading-relaxed text-text-secondary">{introText}</p>
      )}
    </div>
  );
}
