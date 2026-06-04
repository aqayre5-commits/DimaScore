import { getTranslations } from 'next-intl/server';
import { LineupPitch } from '@/components/match/LineupPitch';
import type { MatchLineup } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface PredictedLineupProps {
  locale: Locale;
  homeName: string;
  awayName: string;
  homeLineup: MatchLineup | null;
  awayLineup: MatchLineup | null;
}

/**
 * Predicted XI card for upcoming matches — reuses LineupPitch with derived
 * (heuristic) lineups. Only renders when both teams have a full derived XI.
 */
export async function PredictedLineup({
  locale,
  homeName,
  awayName,
  homeLineup,
  awayLineup,
}: PredictedLineupProps) {
  if (!homeLineup || !awayLineup) return null;
  const t = await getTranslations({ locale, namespace: 'matchDetail' });

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('predictedXI')}
        </h3>
      </div>
      <LineupPitch
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        homeTeamName={homeName}
        awayTeamName={awayName}
        locale={locale}
        pitchOnly
        events={[]}
      />
    </div>
  );
}
