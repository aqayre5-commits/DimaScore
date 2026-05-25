'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TeamStandingsSection } from './TeamStandingsSection';
import type { StandingRow } from '@/lib/db/queries';
import type { CompetitionSnapshot } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamStandingsWithFilterProps {
  competitions: CompetitionSnapshot[];
  standingsByComp: Record<number, StandingRow[]>;
  highlightTeamId: number;
  locale: Locale;
}

export function TeamStandingsWithFilter({
  competitions,
  standingsByComp,
  highlightTeamId,
  locale,
}: TeamStandingsWithFilterProps) {
  const t = useTranslations('teamPage');
  const [activeCompId, setActiveCompId] = useState<number>(competitions[0]?.id ?? 0);

  if (competitions.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noStandingsData')}</p>
      </div>
    );
  }

  const activeStandings = standingsByComp[activeCompId] ?? [];

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 py-3">
        <select
          value={activeCompId}
          onChange={(e) => setActiveCompId(Number(e.target.value))}
          className="min-w-[160px] rounded-lg border border-border-subtle bg-bg-page px-2.5 py-1.5 pr-7 text-[13px] text-text-primary focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green"
        >
          {competitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.name[locale] ?? comp.name['en'] ?? `Competition ${comp.id}`}
            </option>
          ))}
        </select>
      </div>

      <TeamStandingsSection
        standings={activeStandings}
        highlightTeamId={highlightTeamId}
        locale={locale}
      />
    </div>
  );
}
