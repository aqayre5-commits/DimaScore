'use client';

import { useState } from 'react';
import { Flag } from '@/components/shared/Flag';
import type { ResolvedFifaRankingRow } from '@/lib/constants/fifa-ranking';

interface Props {
  rows: ResolvedFifaRankingRow[];
  labels: {
    findCountry: string;
    rank: string;
    country: string;
    points: string;
    noResults: string;
  };
}

/**
 * Full FIFA ranking list (all nations) with a client-side "find country" filter.
 * Rows are pre-resolved server-side (localized name + flag code); this component only filters
 * and renders. React Compiler memoizes the derived list, so no manual useMemo.
 */
export function FifaRankingTable({ rows, labels }: Props) {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    : rows;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.findCountry}
          aria-label={labels.findCountry}
          className="w-full rounded-md bg-bg-surface-2 px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-text-tertiary">{labels.noResults}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary">
              <th className="w-12 py-2.5 text-center text-xs font-medium">{labels.rank}</th>
              <th className="py-2.5 text-start text-xs font-medium">{labels.country}</th>
              <th className="w-24 py-2.5 pe-4 text-end text-xs font-medium">{labels.points}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.code}
                className="border-b border-border-subtle transition-colors last:border-b-0 hover:bg-bg-surface-2"
              >
                <td className="py-2.5 text-center tabular-nums text-text-tertiary">{r.rank}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2.5">
                    <Flag
                      countryCode={r.iso2}
                      isNational
                      size={18}
                      label={r.code}
                      className="shrink-0"
                    />
                    <span className="truncate font-medium text-text-primary">{r.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pe-4 text-end tabular-nums font-semibold text-text-primary">
                  {r.points.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
