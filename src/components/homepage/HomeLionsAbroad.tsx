import Link from 'next/link';
import type { MoroccanPerformance } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface Props {
  performances: MoroccanPerformance[];
  locale: Locale;
  labels: {
    lionsAbroad: string;
    last48h: string;
    goal: string;
    assist: string;
    cleanSheet: string;
    viewAll: string;
  };
}

export function HomeLionsAbroad({ performances, locale, labels }: Props) {
  if (performances.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.lionsAbroad}
        </h2>
        <span className="text-[10px] text-text-tertiary">{labels.last48h}</span>
      </div>

      {/* Players */}
      <div className="divide-y divide-border-subtle">
        {performances.map((p) => {
          const hasBadge = p.goals > 0 || p.assists > 0 || p.cleanSheet;

          return (
            <Link
              key={`${p.playerId}-${p.fixtureId}`}
              href={`/${locale}/joueur/${p.playerSlug}`}
              className="flex items-start gap-2.5 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
            >
              {/* Player photo */}
              {p.photoUrl ? (
                <Image
                  src={p.photoUrl}
                  alt=""
                  className="size-8 shrink-0 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                  {p.playerName.charAt(0)}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{p.playerName}</p>
                <p className="mt-0.5 truncate text-[11px] text-text-tertiary">
                  {p.homeTeamName} {p.homeScore}-{p.awayScore} {p.awayTeamName}
                </p>
                {hasBadge && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.goals > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-azure/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-azure">
                        {p.goals > 1 ? `${p.goals}x ` : ''}
                        {labels.goal}
                      </span>
                    )}
                    {p.assists > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-emerald">
                        {p.assists > 1 ? `${p.assists}x ` : ''}
                        {labels.assist}
                      </span>
                    )}
                    {p.cleanSheet && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-gold/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-gold">
                        {labels.cleanSheet}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
