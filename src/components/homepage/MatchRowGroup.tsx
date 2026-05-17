'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { MatchRow } from './MatchRow';
import type { CompetitionGroup } from '@/lib/db/queries/fixtures-by-day';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { getLocalizedCountryName } from '@/lib/constants/country-names-i18n';

interface MatchRowGroupProps {
  group: CompetitionGroup;
  locale: string;
  defaultExpanded: boolean;
}

export function MatchRowGroup({ group, locale, defaultExpanded }: MatchRowGroupProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const t = useTranslations('fixtureList');
  const { competition, fixtures } = group;

  const compName = getLocalizedCompetitionName(competition, locale);
  const countryLabel = getLocalizedCountryName(competition.countryCode, locale);

  return (
    <div className="border-b border-border-subtle">
      {/* Group header */}
      <div className="flex items-center gap-2 px-3 py-2">
        {/* Competition logo + name (clickable → competition page) */}
        <Link
          href={`/${locale}/competition/${competition.countryCode?.toLowerCase() ?? 'fifa'}/${competition.slug}`}
          className="flex min-w-0 items-center gap-2 transition-colors hover:text-accent-gold"
        >
          {competition.logoUrl ? (
            <img
              src={competition.logoUrl}
              alt=""
              className="h-5 w-5 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-bg-surface-2 text-[8px] font-bold text-text-tertiary">
              {competition.slug.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-text-primary">{compName}</span>
        </Link>

        {/* Country (non-clickable per deferred-affordance rule) */}
        {countryLabel && (
          <span className="hidden text-xs text-text-tertiary sm:inline">{countryLabel}</span>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Match count */}
        <span className="shrink-0 rounded-full bg-bg-surface-2 px-2 py-0.5 text-xs tabular-nums text-text-secondary">
          {fixtures.length}
        </span>

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors hover:bg-bg-surface-2"
          aria-expanded={expanded}
          aria-label={expanded ? t('collapse') : t('expand')}
        >
          <ChevronDown
            className={`h-4 w-4 text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Fixtures */}
      {expanded && (
        <div>
          {fixtures.map((fixture) => (
            <MatchRow key={fixture.id} fixture={fixture} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
