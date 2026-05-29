import type { ReactNode } from 'react';
import Image from 'next/image';
import { Users, Trophy, LayoutGrid, MapPin, Flag } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import { codeToFlag } from '@/lib/flags';
import { EditionSelector } from './EditionSelector';
import { StatusDescriptor, type TournamentPhase } from './StatusDescriptor';
import { MoroccoContextLine } from './MoroccoContextLine';

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
  breadcrumb?: ReactNode;
}

/**
 * Page header for cup/tournament pages (~210-240px).
 * Per competition-cup.md Section 5.
 *
 * Sub-zones:
 *   A — Identity: confederation emoji + H1 + descriptor
 *   B — Edition selector (right)
 *   C — Status descriptor
 *   D — Morocco context line
 *   + Intro paragraph below
 */
export function TournamentPageHeader({
  metadata,
  locale,
  pageTitle,
  introText,
  tournamentPhase,
  moroccoGroup,
  breadcrumb,
}: TournamentPageHeaderProps) {
  const isWC = metadata.competitionId === 1;

  if (isWC) {
    return (
      <WCPageHeader
        metadata={metadata}
        locale={locale}
        pageTitle={pageTitle}
        introText={introText}
        breadcrumb={breadcrumb}
      />
    );
  }

  // Default cup header (WAFCON, AFCON, etc.)
  const hostFlags = metadata.hostCountryCodes.map((c) => codeToFlag(c)).join(' ');
  const teamsLabel =
    locale === 'ar' ? `${metadata.teamsCount} منتخباً` : `${metadata.teamsCount} nations`;
  return (
    <div>
      {breadcrumb}

      <div className="mt-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
        <div className="flex items-start gap-4">
          {/* Title + meta + intro */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold leading-tight text-text-primary md:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 max-w-prose text-sm text-text-secondary">
                  {hostFlags} FIFA · {teamsLabel}
                </p>
              </div>
              <div className="shrink-0 pt-1">
                <EditionSelector currentYear={metadata.editionYear} />
              </div>
            </div>

            <p className="mt-3 max-w-[720px] text-sm leading-relaxed text-text-secondary">
              {introText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** WC 2026 specific hero with blue gradient, stats strip, host nations, date range. */
function WCPageHeader({
  metadata,
  locale,
  pageTitle,
  introText,
  breadcrumb,
}: {
  metadata: CupMetadata;
  locale: Locale;
  pageTitle: string;
  introText: string;
  breadcrumb?: ReactNode;
}) {
  const hostNations = metadata.hostCountryCodes
    .map((c) => `${codeToFlag(c)} ${HOST_NAMES[c] ?? c}`)
    .join(' · ');

  const kickoff = new Date(metadata.kickoffDate);
  const final = new Date(metadata.finalDate);
  const dateRange = `${kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} – ${final.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  // WC 2026: 16 host cities across 3 nations
  const hostCities = 16;

  const stats = [
    { icon: Users, value: metadata.teamsCount, label: 'Teams' },
    { icon: Trophy, value: 104, label: 'Matches' },
    { icon: LayoutGrid, value: metadata.groupsCount ?? metadata.groups.length, label: 'Groups' },
    { icon: MapPin, value: hostCities, label: 'Host Cities' },
    { icon: Flag, value: metadata.hostCountryCodes.length, label: 'Host Nations' },
  ];

  return (
    <div className={breadcrumb ? '' : 'h-full'}>
      {breadcrumb}

      <div
        className={`relative flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15 p-4${breadcrumb ? ' mt-3' : ' h-full'}`}
      >
        {/* Watermark trophy */}
        <div className="relative flex flex-1 items-stretch gap-5">
          {/* Trophy logo */}
          <Image
            src="/competitions/wc-2026-trophy.png"
            alt=""
            width={200}
            height={308}
            className="hidden h-[200px] w-auto shrink-0 self-start drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:block"
            priority
          />
          <Image
            src="/competitions/wc-2026-trophy.png"
            alt=""
            width={140}
            height={216}
            className="h-[140px] w-auto shrink-0 self-start drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:hidden"
            priority
          />

          {/* Title + meta + stats — height matches trophy */}
          <div className="flex h-[140px] min-w-0 flex-1 flex-col md:h-[200px]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-text-primary md:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 text-sm text-text-secondary">{hostNations}</p>
                <p className="mt-0.5 text-sm text-text-tertiary">{dateRange}</p>
              </div>
              {/* Edition badge */}
              <span className="shrink-0 rounded-md bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                Edition: {metadata.editionYear}
              </span>
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
