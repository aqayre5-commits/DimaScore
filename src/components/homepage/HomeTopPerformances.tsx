import Link from 'next/link';
import { PlayerRatingBadge } from '@/components/match/PlayerRatingBadge';
import { TeamLogo } from '@/components/shared/Logo';
import type { TopPerformance } from '@/lib/db/queries/home-rail';
import type { Locale } from '@/lib/i18n/config';
import { localizePosition } from '@/lib/i18n/feed-labels';
import { PlayerPhoto } from '@/components/shared/PlayerPhoto';

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
            <PlayerPhoto
              src={p.playerPhoto}
              name={p.playerName}
              size={24}
              className="size-6 shrink-0 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{p.playerName}</p>
              <div className="flex items-center gap-1">
                <TeamLogo
                  src={p.teamLogo}
                  name={p.teamName}
                  size={12}
                  className="size-3 object-contain"
                />
                <span className="truncate text-[10px] text-text-tertiary">
                  {p.position
                    ? `${localizePosition(p.position, locale)} · ${p.teamName}`
                    : p.teamName}
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
