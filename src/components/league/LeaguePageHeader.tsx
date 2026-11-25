'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, CalendarDays, LayoutGrid } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { formatSeason } from '@/lib/utils/date';
import type { CompetitionRecord } from '@/lib/db/queries/league';
import Image from 'next/image';
import { arabicCompetitionName } from '@/lib/i18n/localized-names';
import { CURATED_LOGOS, DARK_LOGOS, countryFlag } from '@/lib/competitions/artwork';

interface LeaguePageHeaderProps {
  competition: CompetitionRecord;
  /** Localized display name (H1). Falls back to the stored provider name. */
  displayName?: string;
  seasonYear: number;
  locale: Locale;
  countryName: string | null;
  introText: string | null;
  availableSeasons: { year: number; isCurrent: boolean }[];
  /** Live current season — picker navigates to the base URL for this year. */
  currentSeasonYear?: number | null;
  teamsCount?: number;
  matchesCount?: number;
  totalRounds?: number;
  currentRound?: number | null;
}

export function LeaguePageHeader({
  competition,
  displayName,
  seasonYear,
  locale,
  countryName,
  introText,
  availableSeasons,
  currentSeasonYear,
  teamsCount,
  matchesCount,
  totalRounds,
  currentRound,
}: LeaguePageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('leaguePage');
  const name =
    displayName ??
    arabicCompetitionName(competition, locale) ??
    competition.name[locale] ??
    competition.name['en'] ??
    competition.slug;
  const logoSrc = CURATED_LOGOS[competition.id] ?? competition.logoUrl;
  const needsInvert = DARK_LOGOS.has(competition.id);

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value;
    const currentYear = currentSeasonYear ?? availableSeasons.find((s) => s.isCurrent)?.year;
    // Strip any trailing /YYYY season segment to get the base competition path.
    const basePath = pathname.replace(/\/\d{4}$/, '');
    if (currentYear != null && Number(year) === currentYear) {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${year}`);
    }
  }

  const stats = [
    ...(teamsCount && teamsCount > 0
      ? [{ icon: Users, value: teamsCount, label: t('teamsCount') }]
      : []),
    ...(matchesCount && matchesCount > 0
      ? [{ icon: CalendarDays, value: matchesCount, label: t('matchesCount') }]
      : []),
    ...(totalRounds && totalRounds > 0
      ? [
          {
            icon: LayoutGrid,
            value:
              currentRound && currentRound < totalRounds
                ? `${currentRound}/${totalRounds}`
                : totalRounds,
            label: t('roundsCount'),
          },
        ]
      : []),
  ];

  // Show only the last 3 seasons in the selector (consistent depth, no stray-year artifacts). Data
  // for older seasons still resolves by URL — the active season is kept in the list so its own page
  // never loses its selector entry.
  const sortedSeasons = [...availableSeasons].sort((a, b) => b.year - a.year);
  const shownSeasons = (() => {
    const top = sortedSeasons.slice(0, 3);
    if (top.some((s) => s.year === seasonYear)) return top;
    const active = sortedSeasons.find((s) => s.year === seasonYear);
    return active ? [...top, active].sort((a, b) => b.year - a.year) : top;
  })();

  // Season control — top-right on desktop; on its own line under the meta on mobile (so it doesn't
  // collide with the title).
  const seasonControl =
    shownSeasons.length > 1 ? (
      <select
        value={seasonYear}
        onChange={handleSeasonChange}
        className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {shownSeasons.map((s) => (
          <option key={s.year} value={s.year}>
            {formatSeason(s.year)}
          </option>
        ))}
      </select>
    ) : (
      <span className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure">
        {formatSeason(seasonYear)}
      </span>
    );

  return (
    <div className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15 p-2 md:min-h-[180px]">
        <div className="relative flex flex-1 items-stretch gap-5">
          {/* Logo — one responsive image; fills the card height on the left and drives the mobile
              height, width-capped so square crests stay sensible. Keeps dark-logo inversion. */}
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt=""
              width={96}
              height={96}
              sizes="(min-width: 768px) 200px, 40vw"
              className={`h-[120px] w-auto max-w-[36%] shrink-0 self-end object-contain object-bottom md:h-full md:max-h-[160px] md:max-w-[200px]${needsInvert ? ' logo-invert' : ''}`}
              priority
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center self-end rounded-lg bg-bg-surface-2 md:size-32">
              <span className="text-4xl">🏆</span>
            </div>
          )}

          {/* Title + meta + stats */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-lg font-semibold text-text-primary md:text-3xl">
                  {name} <span className="text-text-secondary">{formatSeason(seasonYear)}</span>
                </h1>
                <div className="mt-1.5 flex items-center gap-2">
                  {countryName && (
                    <span className="text-sm text-text-secondary md:text-base">
                      <span className="text-base md:text-lg">
                        {countryFlag(competition.countryCode)}
                      </span>{' '}
                      {countryName}
                    </span>
                  )}
                </div>
                {/* Mobile: season selector on its own line (clears the title) */}
                <div className="mt-2 md:hidden">{seasonControl}</div>
              </div>
              {/* Desktop: season selector top-right */}
              <div className="hidden md:block">{seasonControl}</div>
            </div>

            {/* Stats — desktop only (hidden on mobile); bordered pill row pushed to bottom */}
            {stats.length > 0 && (
              <div className="mt-auto hidden flex-wrap gap-3 md:flex">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5"
                  >
                    <div className="flex items-center gap-1">
                      <s.icon className="size-3.5 text-accent-azure" />
                      <span className="text-sm font-bold tabular-nums text-text-primary">
                        {s.value}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
