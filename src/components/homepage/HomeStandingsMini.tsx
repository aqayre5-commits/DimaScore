import Link from 'next/link';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { Flag } from '@/components/shared/Flag';

interface Props {
  compName: string;
  countryKey: string;
  slug: Record<string, string>;
  rows: StandingRow[];
  locale: Locale;
  labels: {
    viewFullStandings: string;
    team: string;
    played: string;
    won: string;
    lost: string;
    goalDiff: string;
    points: string;
  };
}

export function HomeStandingsMini({ compName, countryKey, slug, rows, locale, labels }: Props) {
  const top6 = rows.slice(0, 6);
  const country = getCountrySlug(countryKey, locale);
  const viewAllHref = `/${locale}/competition/${country}/${slug[locale]}#standings`;

  if (top6.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {compName}
        </h2>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-y border-border-subtle text-text-tertiary">
              <th className="w-6 py-2 text-center font-medium">#</th>
              <th className="py-2 text-start font-medium">{labels.team}</th>
              <th className="w-7 py-2 text-center font-medium">{labels.played}</th>
              <th className="w-7 py-2 text-center font-medium">{labels.won}</th>
              <th className="w-7 py-2 text-center font-medium">{labels.lost}</th>
              <th className="w-8 py-2 text-center font-medium">{labels.goalDiff}</th>
              <th className="w-8 py-2 pe-3 text-center font-medium">{labels.points}</th>
            </tr>
          </thead>
          <tbody>
            {top6.map((row, idx) => {
              const gd = (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
              return (
                <tr
                  key={row.teamId ?? idx}
                  className="border-b border-border-subtle transition-colors last:border-b-0 hover:bg-bg-surface-2"
                >
                  <td className="py-2 text-center tabular-nums text-text-tertiary">{row.rank}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      <Flag
                        countryCode={row.team?.countryCode}
                        logoUrl={row.team?.logoUrl}
                        isNational={row.team?.isNational}
                        size={16}
                        label={row.team?.code}
                        className="shrink-0"
                      />
                      <span className="truncate text-text-primary">
                        {getTeamDisplayName(row.team, locale)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {row.played}
                  </td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">{row.won}</td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">{row.lost}</td>
                  <td className="py-2 text-center tabular-nums text-text-secondary">
                    {gd > 0 ? '+' : ''}
                    {gd}
                  </td>
                  <td className="py-2 pe-3 text-center tabular-nums font-semibold text-text-primary">
                    {row.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View full standings */}
      <div className="border-t border-border-subtle">
        <Link
          href={viewAllHref}
          className="flex items-center px-4 py-2.5 text-xs font-medium text-accent-green transition-colors hover:bg-bg-surface-2 hover:text-accent-green-bright"
        >
          {labels.viewFullStandings} &rarr;
        </Link>
      </div>
    </div>
  );
}
