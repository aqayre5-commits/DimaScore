'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TeamStandingsSection } from './TeamStandingsSection';
import type { StandingRow } from '@/lib/db/queries';
import type { CompetitionSnapshot } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamStandingsWithFilterProps {
  competitions: CompetitionSnapshot[];
  seasons: number[];
  standingsByCompSeason: Record<string, StandingRow[]>;
  highlightTeamId: number;
  locale: Locale;
}

export function TeamStandingsWithFilter({
  competitions,
  seasons,
  standingsByCompSeason,
  highlightTeamId,
  locale,
}: TeamStandingsWithFilterProps) {
  const t = useTranslations('teamPage');
  const [activeCompId, setActiveCompId] = useState<number>(competitions[0]?.id ?? 0);
  const [activeSeason, setActiveSeason] = useState<number>(seasons[0] ?? 0);

  if (competitions.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noStandingsData')}</p>
      </div>
    );
  }

  const availableSeasons = seasons.filter(
    (s) => standingsByCompSeason[`${activeCompId}-${s}`]?.length > 0,
  );

  const effectiveSeason = availableSeasons.includes(activeSeason)
    ? activeSeason
    : (availableSeasons[0] ?? 0);

  const key = `${activeCompId}-${effectiveSeason}`;
  const activeStandings = standingsByCompSeason[key] ?? [];

  const selectCls =
    'rounded-lg border border-border-subtle bg-bg-surface-2 px-2.5 py-1.5 pr-7 text-[13px] text-text-primary focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green';

  return (
    <div className="space-y-3">
      {/* Selector bar */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
          <select
            value={activeCompId}
            onChange={(e) => setActiveCompId(Number(e.target.value))}
            className={`min-w-[140px] flex-1 ${selectCls}`}
          >
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name[locale] ?? comp.name['en'] ?? `Competition ${comp.id}`}
              </option>
            ))}
          </select>
          <select
            value={effectiveSeason}
            onChange={(e) => setActiveSeason(Number(e.target.value))}
            className={`min-w-[90px] ${selectCls}`}
          >
            {availableSeasons.map((s) => (
              <option key={s} value={s}>
                {s}/{(s + 1) % 100}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TeamStandingsSection
        standings={activeStandings}
        highlightTeamId={highlightTeamId}
        locale={locale}
      />
    </div>
  );
}
