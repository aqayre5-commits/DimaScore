'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

/** Convert ISO 3166-1 alpha-2 country code to flag emoji. */
function countryFlag(code: string | null): string | null {
  if (!code || code.length !== 2) return null;
  const cp1 = 0x1f1e6 + code.toUpperCase().charCodeAt(0) - 65;
  const cp2 = 0x1f1e6 + code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(cp1, cp2);
}

interface LeaguePageHeaderProps {
  competition: CompetitionRecord;
  seasonYear: number;
  locale: Locale;
  countryName: string | null;
  introText: string | null;
  availableSeasons: { year: number; isCurrent: boolean }[];
  teamsCount?: number;
  matchesCount?: number;
  totalRounds?: number;
}

function formatSeason(year: number): string {
  const next = (year + 1) % 100;
  return `${year}/${next.toString().padStart(2, '0')}`;
}

function getSeasonSpan(year: number): string {
  const startMonth = 'Aug';
  const endMonth = 'May';
  return `${startMonth} – ${endMonth}`;
}

export function LeaguePageHeader({
  competition,
  seasonYear,
  locale,
  countryName,
  introText,
  availableSeasons,
  teamsCount,
  matchesCount,
  totalRounds,
}: LeaguePageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('leaguePage');
  const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const logoSrc = CURATED_LOGOS[competition.id] ?? competition.logoUrl;
  const needsInvert = DARK_LOGOS.has(competition.id);

  const hasStats =
    (teamsCount && teamsCount > 0) ||
    (matchesCount && matchesCount > 0) ||
    (totalRounds && totalRounds > 0);

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
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-accent-violet/5 via-50% to-accent-violet/20 p-4">
      {/* Decorative watermark logo */}
      {logoSrc && (
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 top-1/2 hidden h-[200px] w-auto -translate-y-1/2 object-contain opacity-[0.06] md:block"
        />
      )}

      <div className="relative flex flex-1 items-start gap-4">
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

        {/* Title + meta + intro + buttons + stats */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold text-text-primary md:text-3xl">
                {name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                {countryName && (
                  <span className="text-sm text-text-tertiary">
                    {countryFlag(competition.countryCode)} {countryName}
                  </span>
                )}
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

      {/* Quick stats strip — full-width bottom row */}
      {hasStats && (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-8 border-t border-border-subtle pt-3">
          {teamsCount != null && teamsCount > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold tabular-nums text-text-primary">{teamsCount}</span>
              <span className="text-xs text-text-tertiary">{t('teamsCount')}</span>
            </div>
          )}
          {matchesCount != null && matchesCount > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold tabular-nums text-text-primary">
                {matchesCount}
              </span>
              <span className="text-xs text-text-tertiary">{t('matchesCount')}</span>
            </div>
          )}
          {totalRounds != null && totalRounds > 0 && (
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold tabular-nums text-text-primary">
                {totalRounds}
              </span>
              <span className="text-xs text-text-tertiary">{t('roundsCount')}</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-text-primary">{getSeasonSpan(seasonYear)}</span>
            <span className="text-xs text-text-tertiary">{t('seasonSpan')}</span>
          </div>
        </div>
      )}
    </div>
  );
}
