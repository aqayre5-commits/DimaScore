import Link from 'next/link';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface StandingsWidgetProps {
  heading: string;
  rows: StandingRow[];
  viewAllHref: string;
  viewAllLabel: string;
  locale: Locale;
  rankLabel: string;
  teamLabel: string;
  playedLabel: string;
  pointsLabel: string;
}

function getTeamName(
  team: {
    shortName: Record<string, string>;
    name: Record<string, string>;
    code: string | null;
  } | null,
  locale: string,
): string {
  if (!team) return '???';
  return (
    team.shortName[locale] ||
    team.name[locale] ||
    team.shortName.en ||
    team.name.en ||
    team.code ||
    '???'
  );
}

export function StandingsWidget({
  heading,
  rows,
  viewAllHref,
  viewAllLabel,
  locale,
  rankLabel,
  teamLabel,
  playedLabel,
  pointsLabel,
}: StandingsWidgetProps) {
  const top6 = rows.slice(0, 6);

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-semibold text-text-primary">{heading}</h2>
      </div>

      {top6.length > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-subtle text-text-tertiary">
              <th className="w-8 py-1.5 text-center font-medium">{rankLabel}</th>
              <th className="py-1.5 text-start font-medium">{teamLabel}</th>
              <th className="w-10 py-1.5 text-center font-medium">{playedLabel}</th>
              <th className="w-10 py-1.5 text-center font-medium">{pointsLabel}</th>
            </tr>
          </thead>
          <tbody>
            {top6.map((row, idx) => (
              <tr key={row.teamId ?? idx} className="border-b border-border-subtle last:border-b-0">
                <td className="py-1.5 text-center tabular-nums text-text-tertiary">{row.rank}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    {row.team?.logoUrl ? (
                      <img
                        src={row.team.logoUrl}
                        alt=""
                        className="h-4 w-4 shrink-0 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 text-[7px] font-bold text-text-tertiary">
                        {row.team?.code?.slice(0, 2) ?? '??'}
                      </span>
                    )}
                    <span className="truncate text-text-primary">
                      {getTeamName(row.team, locale)}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 text-center tabular-nums text-text-secondary">
                  {row.played}
                </td>
                <td className="py-1.5 text-center tabular-nums font-semibold text-text-primary">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="px-3 pb-3">
          <p className="text-xs text-text-tertiary">—</p>
        </div>
      )}

      <div className="border-t border-border-subtle px-3 py-2">
        <Link
          href={viewAllHref}
          className="text-xs font-medium text-accent-gold transition-colors hover:text-accent-gold/80"
        >
          {viewAllLabel} →
        </Link>
      </div>
    </div>
  );
}
