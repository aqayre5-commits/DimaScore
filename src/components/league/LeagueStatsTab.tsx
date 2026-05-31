'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { TopPlayerRow, TopCardRow, LeagueCoverageRecord } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface LeagueStatsTabProps {
  coverage: LeagueCoverageRecord | null;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards: TopCardRow[];
  locale: Locale;
}

export function LeagueStatsTab({
  coverage,
  topScorers,
  topAssists,
  topCards,
  locale,
}: LeagueStatsTabProps) {
  const t = useTranslations('leaguePage');

  const hasAny =
    (coverage?.topScorers && topScorers.length > 0) ||
    (coverage?.topAssists && topAssists.length > 0) ||
    (coverage?.topCards && topCards.length > 0);

  if (!hasAny) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noDataForCompetition')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {coverage?.topScorers && topScorers.length > 0 && (
        <PlayerTable
          title={t('topScorers')}
          players={topScorers}
          statLabel={t('colPlayer')}
          statKey="goals"
          locale={locale}
        />
      )}

      {coverage?.topAssists && topAssists.length > 0 && (
        <PlayerTable
          title={t('topAssists')}
          players={topAssists}
          statLabel={t('colPlayer')}
          statKey="assists"
          locale={locale}
        />
      )}

      {coverage?.topCards && topCards.length > 0 && (
        <CardsTable title={t('topCards')} players={topCards} locale={locale} />
      )}
    </div>
  );
}

function PlayerTable({
  title,
  players,
  statKey,
  locale,
}: {
  title: string;
  players: TopPlayerRow[];
  statLabel: string;
  statKey: 'goals' | 'assists';
  locale: Locale;
}) {
  const t = useTranslations('leaguePage');

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-xs font-medium uppercase text-text-tertiary">
              <th className="w-8 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-start">{t('colPlayer')}</th>
              <th className="px-2 py-2 text-start">{t('colTeam')}</th>
              <th className="w-12 px-2 py-2 text-center tabular-nums">
                {statKey === 'goals'
                  ? t('topScorers').split(' ').pop()
                  : t('topAssists').split(' ').pop()}
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.playerId}
                className="border-b border-border-subtle last:border-b-0 hover:bg-bg-surface-2/50"
              >
                <td className="px-2 py-2 text-center tabular-nums text-text-tertiary">{i + 1}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    {p.playerPhoto ? (
                      <Image
                        src={p.playerPhoto}
                        alt=""
                        className="size-6 rounded-full object-cover"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <div className="flex size-6 items-center justify-center rounded-full bg-bg-surface-2">
                        <span className="text-[10px] text-text-tertiary">
                          {p.playerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/${locale}/joueur/${p.playerSlug}`}
                      className="truncate text-sm font-medium text-text-primary hover:text-accent hover:underline"
                    >
                      {p.playerName}
                    </Link>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {p.teamLogo && (
                      <Image
                        src={p.teamLogo}
                        alt=""
                        className="size-4 object-contain"
                        width={16}
                        height={16}
                      />
                    )}
                    <span className="truncate text-xs text-text-secondary">{p.teamName}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-text-primary">
                  {p[statKey]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardsTable({
  title,
  players,
  locale,
}: {
  title: string;
  players: TopCardRow[];
  locale: Locale;
}) {
  const t = useTranslations('leaguePage');

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-xs font-medium uppercase text-text-tertiary">
              <th className="w-8 px-2 py-2 text-center">#</th>
              <th className="px-2 py-2 text-start">{t('colPlayer')}</th>
              <th className="px-2 py-2 text-start">{t('colTeam')}</th>
              <th className="w-12 px-2 py-2 text-center">
                <span
                  className="inline-block size-3 rounded-sm bg-yellow-400"
                  title={t('cardYellow')}
                />
              </th>
              <th className="w-12 px-2 py-2 text-center">
                <span className="inline-block size-3 rounded-sm bg-red-500" title={t('cardRed')} />
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr
                key={p.playerId}
                className="border-b border-border-subtle last:border-b-0 hover:bg-bg-surface-2/50"
              >
                <td className="px-2 py-2 text-center tabular-nums text-text-tertiary">{i + 1}</td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    {p.playerPhoto ? (
                      <Image
                        src={p.playerPhoto}
                        alt=""
                        className="size-6 rounded-full object-cover"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <div className="flex size-6 items-center justify-center rounded-full bg-bg-surface-2">
                        <span className="text-[10px] text-text-tertiary">
                          {p.playerName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <Link
                      href={`/${locale}/joueur/${p.playerSlug}`}
                      className="truncate text-sm font-medium text-text-primary hover:text-accent hover:underline"
                    >
                      {p.playerName}
                    </Link>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1.5">
                    {p.teamLogo && (
                      <Image
                        src={p.teamLogo}
                        alt=""
                        className="size-4 object-contain"
                        width={16}
                        height={16}
                      />
                    )}
                    <span className="truncate text-xs text-text-secondary">{p.teamName}</span>
                  </div>
                </td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-text-primary">
                  {p.yellowCards}
                </td>
                <td className="px-2 py-2 text-center tabular-nums font-semibold text-text-primary">
                  {p.redCards}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
