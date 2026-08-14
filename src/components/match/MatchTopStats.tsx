'use client';

import { useTranslations } from 'next-intl';
import type { MatchTeamStats } from '@/lib/db/queries/match-detail';
import { pairStats } from './StatsBars';

interface MatchTopStatsProps {
  homeStats: MatchTeamStats;
  awayStats: MatchTeamStats;
}

type PairedStat = ReturnType<typeof pairStats>[number];

function formatVal(value: number | string | null): string {
  if (value == null) return '0';
  return String(value);
}

/**
 * Compact stats snapshot for the desktop sidebar: possession split bar + the next few key stats.
 * A summary of the full StatsBars section shown in the centre — reuses the same pairing logic and is
 * rendered desktop-only (mobile/tablet already get the full stats block inline).
 */
export function MatchTopStats({ homeStats, awayStats }: MatchTopStatsProps) {
  const t = useTranslations('matchDetail');
  const paired = pairStats(homeStats.stats, awayStats.stats);
  if (paired.length === 0) return null;

  const possession = paired.find((p) => /possession/i.test(p.label));
  const rest = paired.filter((p) => p !== possession).slice(0, 4);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('stats')}
        </h3>
      </div>
      <div className="flex flex-col gap-3.5 p-4">
        {possession && possession.homeNum != null && possession.awayNum != null && (
          <div>
            <div className="mb-1.5 flex items-center justify-between text-sm font-semibold tabular-nums text-text-primary">
              <span>{formatVal(possession.homeValue)}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {possession.label}
              </span>
              <span>{formatVal(possession.awayValue)}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-bg-surface-3">
              <div className="bg-accent-green" style={{ width: `${possession.homeNum}%` }} />
              <div className="bg-text-tertiary" style={{ width: `${possession.awayNum}%` }} />
            </div>
          </div>
        )}
        {rest.map((stat) => (
          <CompactStatRow key={stat.label} stat={stat} />
        ))}
      </div>
    </div>
  );
}

function CompactStatRow({ stat }: { stat: PairedStat }) {
  const { homeNum, awayNum } = stat;
  const hasBars = homeNum != null && awayNum != null;
  const total = hasBars ? homeNum + awayNum : 0;
  const homeWidth = hasBars && total > 0 ? (homeNum / total) * 100 : 50;
  const awayWidth = hasBars && total > 0 ? (awayNum / total) * 100 : 50;
  const homeHigher = hasBars && homeNum > awayNum;
  const awayHigher = hasBars && awayNum > homeNum;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs tabular-nums">
        <span className={homeHigher ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
          {formatVal(stat.homeValue)}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-text-tertiary">{stat.label}</span>
        <span className={awayHigher ? 'font-semibold text-text-primary' : 'text-text-secondary'}>
          {formatVal(stat.awayValue)}
        </span>
      </div>
      {hasBars && (
        <div className="flex h-1 gap-1">
          <div className="flex flex-1 justify-end">
            <div className="rounded-s-full bg-accent-green" style={{ width: `${homeWidth}%` }} />
          </div>
          <div className="flex flex-1">
            <div className="rounded-e-full bg-text-tertiary" style={{ width: `${awayWidth}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}
