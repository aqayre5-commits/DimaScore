'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FixtureRow } from '@/components/shared/FixtureRow';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { RoundInfo } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueFixturesCardProps {
  fixtures: FixtureWithTeams[];
  rounds: RoundInfo[];
  defaultRound: number;
  locale: Locale;
}

function formatRoundLabel(round: string): string {
  // "Regular Season - 20" → "20"
  const match = round.match(/(\d+)$/);
  return match ? match[1] : round;
}

export function LeagueFixturesCard({
  fixtures,
  rounds,
  defaultRound,
  locale,
}: LeagueFixturesCardProps) {
  const t = useTranslations('leaguePage');
  const [selectedRound, setSelectedRound] = useState(defaultRound);

  const roundNumbers = useMemo(
    () => rounds.map((r) => r.roundNumber).sort((a, b) => a - b),
    [rounds],
  );
  const currentIdx = roundNumbers.indexOf(selectedRound);

  const roundFixtures = useMemo(
    () => fixtures.filter((f) => f.roundNumber === selectedRound),
    [fixtures, selectedRound],
  );

  const roundLabel = rounds.find((r) => r.roundNumber === selectedRound)?.round ?? '';

  function goPrev() {
    if (currentIdx > 0) setSelectedRound(roundNumbers[currentIdx - 1]);
  }
  function goNext() {
    if (currentIdx < roundNumbers.length - 1) setSelectedRound(roundNumbers[currentIdx + 1]);
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('fixtures')}</h3>
      </div>

      {/* Round selector */}
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIdx <= 0}
          className="rounded p-1 text-text-secondary hover:bg-bg-surface-2 disabled:opacity-30"
          aria-label={t('prevRound')}
        >
          <ChevronLeft className="size-4" />
        </button>

        <span className="text-sm font-medium text-text-primary">
          {t('round')} {formatRoundLabel(roundLabel)}
        </span>

        <button
          type="button"
          onClick={goNext}
          disabled={currentIdx >= roundNumbers.length - 1}
          className="rounded p-1 text-text-secondary hover:bg-bg-surface-2 disabled:opacity-30"
          aria-label={t('nextRound')}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Fixtures */}
      <div className="divide-y divide-border-subtle px-4">
        {roundFixtures.map((f) => (
          <FixtureRow
            key={f.id}
            fixtureId={f.id}
            kickoffAt={f.kickoffAt}
            statusCode={f.statusCode}
            homeTeam={f.homeTeam}
            awayTeam={f.awayTeam}
            homeScore={f.homeScore}
            awayScore={f.awayScore}
            locale={locale}
          />
        ))}
      </div>

      {roundFixtures.length === 0 && (
        <div className="px-4 py-6 text-center text-xs text-text-tertiary">{t('noFixtures')}</div>
      )}
    </div>
  );
}
