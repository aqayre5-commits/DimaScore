import Link from 'next/link';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface LeagueTeams {
  compName: string;
  compHref: string;
  standings: StandingRow[];
}

interface HomeTeamsTabProps {
  leagues: LeagueTeams[];
  locale: Locale;
  labels: {
    viewAll: string;
  };
}

export function HomeTeamsTab({ leagues, locale, labels }: HomeTeamsTabProps) {
  const nonEmpty = leagues.filter((l) => l.standings.length > 0);

  if (nonEmpty.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">—</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nonEmpty.map((league) => (
        <div
          key={league.compName}
          className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface"
        >
          <div className="border-b border-border-subtle px-4 py-2.5">
            <h3 className="text-sm font-semibold text-text-primary">{league.compName}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
            {league.standings.slice(0, 8).map((row) => {
              const teamName =
                row.team?.shortName[locale] ??
                row.team?.name[locale] ??
                row.team?.name['en'] ??
                row.team?.code ??
                '—';

              return (
                <Link
                  key={row.teamId ?? row.rank}
                  href={row.team?.slug ? `/${locale}/equipe/${row.team.slug}` : '#'}
                  className="flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors hover:bg-bg-surface-2"
                >
                  {row.team?.logoUrl ? (
                    <img
                      src={row.team.logoUrl}
                      alt=""
                      className="size-8 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex size-8 items-center justify-center rounded-full bg-bg-surface-2 text-[10px] font-bold text-text-tertiary">
                      {(row.team?.code ?? '??').slice(0, 3)}
                    </div>
                  )}
                  <span className="max-w-full truncate text-[11px] font-medium text-text-primary">
                    {teamName}
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-border-subtle px-4 py-2">
            <Link
              href={league.compHref}
              className="text-sm font-medium text-accent-green transition-colors hover:text-accent-green/80"
            >
              {labels.viewAll} →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
