'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { TopPlayerRow, TopCardRow, LeagueCoverageRecord } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeaguePlayersTabProps {
  coverage: LeagueCoverageRecord | null;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards: TopCardRow[];
  locale: Locale;
}

type Board = 'goals' | 'assists' | 'yellowCards' | 'redCards';

export function LeaguePlayersTab({
  coverage,
  topScorers,
  topAssists,
  topCards,
  locale,
}: LeaguePlayersTabProps) {
  const t = useTranslations('leaguePage');
  const [board, setBoard] = useState<Board>('goals');

  const boards: { key: Board; label: string; available: boolean }[] = [
    { key: 'goals', label: t('goals'), available: !!coverage?.topScorers && topScorers.length > 0 },
    {
      key: 'assists',
      label: t('assists'),
      available: !!coverage?.topAssists && topAssists.length > 0,
    },
    {
      key: 'yellowCards',
      label: t('yellowCards'),
      available: !!coverage?.topCards && topCards.length > 0,
    },
    {
      key: 'redCards',
      label: t('redCards'),
      available: !!coverage?.topCards && topCards.length > 0,
    },
  ];

  const availableBoards = boards.filter((b) => b.available);
  if (availableBoards.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('comingSoon')}</p>
      </div>
    );
  }

  // Default to first available board if current is unavailable
  const activeBoard = availableBoards.find((b) => b.key === board) ? board : availableBoards[0].key;

  return (
    <div className="space-y-4">
      {/* Segmented control */}
      <div className="flex gap-1 rounded-lg bg-bg-surface-3 p-1">
        {availableBoards.map((b) => (
          <button
            key={b.key}
            onClick={() => setBoard(b.key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeBoard === b.key
                ? 'bg-bg-surface text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Player list */}
      <div className="rounded-xl border border-border-subtle bg-bg-surface">
        <div className="divide-y divide-border-subtle">
          {activeBoard === 'goals' &&
            topScorers.map((p, i) => (
              <PlayerRow
                key={p.playerId}
                rank={i + 1}
                name={p.playerName}
                photo={p.playerPhoto}
                team={p.teamName}
                teamLogo={p.teamLogo}
                value={p.goals}
                valueLabel={t('goals')}
                secondary={`${p.assists} ${t('assists')}`}
                href={`/${locale}/joueur/${p.playerSlug}`}
              />
            ))}
          {activeBoard === 'assists' &&
            topAssists.map((p, i) => (
              <PlayerRow
                key={p.playerId}
                rank={i + 1}
                name={p.playerName}
                photo={p.playerPhoto}
                team={p.teamName}
                teamLogo={p.teamLogo}
                value={p.assists}
                valueLabel={t('assists')}
                secondary={`${p.goals} ${t('goals')}`}
                href={`/${locale}/joueur/${p.playerSlug}`}
              />
            ))}
          {activeBoard === 'yellowCards' &&
            [...topCards]
              .sort((a, b) => b.yellowCards - a.yellowCards)
              .map((p, i) => (
                <PlayerRow
                  key={p.playerId}
                  rank={i + 1}
                  name={p.playerName}
                  photo={p.playerPhoto}
                  team={p.teamName}
                  teamLogo={p.teamLogo}
                  value={p.yellowCards}
                  valueLabel={t('yellowCards')}
                  secondary={`${p.redCards} ${t('redCards')}`}
                  href={`/${locale}/joueur/${p.playerSlug}`}
                />
              ))}
          {activeBoard === 'redCards' &&
            [...topCards]
              .sort((a, b) => b.redCards - a.redCards)
              .filter((p) => p.redCards > 0)
              .map((p, i) => (
                <PlayerRow
                  key={p.playerId}
                  rank={i + 1}
                  name={p.playerName}
                  photo={p.playerPhoto}
                  team={p.teamName}
                  teamLogo={p.teamLogo}
                  value={p.redCards}
                  valueLabel={t('redCards')}
                  secondary={`${p.yellowCards} ${t('yellowCards')}`}
                  href={`/${locale}/joueur/${p.playerSlug}`}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function PlayerRow({
  rank,
  name,
  photo,
  team,
  teamLogo,
  value,
  valueLabel,
  secondary,
  href,
}: {
  rank: number;
  name: string;
  photo: string | null;
  team: string;
  teamLogo: string | null;
  value: number;
  valueLabel: string;
  secondary: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-surface-2"
    >
      <span className="w-5 text-center text-xs font-medium text-text-tertiary">{rank}</span>
      {photo ? (
        <Image
          src={photo}
          alt={name}
          width={36}
          height={36}
          className="size-9 rounded-full object-cover"
        />
      ) : (
        <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-medium text-text-tertiary">
          {name.charAt(0)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-primary">{name}</div>
        <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
          {teamLogo && (
            <Image src={teamLogo} alt="" width={12} height={12} className="size-3 object-contain" />
          )}
          <span className="truncate">{team}</span>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs text-text-tertiary">{secondary}</span>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold tabular-nums text-text-primary">{value}</div>
        <div className="text-[10px] uppercase text-text-tertiary">{valueLabel}</div>
      </div>
    </Link>
  );
}
