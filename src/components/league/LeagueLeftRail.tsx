'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ALL_ENTRIES,
  MEGA_MENU_SECTIONS,
  TOP_NAV_COMPETITION_IDS,
  buildCompetitionHref,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import type { Locale } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

interface LeagueLeftRailProps {
  locale: Locale;
  activeCompetitionId?: number;
}

const TOP_10_IDS = [
  200, // Botola Pro
  39, // Premier League
  140, // LaLiga
  78, // Bundesliga
  135, // Serie A
  61, // Ligue 1
  2, // Champions League
  3, // Europa League
  307, // Saudi Pro League
  233, // Egyptian Premier League
];

function getTop10Entries(): MegaMenuEntry[] {
  return TOP_10_IDS.map((id) => ALL_ENTRIES.find((e) => e.competitionId === id)!).filter(Boolean);
}

export function LeagueLeftRail({ locale, activeCompetitionId }: LeagueLeftRailProps) {
  const t = useTranslations('competition');
  const top10 = getTop10Entries();

  return (
    <nav className="space-y-4">
      {/* Top 10 Competitions */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('top10')}
        </h3>
        <ul className="space-y-1">
          {top10.map((entry, i) => {
            const isActive = entry.competitionId === activeCompetitionId;
            return (
              <li key={`${entry.competitionId}-${entry.labelKey}`}>
                <Link
                  href={buildCompetitionHref(entry, locale)}
                  className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-bg-surface-2 font-medium text-text-primary'
                      : 'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary'
                  }`}
                >
                  <span className="w-4 text-center text-xs text-text-tertiary">{i + 1}</span>
                  <span className="truncate">{t(entry.labelKey)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* All Competitions by organisation */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {t('allCompetitions')}
        </h3>
        <div className="space-y-1">
          {MEGA_MENU_SECTIONS.map((section) => (
            <CollapsibleSection
              key={section.titleKey}
              titleKey={section.titleKey}
              entries={section.entries}
              locale={locale}
              activeCompetitionId={activeCompetitionId}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function CollapsibleSection({
  titleKey,
  entries,
  locale,
  activeCompetitionId,
}: {
  titleKey: string;
  entries: MegaMenuEntry[];
  locale: Locale;
  activeCompetitionId?: number;
}) {
  const t = useTranslations('megaMenu');
  const tC = useTranslations('competition');
  const hasActive = entries.some((e) => e.competitionId === activeCompetitionId);
  const [open, setOpen] = useState(hasActive);

  if (entries.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
      >
        <span>{t(titleKey)}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-text-tertiary">{entries.length}</span>
          <ChevronDown
            className={`size-3.5 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      {open && (
        <ul className="ml-2 mt-0.5 space-y-0.5 border-l border-border-subtle pl-3">
          {entries.map((entry) => {
            const isActive = entry.competitionId === activeCompetitionId;
            return (
              <li key={`${entry.competitionId}-${entry.labelKey}`}>
                <Link
                  href={buildCompetitionHref(entry, locale)}
                  className={`block rounded-lg px-2 py-1 text-sm transition-colors ${
                    isActive
                      ? 'font-medium text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tC(entry.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
