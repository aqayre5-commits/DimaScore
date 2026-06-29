import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { PlayerPhotoCircle } from '@/components/shared/PlayerPhotoCircle';
import { stripWomenSuffix } from '@/lib/team-display';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  players: TopPlayerRow[];
  locale: Locale;
  /** Which stat field on the row to render in the trailing badge. */
  stat: 'goals' | 'assists';
}

const STAT_META = {
  goals: { id: 'top-scorers', titleKey: 'topScorers' as const },
  assists: { id: 'top-assists', titleKey: 'topAssists' as const },
};

/**
 * Right-rail ranked-player widget — used for Top Scorers and Top Assists. Coverage-gated by
 * the parent (RightRail). Renders a "no data yet" placeholder when players is empty so the
 * surface still shows the header during the pre-tournament window.
 */
export function RankedPlayersList({ players, locale, stat }: Props) {
  const t = useTranslations('tournament');
  const { id, titleKey } = STAT_META[stat];
  const title = t(titleKey);

  if (players.length === 0) {
    return (
      <div id={id} className="rounded-lg border border-border-subtle bg-bg-surface p-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-xs text-text-tertiary">{t('noDataPreTournament')}</p>
      </div>
    );
  }

  return (
    <div id={id} className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.map((p, i) => (
          <div key={p.playerId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-5 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            <PlayerPhotoCircle src={p.playerPhoto} name={p.playerName} />
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
            <span className="text-sm font-semibold tabular-nums text-text-primary">{p[stat]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
