import Link from 'next/link';
import Image from 'next/image';
import { PlayerRatingBadge } from '@/components/match/PlayerRatingBadge';
import { TeamLogo } from '@/components/shared/Logo';
import type { TopPerformance } from '@/lib/db/queries/home-rail';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  performances: TopPerformance[];
  locale: Locale;
  labels: { topPerformances: string };
}

/** Rail card: the highest match-rated players from recent finished games (SofaScore-style),
 *  ranked with the shared rating badge. Renders nothing when there's no rated data. */
export function HomeTopPerformances({ performances, locale, labels }: Props) {
  if (performances.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.topPerformances}
        </h2>
      </div>

      <div className="divide-y divide-border-subtle">
        {performances.map((p, i) => (
          <Link
            key={p.playerId}
            href={`/${locale}/joueur/${p.playerSlug}`}
            className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-bg-surface-2"
          >
            <span className="w-4 shrink-0 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {p.playerPhoto ? (
              <Image
                src={p.playerPhoto}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-[10px] font-bold text-text-tertiary">
                {p.playerName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{p.playerName}</p>
              <div className="flex items-center gap-1">
                {p.teamLogo && (
                  <TeamLogo src={p.teamLogo} size={12} className="size-3 object-contain" />
                )}
                <span className="truncate text-[10px] text-text-tertiary">
                  {p.position ? `${p.position} · ${p.teamName}` : p.teamName}
                </span>
              </div>
            </div>
            <PlayerRatingBadge rating={p.rating.toFixed(1)} />
          </Link>
        ))}
      </div>
    </div>
  );
}
