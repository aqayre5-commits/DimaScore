import { Flag } from '@/components/shared/Flag';
import type { ResolvedFifaRankingRow } from '@/lib/constants/fifa-ranking';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  rows: ResolvedFifaRankingRow[];
  locale: Locale;
  labels: {
    fifaRanking: string;
    /** Pre-interpolated "as of {date}" string. */
    asOf: string;
  };
}

/**
 * Rail card: the published FIFA men's World Ranking (top nations, Morocco pinned + highlighted).
 * Data is a versioned constant (see fifa-ranking.ts); movement arrows arrive in Phase 2 when we
 * compute previous ranks internally. Renders nothing when there's no data.
 */
export function HomeFifaRanking({ rows, labels }: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex items-baseline justify-between gap-2 px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.fifaRanking}
        </h2>
        <span className="shrink-0 text-[10px] text-text-tertiary">{labels.asOf}</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {rows.map((r) => (
          <div key={r.code} className="flex items-center gap-2.5 px-4 py-2">
            <span className="w-5 shrink-0 text-xs tabular-nums text-text-tertiary">{r.rank}</span>
            <Flag countryCode={r.iso2} isNational size={16} label={r.code} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-primary">
              {r.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-text-secondary">
              {r.points.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
