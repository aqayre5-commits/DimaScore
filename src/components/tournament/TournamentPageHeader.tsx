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
  introText,
  tournamentPhase,
  moroccoGroup,
  orgName,
  matchesCount,
  availableSeasons,
  seasonYear,
}: TournamentPageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const displayYear = seasonYear ?? metadata.editionYear;

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value;
    const currentSeason = availableSeasons?.find((s) => s.isCurrent);
    if (currentSeason && Number(year) === currentSeason.year) {
      router.push(pathname);
    } else {
      router.push(`${pathname}?season=${year}`);
    }
  }

  const hostNations = metadata.hostCountryCodes
    .map((c) => `${codeToFlag(c)} ${HOST_NAMES[c] ?? c}`)
    .join(' · ');

  const kickoff = new Date(metadata.kickoffDate);
  const final = new Date(metadata.finalDate);
  const dateRange = `${kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${final.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const org = orgName ?? 'FIFA';
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

  return (
    <div className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15 p-2">
        <div className="relative flex flex-1 items-stretch gap-5">
          {/* Competition logo */}
          {logoSrc && (
            <>
              <Image
                src={logoSrc}
                alt=""
                width={200}
                height={200}
                className="hidden h-full max-h-[160px] w-auto shrink-0 object-contain object-bottom drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:block"
                priority
              />
              <Image
                src={logoSrc}
                alt=""
                width={80}
                height={80}
                className="h-[80px] w-auto shrink-0 self-end object-contain drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:hidden"
                priority
              />
            </>
          )}

          {/* Title + meta + stats */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-text-primary md:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 text-sm text-text-secondary">
                  {hostNations} · {org}
                </p>
                <p className="mt-0.5 text-sm text-text-tertiary">{dateRange}</p>
              </div>
              {availableSeasons && availableSeasons.length > 1 ? (
                <select
                  value={displayYear}
                  onChange={handleSeasonChange}
                  className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {availableSeasons.map((s) => (
                    <option key={s.year} value={s.year}>
                      Edition: {s.year}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure">
                  Edition: {displayYear}
                </span>
              )}
            </div>

            {/* Stats — bordered pills, pushed to bottom */}
            <div className="mt-auto flex flex-wrap gap-3">
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
