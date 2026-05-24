'use client';

import { useRouter, usePathname } from 'next/navigation';
import type { Locale } from '@/lib/i18n/config';
import type { CompetitionRecord } from '@/lib/db/queries/league';

/** Curated high-res logos override the low-res API-Football PNGs. */
const CURATED_LOGOS: Record<number, string> = {
  39: '/competitions/premier-league.png',
  2: '/competitions/champions-league.svg',
  922: '/competitions/wafcon.png',
};

/** Competition IDs whose API-Football logos are dark artwork that needs
 *  inversion (white) on our dark theme. Curated logos are included. */
const DARK_LOGOS: Set<number> = new Set([
  // Curated replacements (still dark artwork)
  2, // Champions League
  39, // Premier League
  922, // WAFCON
  // API-Football logos with dark/black artwork
  1, // World Cup
  3, // Europa League
  29, // WC Qualifiers Africa
  36, // AFCON Qualifiers
  61, // Ligue 1 (France)
  82, // Frauen Bundesliga
  203, // Süper Lig
  233, // Egyptian Premier League
  525, // UEFA Women's Champions League
  848, // Europa Conference League
  1191, // UEFA Women's Europa Cup
]);

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
  const logoSrc = CURATED_LOGOS[competition.id] ?? competition.logoUrl;
  const needsInvert = DARK_LOGOS.has(competition.id);

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
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
      <div className="flex items-start gap-4">
        {/* Logo */}
        {logoSrc ? (
          <>
            <img
              src={logoSrc}
              alt=""
              className={`hidden h-[128px] w-auto shrink-0 object-contain md:block${needsInvert ? ' logo-invert' : ''}`}
              loading="eager"
            />
            <img
              src={logoSrc}
              alt=""
              className={`h-[96px] w-auto shrink-0 object-contain md:hidden${needsInvert ? ' logo-invert' : ''}`}
              loading="eager"
            />
          </>
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-lg bg-bg-surface-2 md:size-32">
            <span className="text-4xl">🏆</span>
          </div>
        )}

        {/* Title + meta + intro */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-text-primary md:text-3xl">
                {name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
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

          {introText && (
            <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-text-secondary">
              {introText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
