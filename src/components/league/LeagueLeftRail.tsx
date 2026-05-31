'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  ALL_ENTRIES,
  MEGA_MENU_SECTIONS,
  buildCompetitionHref,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import type { Locale } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LeagueLeftRailProps {
  locale: Locale;
  activeCompetitionId?: number;
  competitionLogos?: Record<number, string | null>;
}

/** Primary sections shown by default (matches homepage left rail). */
const PRIMARY_SECTION_IDS: { labelKey: string; ids: number[] }[] = [
  { labelKey: 'morocco', ids: [200, 201, 822] },
  { labelKey: 'tournaments', ids: [1, 922, 6] },
  { labelKey: 'topLeagues', ids: [39, 140, 78, 135, 61] },
  { labelKey: 'cupsAndContinental', ids: [2, 3, 848] },
];

const PRIMARY_IDS = new Set(PRIMARY_SECTION_IDS.flatMap((s) => s.ids));

/** Remaining mega menu sections shown when "View all" is expanded. */
const EXTRA_SECTIONS = MEGA_MENU_SECTIONS.filter((s) =>
  s.entries.some((e) => !PRIMARY_IDS.has(e.competitionId)),
);

function findEntry(id: number): MegaMenuEntry | undefined {
  return ALL_ENTRIES.find((e) => e.competitionId === id);
}

export function LeagueLeftRail({
  locale,
  activeCompetitionId,
  competitionLogos,
}: LeagueLeftRailProps) {
  const t = useTranslations('megaMenu');
  const tC = useTranslations('competition');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <nav>
        {PRIMARY_SECTION_IDS.map((section) => (
          <div key={section.labelKey}>
            <div className="px-4 py-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t(section.labelKey)}
              </h2>
            </div>
            {section.ids.map((id) => {
              const entry = findEntry(id);
              if (!entry) return null;
              const logoUrl =
                id === 1 ? '/competitions/wc-2026-trophy.png' : (competitionLogos?.[id] ?? null);
              return (
                <CompLink
                  key={`${id}-${entry.labelKey}`}
                  entry={entry}
                  locale={locale}
                  isActive={id === activeCompetitionId}
                  logoUrl={logoUrl}
                  label={tC(entry.labelKey)}
                />
              );
            })}
          </div>
        ))}

        {/* Expanded extra sections */}
        {expanded &&
          EXTRA_SECTIONS.map((section) => (
            <div key={section.titleKey}>
              <div className="px-4 py-2">
                <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                  {t(section.titleKey)}
                </h2>
              </div>
              {section.entries.map((entry) => {
                const logoUrl =
                  entry.competitionId === 1
                    ? '/competitions/wc-2026-trophy.png'
                    : (competitionLogos?.[entry.competitionId] ?? null);
                return (
                  <CompLink
                    key={`${entry.competitionId}-${entry.labelKey}`}
                    entry={entry}
                    locale={locale}
                    isActive={entry.competitionId === activeCompetitionId}
                    logoUrl={logoUrl}
                    label={tC(entry.labelKey)}
                  />
                );
              })}
            </div>
          ))}
      </nav>

      {/* View all competitions toggle */}
      <div className="border-t border-border-subtle">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
        >
          {tC('viewAllCompetitions')}
          {expanded ? (
            <ChevronDown className="size-3.5 rotate-180 transition-transform" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

function CompLink({
  entry,
  locale,
  isActive,
  logoUrl,
  label,
}: {
  entry: MegaMenuEntry;
  locale: Locale;
  isActive: boolean;
  logoUrl: string | null;
  label: string;
}) {
  return (
    <Link
      href={buildCompetitionHref(entry, locale)}
      className={cn(
        'flex items-center gap-3 px-4 py-2 transition-colors hover:bg-accent-azure/5 hover:text-accent-azure',
        isActive
          ? 'border-l-2 border-accent-azure bg-accent-azure/10'
          : 'border-l-2 border-transparent',
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
        />
      ) : (
        <div className="flex size-5 items-center justify-center rounded bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
          {label.slice(0, 2)}
        </div>
      )}
      <p
        className={cn(
          'min-w-0 flex-1 truncate text-sm',
          isActive ? 'font-semibold text-accent-azure' : 'text-text-primary',
        )}
      >
        {label}
      </p>
    </Link>
  );
}
