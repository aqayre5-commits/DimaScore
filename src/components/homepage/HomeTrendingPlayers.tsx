import Link from 'next/link';
import type { TrendingPlayer } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  players: TrendingPlayer[];
  locale: Locale;
  labels: { trendingPlayers: string; viewAll: string; goals: string };
}

export function HomeTrendingPlayers({ players, locale, labels }: Props) {
  if (players.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-primary">
          {labels.trendingPlayers}
        </h2>
        <Link
          href={`/${locale}/players`}
          className="text-xs font-medium text-accent-green transition-colors hover:text-accent-green-bright"
        >
          {labels.viewAll}
        </Link>
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-4 pb-4 scrollbar-none">
        {players.map((p) => {
          const teamName = p.teamName[locale] ?? p.teamName['en'] ?? '';
          return (
            <div
              key={p.playerId}
              className="flex w-[112px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-surface-2 px-2.5 py-3"
            >
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.playerName}
                  className="size-12 rounded-full object-cover ring-2 ring-border-subtle"
                  loading="lazy"
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full bg-bg-surface-3 text-base font-bold text-text-tertiary ring-2 ring-border-subtle">
                  {p.playerName[0]}
                </div>
              )}
              <div className="text-center min-w-0 w-full">
                <p className="truncate text-xs font-semibold text-text-primary">{p.playerName}</p>
                <p className="truncate text-[10px] text-text-tertiary">{teamName}</p>
              </div>
              <p className="text-base font-bold tabular-nums text-accent-green">
                {p.goals}{' '}
                <span className="text-[10px] font-normal text-text-tertiary">{labels.goals}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
