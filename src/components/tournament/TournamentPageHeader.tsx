'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Trophy, LayoutGrid, Flag } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import { codeToFlag } from '@/lib/flags';
import { type TournamentPhase } from './StatusDescriptor';

/** Curated hero logos per competition (displayed in header like WC trophy). */
const CUP_LOGOS: Record<number, string> = {
  1: '/competitions/wc-2026-trophy.png',
  6: '/competitions/afcon-trophy.svg',
  922: '/competitions/wafcon-trophy.png',
};

/** Country code → short English name for host nations display. */
const HOST_NAMES: Record<string, string> = {
  US: 'USA',
  CA: 'Canada',
  MX: 'Mexico',
  MA: 'Morocco',
  QA: 'Qatar',
  ZA: 'South Africa',
  BR: 'Brazil',
  RU: 'Russia',
  FR: 'France',
  DE: 'Germany',
  CI: 'Ivory Coast',
  CM: 'Cameroon',
  EG: 'Egypt',
  GA: 'Gabon',
  GH: 'Ghana',
};

interface RivalTeam {
  code: string;
  name: Record<string, string>;
}

interface TournamentPageHeaderProps {
  metadata: CupMetadata;
  locale: Locale;
  pageTitle: string;
  /** Optional shorter title shown on mobile (sm:hidden). Falls back to pageTitle. */
  pageTitleShort?: string;
  introText: string;
  tournamentPhase: TournamentPhase;
  moroccoGroup: { label: string; rivals: RivalTeam[] } | null;
  orgName?: string;
  matchesCount?: number;
  availableSeasons?: { year: number; isCurrent: boolean }[];
  seasonYear?: number;
}

/**
 * Page header for cup/tournament pages.
 * All cups share the same visual structure: gradient, stats pills, date range.
 * WC additionally shows a trophy image.
 */
export function TournamentPageHeader({
  metadata,
  locale,
  pageTitle,
  pageTitleShort,
  introText,
  tournamentPhase,
  moroccoGroup,
  matchesCount,
  availableSeasons,
  seasonYear,
}: TournamentPageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const displayYear = seasonYear ?? metadata.editionYear;
  // Display-only: remap the shown year (e.g. WAFCON DB season 2025 → brand year 2026).
  // Routing and <option value> keep using the real DB year.
  const labelYear = (y: number) => metadata.seasonLabelOverrides?.[y] ?? y;

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value;
    const currentSeason = availableSeasons?.find((s) => s.isCurrent);
    // Strip any trailing /YYYY season segment to get the base competition path.
    const basePath = pathname.replace(/\/\d{4}$/, '');
    if (currentSeason && Number(year) === currentSeason.year) {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${year}`);
    }
  }

  // Desktop shows flags + country names; mobile shows just the flags (a bit larger). No org label.
  const hostNations = metadata.hostCountryCodes
    .map((c) => `${codeToFlag(c)} ${HOST_NAMES[c] ?? c}`)
    .join(' · ');
  const hostFlags = metadata.hostCountryCodes.map((c) => codeToFlag(c)).join(' ');

  const kickoff = new Date(metadata.kickoffDate);
  const final = new Date(metadata.finalDate);
  const dateRange = `${kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${final.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const logoSrc = CUP_LOGOS[metadata.competitionId];

  const stats = [
    { icon: Users, value: metadata.teamsCount, label: 'Teams' },
    ...(matchesCount ? [{ icon: Trophy, value: matchesCount, label: 'Matches' }] : []),
    ...(metadata.groupsCount
      ? [{ icon: LayoutGrid, value: metadata.groupsCount, label: 'Groups' }]
      : []),
    ...(metadata.hostCountryCodes.length > 1
      ? [{ icon: Flag, value: metadata.hostCountryCodes.length, label: 'Host Nations' }]
      : []),
  ];

  // Edition/season control — top-right on desktop; on its own line under the meta on mobile, so it
  // doesn't collide with the one-line title.
  const editionControl =
    availableSeasons && availableSeasons.length > 1 ? (
      <select
        value={displayYear}
        onChange={handleSeasonChange}
        className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {availableSeasons.map((s) => (
          <option key={s.year} value={s.year}>
            Edition: {labelYear(s.year)}
          </option>
        ))}
      </select>
    ) : (
      <span className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure">
        Edition: {labelYear(displayYear)}
      </span>
    );

  return (
    <div className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15 p-2">
        <div className="relative flex flex-1 items-stretch gap-5">
          {/* Competition logo — one responsive image, kept large and bottom-anchored at every
              size (no mobile shrink); width-capped on mobile so the title/flags aren't squeezed. */}
          {logoSrc && (
            <Image
              src={logoSrc}
              alt=""
              width={200}
              height={200}
              sizes="(min-width: 768px) 200px, 42vw"
              className="h-[200px] w-auto max-w-[42%] shrink-0 self-end object-contain object-bottom drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:h-full md:max-h-[160px] md:max-w-none"
              priority
            />
          )}

          {/* Title + meta + stats */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display whitespace-nowrap text-lg font-semibold text-text-primary md:whitespace-normal md:text-3xl">
                  <span className="hidden md:inline">{pageTitle}</span>
                  <span className="md:hidden">{pageTitleShort ?? pageTitle}</span>
                </h1>
                {/* Mobile: host flags only (larger). Desktop: flags + country names. */}
                <p className="mt-1 text-text-secondary">
                  <span className="text-lg md:hidden">{hostFlags}</span>
                  <span className="hidden text-sm md:inline">{hostNations}</span>
                </p>
                <p
                  className="mt-0.5 whitespace-nowrap text-sm text-text-tertiary"
                  suppressHydrationWarning
                >
                  {dateRange}
                </p>
                {/* Mobile: edition control on its own line (clears the one-line title) */}
                <div className="mt-2 md:hidden">{editionControl}</div>
              </div>
              {/* Desktop: edition control top-right */}
              <div className="hidden md:block">{editionControl}</div>
            </div>

            {/* Stats — desktop only (hidden on mobile); bordered pill row pushed to bottom */}
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
          </div>
        </div>
      </div>
    </div>
  );
}
