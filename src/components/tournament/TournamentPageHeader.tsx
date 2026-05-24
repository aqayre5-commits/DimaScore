import type { ReactNode } from 'react';
import Image from 'next/image';
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

      <div className="mt-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          {metadata.competitionId === 1 && (
            <Image
              src="/competitions/wc-2026-trophy.png"
              alt=""
              width={128}
              height={197}
              className="hidden h-[128px] w-auto shrink-0 drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:block"
              priority
            />
          )}
          {metadata.competitionId === 1 && (
            <Image
              src="/competitions/wc-2026-trophy.png"
              alt=""
              width={96}
              height={148}
              className="h-[96px] w-auto shrink-0 drop-shadow-[0_2px_8px_rgba(30,58,138,0.15)] md:hidden"
              priority
            />
          )}

          {/* Title + meta + intro */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold leading-tight text-text-primary md:text-3xl">
                  {pageTitle}
                </h1>
                <p className="mt-1 max-w-prose text-sm text-text-secondary">
                  {hostFlags} {confederationLabel} · {teamsLabel}
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
