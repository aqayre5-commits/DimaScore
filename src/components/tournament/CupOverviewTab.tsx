import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';
import type { TopPlayerRow, LeagueCoverageRecord } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { CupFixturesTab } from './CupFixturesTab';
import { getTeamFlagUrl } from '@/lib/team-display';

interface CupOverviewTabProps {
  fixtures: FixtureWithTeams[];
  standings: StandingRow[];
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  coverage: LeagueCoverageRecord | null;
  locale: Locale;
}

/**
 * Generic cup overview tab — compact match list with filters, mini standings, top scorers/assists.
 * Used for UCL, UEL, UECL, AFCON, and other cups without hardcoded metadata.
 */
export function CupOverviewTab({
  fixtures,
  standings,
  topScorers,
  topAssists,
  coverage,
  locale,
}: CupOverviewTabProps) {
  const t = useTranslations('tournament');
  const tL = useTranslations('leaguePage');

  const topStandings = dedupeStandingsByTeam(standings).slice(0, 8);
  const compactScorers = topScorers.slice(0, 5);
  const compactAssists = topAssists.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Compact match list with filter pills */}
      {fixtures.length > 0 && <CupFixturesTab fixtures={fixtures} locale={locale} compact />}

      {/* Mini standings */}
      {topStandings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="border-b border-border-subtle px-4 py-2.5">
            <h3 className="label-caps">{t('standings')}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary">
                  <th className="py-2 pl-4 text-left font-medium">#</th>
                  <th className="py-2 text-left font-medium">{t('team')}</th>
                  <th className="py-2 text-center font-medium">P</th>
                  <th className="py-2 text-center font-medium">W</th>
                  <th className="py-2 text-center font-medium">D</th>
                  <th className="py-2 text-center font-medium">L</th>
                  <th className="py-2 text-center font-medium">GD</th>
                  <th className="py-2 pr-4 text-center font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {topStandings.map((row, idx) => (
                  <tr
                    key={row.teamId ?? idx}
                    className="border-b border-border-subtle last:border-0"
                  >
                    <td className="py-2 pl-4 tabular-nums text-text-tertiary">
                      {row.rank ?? idx + 1}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        {getTeamFlagUrl(row.team) && (
                          <Image
                            src={getTeamFlagUrl(row.team)!}
                            alt=""
                            width={16}
                            height={16}
                            className="size-4 object-contain"
                          />
                        )}
                        <span className="truncate font-medium text-text-primary">
                          {row.team?.name?.en ?? row.team?.code ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-center tabular-nums text-text-secondary">
                      {row.played}
                    </td>
                    <td className="py-2 text-center tabular-nums text-text-secondary">{row.won}</td>
                    <td className="py-2 text-center tabular-nums text-text-secondary">
                      {row.drawn}
                    </td>
                    <td className="py-2 text-center tabular-nums text-text-secondary">
                      {row.lost}
                    </td>
                    <td className="py-2 text-center tabular-nums text-text-secondary">
                      {row.goalDiff != null && row.goalDiff > 0
                        ? `+${row.goalDiff}`
                        : (row.goalDiff ?? 0)}
                    </td>
                    <td className="py-2 pr-4 text-center tabular-nums font-semibold text-text-primary">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {standings.length > 8 && (
            <div className="border-t border-border-subtle px-4 py-2 text-center text-xs text-text-tertiary">
              +{standings.length - 8} {t('moreTeams')}
            </div>
          )}
        </div>
      )}

      {/* Top scorers */}
      {coverage?.topScorers && compactScorers.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{tL('topScorers')}</h2>
          </div>
          <TopPlayerList
            players={compactScorers}
            valueKey="goals"
            valueLabel={tL('goals')}
            secondaryFn={(p) => `${p.assists} ${tL('assists')}`}
            locale={locale}
          />
        </div>
      )}

      {/* Top assists */}
      {coverage?.topAssists && compactAssists.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{tL('topAssists')}</h2>
          </div>
          <TopPlayerList
            players={compactAssists}
            valueKey="assists"
            valueLabel={tL('assists')}
            secondaryFn={(p) => `${p.goals} ${tL('goals')}`}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}

function TopPlayerList({
  players,
  valueKey,
  valueLabel,
  secondaryFn,
  locale,
}: {
  players: TopPlayerRow[];
  valueKey: 'goals' | 'assists';
  valueLabel: string;
  secondaryFn: (p: TopPlayerRow) => string;
  locale: Locale;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface">
      <div className="divide-y divide-border-subtle">
        {players.map((player, i) => (
          <Link
            key={player.playerId}
            href={`/${locale}/joueur/${player.playerSlug}`}
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent-azure/5"
          >
            <span className="w-5 text-center text-xs font-medium text-text-tertiary">{i + 1}</span>
            {player.playerPhoto ? (
              <Image
                src={player.playerPhoto}
                alt={player.playerName}
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-medium text-text-tertiary">
                {player.playerName.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-primary">
                {player.playerName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                {player.teamLogo && (
                  <Image
                    src={player.teamLogo}
                    alt=""
                    width={12}
                    height={12}
                    className="size-3 object-contain"
                  />
                )}
                <span className="truncate">{player.teamName}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-text-tertiary">{secondaryFn(player)}</span>
            </div>
            <div className="text-right">
              <div className="text-base font-bold tabular-nums text-text-primary">
                {player[valueKey]}
              </div>
              <div className="text-[10px] uppercase text-text-tertiary">{valueLabel}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
