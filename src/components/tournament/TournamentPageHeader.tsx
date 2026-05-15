import type { ReactNode } from 'react';
import type { Locale } from '@/lib/i18n/config';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import { codeToFlag } from '@/lib/flags';
import { EditionSelector } from './EditionSelector';
import { StatusDescriptor, type TournamentPhase } from './StatusDescriptor';
import { MoroccoContextLine } from './MoroccoContextLine';

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
  breadcrumb: ReactNode;
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
  const hostFlags = metadata.hostCountryCodes.map((c) => codeToFlag(c)).join(' ');
  const confederationLabel = metadata.competitionId === 1 ? 'FIFA' : 'FIFA';
  const teamsLabel =
    locale === 'ar'
      ? `${metadata.teamsCount} منتخباً`
      : locale === 'en'
        ? `${metadata.teamsCount} nations`
        : `${metadata.teamsCount} nations`;

  return (
    <div>
      {breadcrumb}

      <div className="px-0 py-6">
        {/* Row: Identity (left) + Edition selector (right) */}
        <div className="flex items-start justify-between gap-4">
          {/* Sub-zone A: Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="text-[32px] font-semibold leading-tight text-text-primary">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {hostFlags} {confederationLabel} · {teamsLabel}
            </p>
          </div>

          {/* Sub-zone B: Edition selector */}
          <div className="shrink-0 pt-1">
            <EditionSelector currentYear={metadata.editionYear} />
          </div>
        </div>

        {/* Intro paragraph */}
        <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-text-secondary">
          {introText}
        </p>
      </div>
    </div>
  );
}
