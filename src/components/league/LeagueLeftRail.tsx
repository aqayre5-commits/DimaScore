'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, ChevronDown } from 'lucide-react';
import {
  ALL_ENTRIES,
  buildCompetitionHref,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { getCountryLabel } from '@/lib/constants/country-slugs';
import { codeToFlag } from '@/lib/flags';
import type { Locale } from '@/lib/i18n/config';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface LeagueLeftRailProps {
  locale: Locale;
  activeCompetitionId?: number;
  competitionLogos?: Record<number, string | null>;
}

/** Curated primary sections shown by default (competition ids). */
const PRIMARY_SECTION_IDS: { labelKey: string; ids: number[] }[] = [
  { labelKey: 'morocco', ids: [200, 201, 822] },
  { labelKey: 'tournaments', ids: [1, 922, 6] },
  { labelKey: 'topLeagues', ids: [39, 140, 78, 135, 61] },
  { labelKey: 'cupsAndContinental', ids: [2, 3, 848] },
];

/** Featured national-team quick links. */
const FEATURED_TEAMS: { slug: string; key: string; code: string }[] = [
  { slug: 'morocco-31', key: 'maroc', code: 'MA' },
  { slug: 'france-2', key: 'france', code: 'FR' },
  { slug: 'spain-9', key: 'espagne', code: 'ES' },
  { slug: 'england-10', key: 'angleterre', code: 'GB-ENG' },
  { slug: 'brazil-6', key: 'bresil', code: 'BR' },
  { slug: 'argentina-26', key: 'argentine', code: 'AR' },
];

/** Country display order for the expanded "View all" catalog (unknown keys appended). */
const COUNTRY_ORDER = [
  'maroc',
  'fifa',
  'uefa',
  'caf',
  'angleterre',
  'espagne',
  'italie',
  'allemagne',
  'france',
  'arabie-saoudite',
  'egypte',
  'algerie',
  'tunisie',
  'emirats',
  'turquie',
];

function findEntry(id: number): MegaMenuEntry | undefined {
  return ALL_ENTRIES.find((e) => e.competitionId === id);
}

/** Every competition grouped by country, ordered, for the expanded catalog. */
function countryGroups(): { key: string; entries: MegaMenuEntry[] }[] {
  const byKey = new Map<string, MegaMenuEntry[]>();
  for (const e of ALL_ENTRIES) {
    const arr = byKey.get(e.countryKey) ?? [];
    arr.push(e);
    byKey.set(e.countryKey, arr);
  }
  const ordered = COUNTRY_ORDER.filter((k) => byKey.has(k));
  const rest = [...byKey.keys()].filter((k) => !COUNTRY_ORDER.includes(k)).sort();
  return [...ordered, ...rest].map((key) => ({ key, entries: byKey.get(key)! }));
}

export function LeagueLeftRail({
  locale,
  activeCompetitionId,
  competitionLogos,
}: LeagueLeftRailProps) {
  const t = useTranslations('megaMenu');
  const tC = useTranslations('competition');
  const [expanded, setExpanded] = useState(false);

  const compLogo = (id: number) =>
    id === 1 ? '/competitions/wc-2026-trophy.png' : (competitionLogos?.[id] ?? null);

  const renderComps = (ids: number[]) =>
    ids.map((id) => {
      const entry = findEntry(id);
      return entry ? (
        <CompLink
          key={`${id}-${entry.labelKey}`}
          entry={entry}
          locale={locale}
          isActive={id === activeCompetitionId}
          logoUrl={compLogo(id)}
          label={tC(entry.labelKey)}
        />
      ) : null;
    });

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <nav>
        {/* Morocco */}
        <Section title={t('morocco')}>{renderComps(PRIMARY_SECTION_IDS[0].ids)}</Section>

        {/* Teams (national teams) */}
        <Section title={t('teams')}>
          {FEATURED_TEAMS.map((team) => (
            <TeamLink
              key={team.slug}
              href={`/${locale}/equipe/${team.slug}`}
              flag={codeToFlag(team.code)}
              label={getCountryLabel(team.key, locale)}
            />
          ))}
        </Section>

        {/* Remaining curated sections */}
        {PRIMARY_SECTION_IDS.slice(1).map((section) => (
          <Section key={section.labelKey} title={t(section.labelKey)}>
            {renderComps(section.ids)}
          </Section>
        ))}

        {/* Expanded: the full catalog grouped by country */}
        {expanded &&
          countryGroups().map((group) => (
            <Section key={group.key} title={getCountryLabel(group.key, locale)}>
              {group.entries.map((entry) => (
                <CompLink
                  key={`${entry.competitionId}-${entry.labelKey}`}
                  entry={entry}
                  locale={locale}
                  isActive={entry.competitionId === activeCompetitionId}
                  logoUrl={compLogo(entry.competitionId)}
                  label={tC(entry.labelKey)}
                />
              ))}
            </Section>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="px-4 py-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function TeamLink({ href, flag, label }: { href: string; flag: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-l-2 border-transparent px-4 py-2 transition-colors hover:bg-accent-azure/5 hover:text-accent-azure"
    >
      {flag ? (
        <span className="flex size-5 shrink-0 items-center justify-center text-base leading-none">
          {flag}
        </span>
      ) : (
        <div className="flex size-5 items-center justify-center rounded bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
          {label.slice(0, 2)}
        </div>
      )}
      <p className="min-w-0 flex-1 truncate text-sm text-text-primary">{label}</p>
    </Link>
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
