import Link from 'next/link';
import { Play } from 'lucide-react';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import type { HomeFixture, GoalEvent } from '@/lib/db/queries/homepage';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  match: HomeFixture;
  goals: GoalEvent[];
  liveCount: number;
  locale: Locale;
  labels: { liveMatch: string; viewAll: string; watchLive: string };
}

export function HomeLiveMatchCard({ match, goals, liveCount, locale, labels }: Props) {
  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = match.competition.name[locale] ?? match.competition.name['en'] ?? '';

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.liveMatch}
        </h2>
        <Link
          href={`/${locale}/matches`}
          className="text-xs font-medium text-accent-green transition-colors hover:text-accent-green-bright"
        >
          {labels.viewAll} ({liveCount})
        </Link>
      </div>

      <div className="px-4 pb-4">
        {/* Competition + Minute */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
            {match.competition.logoUrl && (
              <img src={match.competition.logoUrl} alt="" className="size-3.5 object-contain" />
            )}
            <span className="truncate">{compName}</span>
            {match.round && <span> · {match.round}</span>}
          </div>
          <span className="flex items-center gap-1 rounded-full bg-score-live/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-score-live">
            <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
            {match.statusCode === 'HT' ? 'HT' : `${match.minute ?? ''}'`}
          </span>
        </div>

        {/* Score */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {/* Home */}
          <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
            {match.homeTeam?.logoUrl ? (
              <img src={match.homeTeam.logoUrl} alt="" className="size-9 object-contain" />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {homeName[0]}
              </div>
            )}
            <span className="truncate text-[11px] font-medium text-text-primary w-full text-center">
              {homeName}
            </span>
          </div>

          {/* Score */}
          <div className="shrink-0 text-center">
            <p className="text-2xl font-bold tabular-nums text-text-primary">
              {match.homeScore ?? 0} - {match.awayScore ?? 0}
            </p>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
            {match.awayTeam?.logoUrl ? (
              <img src={match.awayTeam.logoUrl} alt="" className="size-9 object-contain" />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-bold text-text-tertiary">
                {awayName[0]}
              </div>
            )}
            <span className="truncate text-[11px] font-medium text-text-primary w-full text-center">
              {awayName}
            </span>
          </div>
        </div>

        {/* Goal scorers */}
        {goals.length > 0 && (
          <div className="mt-3 space-y-0.5">
            {goals.map((g, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <span className="size-1 rounded-full bg-text-tertiary" />
                <span className="tabular-nums text-text-tertiary">{g.minute}&apos;</span>
                <span>{g.playerName}</span>
              </div>
            ))}
          </div>
        )}

        {/* Watch Live CTA */}
        <Link
          href={`/${locale}/match/${match.id}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent-green py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-green-deep"
        >
          <Play className="size-3.5 fill-current" />
          {labels.watchLive}
        </Link>
      </div>
    </div>
  );
}
