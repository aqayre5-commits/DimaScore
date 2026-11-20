'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { StandingRow, FixtureWithTeams } from '@/lib/db/queries';
import type {
  TopPlayerRow,
  TopCardRow,
  LeagueCoverageRecord,
  RoundInfo,
} from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { dedupeStandingsByTeam } from '@/lib/standings/dedupe';
import { FixtureRow } from '@/components/shared/FixtureRow';
import { isFinished } from '@/lib/match-status';
import { LeagueFixturesCard } from './LeagueFixturesCard';
import { LeagueStandingsTab } from './LeagueStandingsTab';

interface LeagueOverviewTabProps {
  standings: StandingRow[];
  fixtures: FixtureWithTeams[];
  rounds: RoundInfo[];
  defaultRound: number;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards: TopCardRow[];
  coverage: LeagueCoverageRecord | null;
  locale: Locale;
  /** Localized competition name + season label, for the table heading and caption. */
  competitionName: string;
  seasonLabel: string;
}

export function LeagueOverviewTab({
  standings,
  fixtures,
  rounds,
  defaultRound,
  topScorers,
  topAssists,
  topCards,
  locale,
  competitionName,
  seasonLabel,
}: LeagueOverviewTabProps) {
  const t = useTranslations('leaguePage');

  // Standings first, and the whole table: league-table searches are what this page answers.
  const tableRows = dedupeStandingsByTeam(standings);
  const tableVars = { competition: competitionName, season: seasonLabel };
  // Latest completed results: the newest round before the current one with finished matches.
  const previousRound = rounds
    .map((r) => r.roundNumber)
    .filter((n) => n < defaultRound)
    .sort((a, b) => b - a)
    .find((n) => fixtures.some((f) => f.roundNumber === n && isFinished(f.statusCode)));
  const previousResults =
    previousRound != null
      ? fixtures.filter((f) => f.roundNumber === previousRound && isFinished(f.statusCode))
      : [];
  const compactScorers = topScorers.slice(0, 10);
  const compactAssists = topAssists.slice(0, 5);
  const compactCards = topCards.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Full league table */}
      {tableRows.length > 0 && (
        <section aria-labelledby="league-table-heading">
          <h2 id="league-table-heading" className="mb-2 text-base font-semibold text-text-primary">
            {t('tableHeading', tableVars)}
          </h2>
          <LeagueStandingsTab
            standings={tableRows}
            locale={locale}
            caption={t('tableCaption', tableVars)}
          />
        </section>
      )}

      {/* Matchweek fixtures (current round, with a round picker) */}
      {rounds.length > 0 && (
        <section aria-labelledby="league-fixtures-heading">
          <h2
            id="league-fixtures-heading"
            className="mb-2 text-base font-semibold text-text-primary"
          >
            {t('fixturesHeading')}
          </h2>
          <LeagueFixturesCard
            fixtures={fixtures}
            rounds={rounds}
            defaultRound={defaultRound}
            locale={locale}
          />
        </section>
      )}

      {/* Latest round results, server-rendered */}
      {previousRound != null && previousResults.length > 0 && (
        <section aria-labelledby="league-results-heading">
          <h2
            id="league-results-heading"
            className="mb-2 text-base font-semibold text-text-primary"
          >
            {t('roundResultsHeading', { round: previousRound })}
          </h2>
          <div className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-bg-surface px-4">
            {previousResults.map((f) => (
              <FixtureRow
                key={f.id}
                fixtureId={f.id}
                kickoffAt={f.kickoffAt}
                statusCode={f.statusCode}
                homeTeam={f.homeTeam}
                awayTeam={f.awayTeam}
                homeScore={f.homeScore}
                awayScore={f.awayScore}
                homeScorePen={f.homeScorePen}
                awayScorePen={f.awayScorePen}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Top scorers (top 5) */}
      {compactScorers.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{t('topScorers')}</h2>
          </div>
          <TopPlayerList
            players={compactScorers}
            valueKey="goals"
            valueLabel={t('goals')}
            secondaryFn={(p) => `${p.assists} ${t('assists')}`}
            locale={locale}
          />
        </div>
      )}

      {/* Top assists (top 5) */}
      {compactAssists.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{t('topAssists')}</h2>
          </div>
          <TopPlayerList
            players={compactAssists}
            valueKey="assists"
            valueLabel={t('assists')}
            secondaryFn={(p) => `${p.goals} ${t('goals')}`}
            locale={locale}
          />
        </div>
      )}

      {/* Top cards (top 5 yellow) */}
      {compactCards.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{t('topCards')}</h2>
          </div>
          <div className="rounded-xl border border-border-subtle bg-bg-surface">
            <div className="divide-y divide-border-subtle">
              {compactCards.map((player, i) => (
                <Link
                  key={player.playerId}
                  href={`/${locale}/joueur/${player.playerSlug}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
                >
                  <span className="w-5 text-center text-xs font-medium text-text-tertiary">
                    {i + 1}
                  </span>
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
                    <div className="text-base font-bold tabular-nums text-text-primary">
                      {player.yellowCards}
                    </div>
                    <div className="text-[10px] uppercase text-text-tertiary">
                      {t('yellowCards')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
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
            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-bg-surface-2"
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
