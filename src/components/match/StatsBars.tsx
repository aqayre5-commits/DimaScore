import type { MatchTeamStats, StatEntry } from '@/lib/db/queries/match-detail';
import { localizeStatType } from '@/lib/i18n/feed-labels';

interface StatsBarsProps {
  homeStats: MatchTeamStats;
  awayStats: MatchTeamStats;
  locale?: string;
}

interface PairedStat {
  /** Raw feed type ("Ball Possession"), stable across locales. */
  type: string;
  /** Display label, localized when a translation exists. */
  label: string;
  homeValue: number | string | null;
  awayValue: number | string | null;
  homeNum: number | null;
  awayNum: number | null;
  isPercentage: boolean;
}

function parseStatValue(value: number | string | null): {
  num: number | null;
  isPercentage: boolean;
} {
  if (value == null) return { num: null, isPercentage: false };
  if (typeof value === 'number') return { num: value, isPercentage: false };
  const pctMatch = value.match(/^(\d+(?:\.\d+)?)%$/);
  if (pctMatch) return { num: parseFloat(pctMatch[1]), isPercentage: true };
  const num = parseFloat(value);
  if (!isNaN(num)) return { num, isPercentage: false };
  return { num: null, isPercentage: false };
}

export function pairStats(home: StatEntry[], away: StatEntry[], locale = 'en'): PairedStat[] {
  if (!Array.isArray(home) || !Array.isArray(away)) return [];
  const awayMap = new Map<string, StatEntry>();
  for (const s of away) {
    awayMap.set(s.type, s);
  }

  const paired: PairedStat[] = [];

  for (const h of home) {
    const a = awayMap.get(h.type);
    const hParsed = parseStatValue(h.value);
    const aParsed = a ? parseStatValue(a.value) : { num: null, isPercentage: false };

    // Skip if both are null
    if (hParsed.num == null && aParsed.num == null && h.value == null && a?.value == null) continue;

    paired.push({
      type: h.type,
      label: localizeStatType(h.type, locale),
      homeValue: h.value,
      awayValue: a?.value ?? null,
      homeNum: hParsed.num,
      awayNum: aParsed.num,
      isPercentage: hParsed.isPercentage || aParsed.isPercentage,
    });
  }

  return paired;
}

function formatDisplay(value: number | string | null): string {
  if (value == null) return '0';
  if (typeof value === 'string') return value;
  return String(value);
}

export function StatsBars({ homeStats, awayStats, locale = 'en' }: StatsBarsProps) {
  if (homeStats.stats.length === 0 && awayStats.stats.length === 0) return null;

  const paired = pairStats(homeStats.stats, awayStats.stats, locale);
  if (paired.length === 0) return null;

  return (
    <div className="divide-y divide-border-subtle">
      {paired.map((stat) => (
        <StatRow key={stat.type} stat={stat} />
      ))}
    </div>
  );
}

function StatRow({ stat }: { stat: PairedStat }) {
  const { homeNum, awayNum, isPercentage } = stat;
  const hasBars = homeNum != null && awayNum != null;

  let homeWidth = 50;
  let awayWidth = 50;

  if (hasBars) {
    if (isPercentage) {
      // Percentage: values already out of 100, bars are relative to each other
      homeWidth = homeNum;
      awayWidth = awayNum;
    } else {
      const total = homeNum + awayNum;
      if (total > 0) {
        homeWidth = (homeNum / total) * 100;
        awayWidth = (awayNum / total) * 100;
      }
    }
  }

  const homeHigher = homeNum != null && awayNum != null && homeNum > awayNum;
  const awayHigher = homeNum != null && awayNum != null && awayNum > homeNum;

  return (
    <div className="px-4 py-3">
      {/* Values + label */}
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className={`text-base tabular-nums ${homeHigher ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
        >
          {formatDisplay(stat.homeValue)}
        </span>
        <span className="text-xs text-text-tertiary">{stat.label}</span>
        <span
          className={`text-base tabular-nums ${awayHigher ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
        >
          {formatDisplay(stat.awayValue)}
        </span>
      </div>

      {/* Bars */}
      {hasBars && (
        <div className="flex h-2.5 gap-1 overflow-hidden rounded-full">
          <div className="flex flex-1 justify-end">
            <div
              className="rounded-s-full bg-accent-green transition-all"
              style={{ width: `${homeWidth}%` }}
            />
          </div>
          <div className="flex flex-1">
            <div
              className="rounded-e-full bg-text-secondary transition-all"
              style={{ width: `${awayWidth}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
