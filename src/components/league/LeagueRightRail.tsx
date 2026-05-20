import { useTranslations } from 'next-intl';
import { NewsletterCard } from '@/components/tournament/NewsletterCard';
import type { LeagueCoverageRecord, TopPlayerRow } from '@/lib/db/queries/league';

interface LeagueRightRailProps {
  competitionName: string;
  coverage: LeagueCoverageRecord | null;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
}

function TopPlayersList({
  title,
  players,
  statKey,
}: {
  title: string;
  players: TopPlayerRow[];
  statKey: 'goals' | 'assists';
}) {
  if (players.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{title}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.map((p, i) => (
          <div key={p.playerId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-5 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {p.playerPhoto ? (
              <img
                src={p.playerPhoto}
                alt=""
                className="size-7 rounded-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-bg-surface-2">
                <span className="text-[10px] text-text-tertiary">{p.playerName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{p.playerName}</p>
              <p className="truncate text-[10px] text-text-tertiary">{p.teamName}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {p[statKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LeagueRightRail({
  competitionName,
  coverage,
  topScorers,
  topAssists,
}: LeagueRightRailProps) {
  const t = useTranslations('leaguePage');

  return (
    <div className="space-y-4">
      {coverage?.topScorers && (
        <TopPlayersList title={t('topScorers')} players={topScorers} statKey="goals" />
      )}

      {coverage?.topAssists && (
        <TopPlayersList title={t('topAssists')} players={topAssists} statKey="assists" />
      )}

      <NewsletterCard tournamentName={competitionName} />
    </div>
  );
}
