import Link from 'next/link';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { TeamLogo } from '@/components/shared/Logo';
import { codeToFlag } from '@/lib/flags';
import { getMatchState } from '@/lib/match-status';
import { formatMatchTime, formatMatchDate } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import type { Locale } from '@/lib/i18n/config';

interface KnockoutMatchCardProps {
  fixture: FixtureWithTeams;
  locale: Locale;
}

/**
 * Rich knockout match card (used identically on desktop and mobile). Two team rows — winner
 * highlighted with a left accent bar, tinted row and a blue score; loser dimmed — over a footer
 * with date · time · venue. Penalty/AET-aware (shootout winner highlighted, pen score shown).
 */
export function KnockoutMatchCard({ fixture: f, locale }: KnockoutMatchCardProps) {
  const state = getMatchState(f.statusCode, f.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const showScore = (isLive || isFinished) && f.homeScore != null && f.awayScore != null;
  const hasPens = f.homeScorePen != null && f.awayScorePen != null;
  const homeWon =
    isFinished &&
    showScore &&
    (hasPens ? f.homeScorePen! > f.awayScorePen! : (f.homeScore ?? 0) > (f.awayScore ?? 0));
  const awayWon =
    isFinished &&
    showScore &&
    (hasPens ? f.awayScorePen! > f.homeScorePen! : (f.awayScore ?? 0) > (f.homeScore ?? 0));

  const dateStr = formatMatchDate(f.kickoffAt, locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = formatMatchTime(f.kickoffAt, locale);
  const venueName = f.venue?.name ?? f.venue?.city ?? null;

  return (
    <Link
      href={`/${locale}/match/${f.id}`}
      className="block overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-colors hover:border-accent-azure/40"
    >
      <div className="divide-y divide-border-subtle/60">
        <TeamRow
          team={f.homeTeam}
          score={f.homeScore}
          pen={f.homeScorePen}
          won={homeWon}
          dim={awayWon}
          isLive={isLive}
          showScore={showScore}
          locale={locale}
        />
        <TeamRow
          team={f.awayTeam}
          score={f.awayScore}
          pen={f.awayScorePen}
          won={awayWon}
          dim={homeWon}
          isLive={isLive}
          showScore={showScore}
          locale={locale}
        />
      </div>

      {/* Footer: date · time · venue */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border-subtle bg-bg-surface-2/40 px-4 py-2 text-xs text-text-tertiary">
        <span className="flex items-center gap-1.5" suppressHydrationWarning>
          <CalendarDays className="size-3.5 shrink-0 text-accent-azure" />
          {dateStr}
        </span>
        <span className="flex items-center gap-1.5" suppressHydrationWarning>
          <Clock className="size-3.5 shrink-0 text-accent-azure" />
          {timeStr}
        </span>
        {venueName && (
          <span className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0 text-accent-azure" />
            <span className="truncate">{venueName}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

function TeamRow({
  team,
  score,
  pen,
  won,
  dim,
  isLive,
  showScore,
  locale,
}: {
  team: TeamSnapshot | null;
  score: number | null;
  pen: number | null;
  won: boolean;
  dim: boolean;
  isLive: boolean;
  showScore: boolean;
  locale: Locale;
}) {
  const name = team?.name[locale] ?? team?.name['en'] ?? team?.code ?? '—';
  const code = team?.code ?? name.slice(0, 3).toUpperCase();
  const flag = team?.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className={cn('relative flex items-center gap-3 px-4 py-3', won && 'bg-accent-azure/5')}>
      {won && <span className="absolute inset-y-0 left-0 w-1 rounded-r bg-accent-azure" />}

      {team?.logoUrl ? (
        <TeamLogo src={team.logoUrl} size={32} className="size-8 shrink-0 rounded object-contain" />
      ) : flag ? (
        <span className="text-2xl leading-none">{flag}</span>
      ) : (
        <span className="size-8 shrink-0 rounded bg-bg-surface-2" />
      )}

      <span
        className={cn(
          'w-9 shrink-0 text-sm font-bold tabular-nums',
          dim ? 'text-text-tertiary' : 'text-text-primary',
        )}
      >
        {code}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-base',
          won
            ? 'font-semibold text-text-primary'
            : dim
              ? 'text-text-tertiary'
              : 'text-text-primary',
        )}
      >
        {name}
      </span>

      {showScore ? (
        <span
          className={cn(
            'flex shrink-0 items-baseline gap-0.5 text-2xl font-bold tabular-nums',
            isLive ? 'text-score-live' : won ? 'text-accent-azure' : 'text-text-tertiary',
          )}
        >
          {score ?? '–'}
          {pen != null && <span className="text-xs font-semibold">({pen})</span>}
        </span>
      ) : null}
    </div>
  );
}
