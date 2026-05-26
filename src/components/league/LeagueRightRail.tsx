import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

import type { StandingRow } from '@/lib/db/queries';
import type { LeagueCoverageRecord, TopPlayerRow, TopCardRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueRightRailProps {
  competitionName: string;
  coverage: LeagueCoverageRecord | null;
  standings?: StandingRow[];
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards?: TopCardRow[];
  locale: Locale;
}

function TopPlayersList({
  title,
  players,
  statKey,
  locale,
}: {
  title: string;
  players: TopPlayerRow[];
  statKey: 'goals' | 'assists';
  locale: Locale;
}) {
  if (players.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{title}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.map((p, i) => (
          <div key={p.playerId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-5 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {p.playerPhoto ? (
              <img
                src={p.playerPhoto}
                alt=""
                className="size-7 rounded-full object-cover"
                loading="lazy"
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
              <p className="truncate text-[10px] text-text-tertiary">{p.teamName}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-text-primary">
              {p[statKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCardsList({
  title,
  players,
  locale,
}: {
  title: string;
  players: TopCardRow[];
  locale: Locale;
}) {
  const t = useTranslations('leaguePage');
  if (players.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{title}</h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {players.map((p, i) => (
          <div key={p.playerId} className="flex items-center gap-3 px-4 py-2">
            <span className="w-5 text-xs tabular-nums text-text-tertiary">{i + 1}</span>
            {p.playerPhoto ? (
              <img
                src={p.playerPhoto}
                alt=""
                className="size-7 rounded-full object-cover"
                loading="lazy"
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
              <p className="truncate text-[10px] text-text-tertiary">{p.teamName}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block size-3 rounded-sm bg-yellow-400"
                title={t('cardYellow')}
              />
              <span className="text-xs font-semibold tabular-nums text-text-primary">
                {p.yellowCards}
              </span>
              {p.redCards > 0 && (
                <>
                  <span
                    className="inline-block size-3 rounded-sm bg-red-500"
                    title={t('cardRed')}
                  />
                  <span className="text-xs font-semibold tabular-nums text-text-primary">
                    {p.redCards}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStandingsWidget({
  title,
  standings,
  locale,
}: {
  title: string;
  standings: StandingRow[];
  locale: Locale;
}) {
  const t = useTranslations('leaguePage');
  // Show top 5 teams only
  const top5 = standings.slice(0, 5);
  if (top5.length === 0) return null;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{title}</h3>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border-subtle text-[10px] font-medium uppercase text-text-tertiary">
            <th className="w-6 py-1.5 text-center">#</th>
            <th className="py-1.5 text-start">{t('miniTeam')}</th>
            <th className="w-6 py-1.5 text-center">{t('miniPlayed')}</th>
            <th className="w-8 py-1.5 text-center font-semibold">{t('miniPoints')}</th>
          </tr>
        </thead>
        <tbody>
          {top5.map((row) => {
            const teamName =
              row.team?.shortName[locale] ??
              row.team?.name[locale] ??
              row.team?.name['en'] ??
              row.team?.code ??
              '—';

            return (
              <tr
                key={row.teamId ?? row.rank}
                className="border-b border-border-subtle last:border-b-0"
              >
                <td className="py-1.5 text-center tabular-nums text-text-tertiary">{row.rank}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    {row.team?.logoUrl ? (
                      <img
                        src={row.team.logoUrl}
                        alt=""
                        className="size-4 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-4 rounded bg-bg-surface-2" />
                    )}
                    {row.team?.slug ? (
                      <Link
                        href={`/${locale}/equipe/${row.team.slug}`}
                        className={cn(
                          'truncate text-xs font-medium text-text-primary hover:text-accent hover:underline',
                          row.rank === 1 && 'font-semibold',
                        )}
                      >
                        {teamName}
                      </Link>
                    ) : (
                      <span className="truncate text-xs font-medium text-text-primary">
                        {teamName}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-1.5 text-center tabular-nums text-text-secondary">
                  {row.played}
                </td>
                <td className="py-1.5 text-center tabular-nums font-semibold text-text-primary">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function LeagueRightRail({
  coverage,
  standings,
  topScorers,
  topAssists,
  topCards,
  locale,
}: LeagueRightRailProps) {
  const t = useTranslations('leaguePage');

  return (
    <div className="space-y-4">
      {standings && standings.length > 0 && (
        <MiniStandingsWidget title={t('standings')} standings={standings} locale={locale} />
      )}

      {coverage?.topScorers && (
        <TopPlayersList
          title={t('topScorers')}
          players={topScorers}
          statKey="goals"
          locale={locale}
        />
      )}

      {coverage?.topAssists && (
        <TopPlayersList
          title={t('topAssists')}
          players={topAssists}
          statKey="assists"
          locale={locale}
        />
      )}

      {coverage?.topCards && topCards && (
        <TopCardsList title={t('topCards')} players={topCards} locale={locale} />
      )}
    </div>
  );
}
