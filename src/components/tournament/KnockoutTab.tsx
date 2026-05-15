'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { KnockoutMatchCell } from './KnockoutMatchCell';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';

interface KnockoutTabProps {
  metadata: CupMetadata;
  locale: Locale;
}

type KnockoutPhase = 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final';

interface PhaseDefinition {
  key: KnockoutPhase;
  labelKey: string;
  matchCount: number;
}

const WC_2026_PHASES: PhaseDefinition[] = [
  { key: 'r32', labelKey: 'roundOf32', matchCount: 16 },
  { key: 'r16', labelKey: 'roundOf16', matchCount: 8 },
  { key: 'qf', labelKey: 'quarterFinals', matchCount: 4 },
  { key: 'sf', labelKey: 'semiFinals', matchCount: 2 },
  { key: '3rd', labelKey: 'thirdPlace', matchCount: 1 },
  { key: 'final', labelKey: 'finalMatch', matchCount: 1 },
];

/**
 * Knockout tab — phase selector + vertical match list per phase.
 * Per competition-cup.md Section 7 Tab 3.
 * Pre-tournament: shows placeholder slots with group-position labels.
 * Full CSS bracket visualization deferred — see BACKLOG.
 */
export function KnockoutTab({ metadata, locale }: KnockoutTabProps) {
  const t = useTranslations('tournament');
  const [selectedPhase, setSelectedPhase] = useState<KnockoutPhase>('r32');

  const phases =
    metadata.knockoutStartsRound === 'r32'
      ? WC_2026_PHASES
      : WC_2026_PHASES.filter((p) => p.key !== 'r32');

  const activePhase = phases.find((p) => p.key === selectedPhase) ?? phases[0];
  const matches = generatePlaceholderMatches(activePhase, metadata, locale);

  return (
    <div className="space-y-4">
      {/* Phase selector chips */}
      <div className="flex flex-wrap gap-1.5">
        {phases.map((phase) => (
          <button
            key={phase.key}
            onClick={() => setSelectedPhase(phase.key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              selectedPhase === phase.key
                ? 'bg-accent-gold/15 text-accent-gold'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            {t(phase.labelKey)}
          </button>
        ))}
      </div>

      {/* Match cells */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {matches.map((match, i) => (
          <KnockoutMatchCell
            key={i}
            matchNumber={i + 1}
            homeLabel={match.home}
            awayLabel={match.away}
            roundLabel={t(activePhase.labelKey)}
          />
        ))}
      </div>
    </div>
  );
}

interface PlaceholderMatch {
  home: string;
  away: string;
}

function generatePlaceholderMatches(
  phase: PhaseDefinition,
  metadata: CupMetadata,
  locale: Locale,
): PlaceholderMatch[] {
  const groups = metadata.groups;
  const ordinal1 = locale === 'ar' ? 'الأول' : locale === 'en' ? '1st' : '1er';
  const ordinal2 = locale === 'ar' ? 'الثاني' : locale === 'en' ? '2nd' : '2ème';
  const ordinal3 = locale === 'ar' ? 'الثالث' : locale === 'en' ? '3rd' : '3ème';
  const grpLabel = locale === 'ar' ? 'المجموعة' : locale === 'en' ? 'Group' : 'Groupe';
  const winnerLabel = locale === 'ar' ? 'فائز' : locale === 'en' ? 'W' : 'V';

  if (phase.key === 'r32') {
    // WC 2026 R32: 16 matches. Simplified pairing placeholders.
    const matches: PlaceholderMatch[] = [];
    for (let i = 0; i < groups.length; i += 2) {
      const gA = groups[i]?.label ?? '?';
      const gB = groups[i + 1]?.label ?? '?';
      matches.push({
        home: `${ordinal1} ${grpLabel} ${gA}`,
        away: `${ordinal2} ${grpLabel} ${gB}`,
      });
      matches.push({
        home: `${ordinal1} ${grpLabel} ${gB}`,
        away: `${ordinal2} ${grpLabel} ${gA}`,
      });
    }
    // Best 3rd-placed teams fill remaining 4 slots
    for (let i = 0; i < 4; i++) {
      matches.push({ home: `${ordinal3} (${i + 1})`, away: `${ordinal3} (${i + 5})` });
    }
    return matches.slice(0, phase.matchCount);
  }

  if (phase.key === 'r16') {
    return Array.from({ length: phase.matchCount }, (_, i) => ({
      home: `${winnerLabel} R32-${i * 2 + 1}`,
      away: `${winnerLabel} R32-${i * 2 + 2}`,
    }));
  }

  if (phase.key === 'qf') {
    return Array.from({ length: phase.matchCount }, (_, i) => ({
      home: `${winnerLabel} R16-${i * 2 + 1}`,
      away: `${winnerLabel} R16-${i * 2 + 2}`,
    }));
  }

  if (phase.key === 'sf') {
    return Array.from({ length: phase.matchCount }, (_, i) => ({
      home: `${winnerLabel} QF-${i * 2 + 1}`,
      away: `${winnerLabel} QF-${i * 2 + 2}`,
    }));
  }

  if (phase.key === '3rd') {
    const loser = locale === 'ar' ? 'خاسر' : locale === 'en' ? 'L' : 'P';
    return [{ home: `${loser} SF-1`, away: `${loser} SF-2` }];
  }

  // final
  return [{ home: `${winnerLabel} SF-1`, away: `${winnerLabel} SF-2` }];
}
