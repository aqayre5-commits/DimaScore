import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { stripWomenSuffix } from '@/lib/team-display';

interface Props {
  players: TopPlayerRow[];
  locale: Locale;
}

/**
 * Right-rail Widget 1 — Top scorers. Renders the ranked list once stats exist, otherwise a compact
 * "available once the tournament begins" placeholder. Coverage-gated by the parent (RightRail).
 */
export function TopScorersWidget({ players, locale }: Props) {
  const t = useTranslations('tournament');

  if (players.length === 0) {
    return (
      <div id="top-scorers" className="rounded-lg border border-border-subtle bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary">{t('topScorers')}</h3>
        <p className="mt-1 text-xs text-text-tertiary">{t('noDataPreTournament')}</p>
      </div>
    );
  }

  return (
    <div id="top-scorers" className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">{t('topScorers')}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.map((p, i) => (
          <div key={p.playerId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-5 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {p.playerPhoto ? (
              <Image
                src={p.playerPhoto}
                alt=""
                className="size-7 rounded-full object-cover"
                width={28}
                height={28}
              />
            ) : (
              <div className="flex size-7 items-center justify-center rounded-full bg-bg-surface-2">
                <span className="text-[10px] text-text-tertiary">{p.playerName.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/${locale}/joueur/${p.playerSlug}`}
                className="block truncate text-xs font-medium text-text-primary hover:text-accent hover:underline"
              >
                {p.playerName}
              </Link>
              <p className="truncate text-[10px] text-text-tertiary">
                {stripWomenSuffix(p.teamName)}
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-text-primary">{p.goals}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
