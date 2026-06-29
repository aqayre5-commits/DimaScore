import Link from 'next/link';
import type { TopScorerEntry } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';
import { TeamLogo } from '@/components/shared/Logo';

interface Props {
  competitionName: Record<string, string>;
  scorers: TopScorerEntry[];
  locale: Locale;
  labels: {
    topScorers: string;
  };
}

export function HomeTopScorers({ competitionName, scorers, locale, labels }: Props) {
  if (scorers.length === 0) return null;

  const compLabel = competitionName[locale] ?? competitionName['en'] ?? '';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.topScorers} · {compLabel}
        </h2>
      </div>

      {/* Scorers */}
      <div className="divide-y divide-border-subtle">
        {scorers.map((s, i) => (
          <Link
            key={s.playerId}
            href={`/${locale}/joueur/${s.playerSlug}`}
            className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-bg-surface-2"
          >
            <span className="w-4 shrink-0 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {s.photoUrl ? (
              <Image
                src={s.photoUrl}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 text-[10px] font-bold text-text-tertiary">
                {s.playerName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{s.playerName}</p>
              <div className="flex items-center gap-1">
                {s.teamLogoUrl && (
                  <TeamLogo src={s.teamLogoUrl} size={12} className="size-3 object-contain" />
                )}
                <span className="truncate text-[10px] text-text-tertiary">{s.teamName}</span>
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-text-primary">
              {s.goals}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
