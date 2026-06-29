import Link from 'next/link';
import { TeamLogo } from '@/components/shared/Logo';
import { codeToFlag } from '@/lib/flags';
import { getTeamFlagUrl } from '@/lib/team-display';
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
 * Knockout match card. Left: two team rows (flag + code + score, pen score inline). Right: a plain
 * text status panel (same card background) — kickoff time (upcoming), a pulsing live indicator
 * (live), or FT / AET [+ Pen] (finished) — with the date beneath. No tint, icon, or venue.
 */
export function KnockoutMatchCard({ fixture: f, locale }: KnockoutMatchCardProps) {
  const state = getMatchState(f.statusCode, f.kickoffAt);
  const isLive = state === 'live';
  const isFinished = state === 'finished';
  const showScore = (isLive || isFinished) && f.homeScore != null && f.awayScore != null;
  const hasPens = f.homeScorePen != null && f.awayScorePen != null;

  const timeStr = formatMatchTime(f.kickoffAt, locale);
  const dateStr = formatMatchDate(f.kickoffAt, locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const ftLabel = f.statusCode === 'AET' ? 'AET' : 'FT';

  return (
    <Link
      href={`/${locale}/match/${f.id}`}
      className="flex items-stretch overflow-hidden rounded-xl border border-border-subtle bg-bg-surface transition-colors hover:border-accent-azure/40"
    >
      {/* Teams + scores */}
      <div className="min-w-0 flex-1 divide-y divide-border-subtle/60">
        <TeamRow
          team={f.homeTeam}
          score={f.homeScore}
          pen={f.homeScorePen}
          showScore={showScore}
          isLive={isLive}
          locale={locale}
        />
        <TeamRow
          team={f.awayTeam}
          score={f.awayScore}
          pen={f.awayScorePen}
          showScore={showScore}
          isLive={isLive}
          locale={locale}
        />
      </div>

      {/* Status panel — time / live / FT(+Pen), date beneath */}
      <div className="flex w-[88px] shrink-0 flex-col items-center justify-center gap-0.5 border-l border-border-subtle px-2 text-center">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-sm font-bold text-score-live">
            <span className="size-2 animate-pulse rounded-full bg-score-live" />
            {f.statusCode === 'HT' ? 'HT' : 'LIVE'}
          </span>
        ) : isFinished ? (
          <span className="leading-tight">
            <span className="block text-base font-bold text-text-primary">{ftLabel}</span>
            {hasPens && (
              <span className="block text-[11px] font-semibold uppercase text-text-tertiary">
                Pen
              </span>
            )}
          </span>
        ) : (
          <span
            className="text-base font-bold tabular-nums text-text-primary"
            suppressHydrationWarning
          >
            {timeStr}
          </span>
        )}
        <span className="text-[11px] text-text-tertiary" suppressHydrationWarning>
          {dateStr}
        </span>
      </div>
    </Link>
  );
}

function TeamRow({
  team,
  score,
  pen,
  showScore,
  isLive,
  locale,
}: {
  team: TeamSnapshot | null;
  score: number | null;
  pen: number | null;
  showScore: boolean;
  isLive: boolean;
  locale: Locale;
}) {
  const name = team?.name[locale] ?? team?.name['en'] ?? team?.code ?? '—';
  const code = team?.code ?? name.slice(0, 3).toUpperCase();
  const flag = team?.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {getTeamFlagUrl(team) ? (
        <TeamLogo
          src={getTeamFlagUrl(team)}
          size={28}
          className="size-7 shrink-0 rounded object-contain"
        />
      ) : flag ? (
        <span className="text-xl leading-none">{flag}</span>
      ) : (
        <span className="size-7 shrink-0 rounded bg-bg-surface-2" />
      )}
      <span className="text-sm font-bold tabular-nums text-text-primary">{code}</span>
      <span className="ml-auto flex items-baseline tabular-nums">
        <span
          className={cn(
            'w-8 text-right text-2xl font-bold',
            !showScore ? 'text-text-quaternary' : isLive ? 'text-score-live' : 'text-text-primary',
          )}
        >
          {showScore ? (score ?? '–') : '–'}
        </span>
        {/* Fixed-width penalty slot (reserved even when empty) so main scores stay aligned across cards */}
        <span className="w-9 pl-1.5 text-left text-sm font-medium text-text-tertiary">
          {pen != null ? `(${pen})` : ''}
        </span>
      </span>
    </div>
  );
}
