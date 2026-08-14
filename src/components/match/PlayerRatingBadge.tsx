import { useTranslations } from 'next-intl';
import type { MatchPlayerStat } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

// ── Badge atom ──

interface PlayerRatingBadgeProps {
  rating: string | null;
}

function ratingColor(rating: number): string {
  if (rating >= 8.0) return 'bg-emerald-500 text-white';
  if (rating >= 7.0) return 'bg-teal-600 text-white';
  if (rating >= 6.0) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}

export function PlayerRatingBadge({ rating }: PlayerRatingBadgeProps) {
  if (!rating) {
    return (
      <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-bg-surface-2 px-1.5 text-xs font-bold tabular-nums text-text-tertiary">
        &ndash;
      </span>
    );
  }

  const num = parseFloat(rating);
  if (isNaN(num)) {
    return (
      <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md bg-bg-surface-2 px-1.5 text-xs font-bold tabular-nums text-text-tertiary">
        {rating}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-md px-1.5 text-xs font-bold tabular-nums ${ratingColor(num)}`}
    >
      {num.toFixed(1)}
    </span>
  );
}

// ── Ratings panel ──

interface PlayerRatingsPanelProps {
  playerStats: MatchPlayerStat[];
  homeTeamId: number;
  awayTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  locale: Locale;
}

const POS_LABEL_KEY: Record<string, string> = {
  G: 'goalkeeper',
  D: 'defender',
  M: 'midfielder',
  F: 'attacker',
};

function playerName(names: Record<string, string>, locale: string): string {
  return names[locale] ?? names['en'] ?? '';
}

export function PlayerRatingsPanel({
  playerStats,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  locale,
}: PlayerRatingsPanelProps) {
  const t = useTranslations('matchDetail');

  if (playerStats.length === 0) return null;

  const homePlayers = playerStats.filter((p) => p.teamId === homeTeamId);
  const awayPlayers = playerStats.filter((p) => p.teamId === awayTeamId);

  return (
    <div className="grid md:grid-cols-2">
      <TeamRatings teamName={homeTeamName} players={homePlayers} locale={locale} t={t} />
      <TeamRatings teamName={awayTeamName} players={awayPlayers} locale={locale} t={t} isRight />
    </div>
  );
}

function TeamRatings({
  teamName,
  players,
  locale,
  t,
  isRight,
}: {
  teamName: string;
  players: MatchPlayerStat[];
  locale: string;
  t: ReturnType<typeof useTranslations>;
  isRight?: boolean;
}) {
  // Only show players who have a rating, sorted highest first
  const rated = players
    .filter((p) => p.rating != null)
    .sort((a, b) => parseFloat(b.rating!) - parseFloat(a.rating!));
  if (rated.length === 0) return null;

  const starters = rated.filter((p) => !p.substitute);
  const subs = rated.filter((p) => p.substitute);

  return (
    <div className={isRight ? 'border-t border-border-subtle md:border-s md:border-t-0' : ''}>
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2">
        <h4 className="text-xs font-semibold text-text-secondary">{teamName}</h4>
      </div>

      <div className="divide-y divide-border-subtle">
        {starters.map((p) => (
          <PlayerRow key={p.playerId} player={p} locale={locale} t={t} />
        ))}
        {subs.length > 0 && (
          <div className="bg-bg-surface-2 px-4 py-1.5">
            <span className="text-xs font-medium text-text-tertiary">{t('substitutes')}</span>
          </div>
        )}
        {subs.map((p) => (
          <PlayerRow key={p.playerId} player={p} locale={locale} t={t} />
        ))}
      </div>
    </div>
  );
}

function PlayerRow({
  player,
  locale,
  t,
}: {
  player: MatchPlayerStat;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const name = playerName(player.playerName, locale);
  const posKey = player.position ? POS_LABEL_KEY[player.position] : null;
  const posLabel = posKey ? (t(posKey as never) ?? player.position) : player.position;

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      {/* Name + position */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text-primary">
          {name}
          {player.captain && <span className="ms-1 text-xs text-text-tertiary">(C)</span>}
        </p>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {posLabel && <span>{posLabel}</span>}
          {player.minutesPlayed != null && <span>{player.minutesPlayed}&apos;</span>}
        </div>
      </div>

      {/* Rating */}
      <PlayerRatingBadge rating={player.rating} />
    </div>
  );
}
