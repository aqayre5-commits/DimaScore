'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { WC_2026_BRACKETS_BY_LOCALE } from '@/lib/constants/wc2026-bracket-builder';
import { KnockoutBracket } from './KnockoutBracket';
import { PhaseSelector } from './PhaseSelector';
import type { CupMetadata } from '@/lib/constants/tournament-metadata';
import type { Locale } from '@/lib/i18n/config';
import type { KnockoutPhase } from './BracketMatchCell';

interface BracketPageClientProps {
  metadata: CupMetadata;
  locale: Locale;
}

const PHASE_LABEL_KEYS: Record<KnockoutPhase, string> = {
  r32: 'roundOf32',
  r16: 'roundOf16',
  qf: 'quarterFinals',
  sf: 'semiFinals',
  final: 'finalMatch',
  '3rd': 'thirdPlace',
};

const PHASE_KEYS: KnockoutPhase[] = ['r32', 'r16', 'qf', 'sf', 'final', '3rd'];

export function BracketPageClient({ metadata, locale }: BracketPageClientProps) {
  const t = useTranslations('tournament');
  const [activePhase, setActivePhase] = useState<KnockoutPhase>('r32');

  const { matches, thirdPlaceMatch } = WC_2026_BRACKETS_BY_LOCALE[locale];

  const phases = PHASE_KEYS.filter(
    (k) => metadata.knockoutStartsRound === 'r32' || k !== 'r32',
  ).map((k) => ({ key: k, label: t(PHASE_LABEL_KEYS[k]) }));

  return (
    <div className="space-y-4">
      <div className="mx-auto max-w-7xl">
        <PhaseSelector phases={phases} activePhase={activePhase} onPhaseChange={setActivePhase} />
      </div>
      <KnockoutBracket
        matches={matches}
        thirdPlaceMatch={thirdPlaceMatch}
        locale={locale}
        activePhase={activePhase}
      />
    </div>
  );
}
