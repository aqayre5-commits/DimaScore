import { useTranslations } from 'next-intl';

/**
 * Tournament status phase — the discriminated union that drives
 * the status descriptor line. Kept generic: league variants can
 * extend with their own phase types later.
 */
export type TournamentPhase =
  | { phase: 'pre-tournament'; daysUntilKickoff: number; kickoffDateFormatted: string }
  | { phase: 'group-stage'; currentRound: number; totalRounds: number; matchesToday: number }
  | { phase: 'knockout'; roundLabel: string; isLive: boolean }
  | { phase: 'final'; matchLabel: string; kickoffFormatted: string }
  | { phase: 'post-tournament'; winnerName: string; titleNumber: number | null };

interface StatusDescriptorProps {
  tournamentPhase: TournamentPhase;
}

/**
 * Status descriptor line in page header. Adapts to tournament state.
 * Per competition-cup.md Section 5 Sub-zone C.
 *
 * Renders a single-line text descriptor with locale-translated labels.
 * Refreshes server-side per request; Pusher-driven client refresh
 * deferred to Phase 7+.
 */
export function StatusDescriptor({ tournamentPhase }: StatusDescriptorProps) {
  const t = useTranslations('tournament');
  const { phase } = tournamentPhase;

  if (phase === 'pre-tournament') {
    const { daysUntilKickoff, kickoffDateFormatted } = tournamentPhase;
    const label =
      daysUntilKickoff > 90
        ? `${t('preTournament')} · ${t('kickoff')}: ${kickoffDateFormatted}`
        : `${t('preTournament')} · ${t('daysUntilKickoff', { days: daysUntilKickoff })}`;

    return <p className="text-base text-text-secondary">{label}</p>;
  }

  if (phase === 'group-stage') {
    const { currentRound, totalRounds, matchesToday } = tournamentPhase;
    return (
      <p className="text-base text-text-secondary">
        {t('groupStage')} · {t('round')} {currentRound}/{totalRounds}
        {matchesToday > 0 ? ` · ${t('matchesToday', { count: matchesToday })}` : ''}
      </p>
    );
  }

  if (phase === 'knockout') {
    const { roundLabel, isLive } = tournamentPhase;
    return (
      <p className="text-base text-text-secondary">
        {t('knockoutStage')} · {roundLabel}
        {isLive ? ` · ${t('inProgress')}` : ''}
      </p>
    );
  }

  if (phase === 'final') {
    const { matchLabel, kickoffFormatted } = tournamentPhase;
    return (
      <p className="text-base text-text-secondary">
        {t('final')} · {matchLabel} · {kickoffFormatted}
      </p>
    );
  }

  // post-tournament
  const { winnerName, titleNumber } = tournamentPhase;
  return (
    <p className="text-base text-text-secondary">
      {t('tournamentComplete')} · {winnerName} {t('winner')}
      {titleNumber ? ` (${t('titleNumber', { n: titleNumber })})` : ''}
    </p>
  );
}
