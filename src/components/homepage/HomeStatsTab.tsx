import Link from 'next/link';
import Image from 'next/image';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueScorers {
  compName: string;
  compHref: string;
  players: TopPlayerRow[];
}

interface HomeStatsTabProps {
  leagues: LeagueScorers[];
  locale: Locale;
  labels: {
    goals: string;
    viewAll: string;
  };
}

export function HomeStatsTab({ leagues, locale, labels }: HomeStatsTabProps) {
  const nonEmpty = leagues.filter((l) => l.players.length > 0);

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
          <div className="divide-y divide-border-subtle">
            {league.players.map((p, i) => (
              <Link
                key={p.playerId}
                href={`/${locale}/joueur/${p.playerSlug}`}
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-bg-surface-2"
              >
                <span className="w-5 text-center text-xs font-medium text-text-tertiary">
                  {i + 1}
                </span>
                {p.playerPhoto ? (
                  <Image
                    src={p.playerPhoto}
                    alt={p.playerName}
                    width={28}
                    height={28}
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-7 items-center justify-center rounded-full bg-bg-surface-2 text-[10px] font-medium text-text-tertiary">
                    {p.playerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text-primary">
                    {p.playerName}
                  </span>
                  <span className="block truncate text-xs text-text-tertiary">{p.teamName}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold tabular-nums text-text-primary">
                    {p.goals}
                  </span>
                  <span className="ml-1 text-[10px] uppercase text-text-tertiary">
                    {labels.goals}
                  </span>
                </div>
              </Link>
            ))}
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
