'use client';

import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { formatDateLabel } from '@/lib/utils/date';
import { LocalTime } from '@/components/shared/LocalTime';
import type { TopMatchDateGroup } from '@/lib/db/queries/right-rail';
import type { Locale } from '@/lib/i18n/config';
import { TeamLogo } from '@/components/shared/Logo';
import { LIVE_CODES_ARRAY, FINISHED_CODES_ARRAY } from '@/lib/match-status';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';

interface Props {
  groups: TopMatchDateGroup[];
  locale: Locale;
  labels: {
    topMatches: string;
    seeAll: string;
    today: string;
  };
}

const LIVE_CODES: string[] = [...LIVE_CODES_ARRAY];
const FINISHED_CODES: string[] = [...FINISHED_CODES_ARRAY];

export function HomeTopMatches({ groups, locale, labels }: Props) {
  // Poll /api/v1/live so scores/minute/status reflect the current state instead of the
  // SSR snapshot. Shared react-query key dedupes with every other live-poll surface.
  const livePatches = useLiveFixtures();

  if (groups.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
          {labels.topMatches}
        </h2>
      </div>

      <div className="divide-y divide-border-subtle">
        {groups.map((group) => (
          <div key={group.dateKey}>
            {/* Date header */}
            <div className="bg-bg-surface-2 px-4 py-1.5">
              <span className="text-[11px] font-semibold text-text-secondary">
                {formatDateLabel(group.dateKey, locale, labels.today)}
              </span>
            </div>

            {/* Fixtures */}
            {group.fixtures.map((f) => {
              const patch = livePatches.get(f.id);
              const statusCode = patch?.statusCode ?? f.statusCode;
              const minute = patch?.minute ?? f.minute;
              const homeScore = patch?.homeScore ?? f.homeScore;
              const awayScore = patch?.awayScore ?? f.awayScore;
              const isLive = LIVE_CODES.includes(statusCode);
              // Server data only contains live + upcoming rows, so a finished state (and its
              // pen scores) can only arrive via the live patch.
              const isFinished = FINISHED_CODES.includes(statusCode);
              const homeScorePen = patch?.homeScorePen ?? null;
              const awayScorePen = patch?.awayScorePen ?? null;
              const showPens = statusCode === 'PEN' && homeScorePen != null && awayScorePen != null;
              const homeName = getTeamDisplayName(f.homeTeam, locale);
              const awayName = getTeamDisplayName(f.awayTeam, locale);
              const compName = f.competition.name[locale] ?? f.competition.name['en'] ?? '';
              const preview = previewFromFixtureRow({
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                homeScore,
                awayScore,
                statusCode,
                minute,
                kickoffAt: f.kickoffAt,
                competition: { name: f.competition.name, slug: f.competition.slug },
              });

              return (
                <MatchLink
                  key={f.id}
                  matchId={String(f.id)}
                  href={`/${locale}/match/${f.id}`}
                  preview={preview}
                  ariaLabel={`${homeName} vs ${awayName}`}
                  className="flex items-center gap-2 px-4 py-2 transition-colors hover:bg-bg-surface-2"
                >
                  {/* Status */}
                  <div className="w-10 shrink-0 text-[11px] tabular-nums">
                    {isLive ? (
                      <span className="flex items-center gap-1 font-bold text-score-live">
                        <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
                        {statusCode === 'HT' ? 'HT' : `${minute ?? ''}'`}
                      </span>
                    ) : isFinished ? (
                      <span className="flex flex-col leading-tight">
                        <span className="font-medium text-text-tertiary">
                          {statusCode === 'AET' ? 'AET' : 'FT'}
                        </span>
                        {showPens && (
                          <span className="text-[9px] font-semibold text-text-tertiary">PEN</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-text-secondary" suppressHydrationWarning>
                        <LocalTime date={f.kickoffAt} locale={locale} format="time" />
                      </span>
                    )}
                  </div>

                  {/* Teams + competition badge */}
                  <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      {f.homeTeam?.logoUrl ? (
                        <TeamLogo
                          src={f.homeTeam.logoUrl}
                          size={12}
                          className="size-3.5 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface-2" />
                      )}
                      <span className="truncate text-xs text-text-secondary">{homeName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {f.awayTeam?.logoUrl ? (
                        <TeamLogo
                          src={f.awayTeam.logoUrl}
                          size={12}
                          className="size-3.5 shrink-0 object-contain"
                        />
                      ) : (
                        <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface-2" />
                      )}
                      <span className="truncate text-xs text-text-secondary">{awayName}</span>
                    </div>
                  </div>

                  {/* Competition + round badge */}
                  <div className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="truncate text-[10px] text-text-tertiary max-w-[80px]">
                      {compName}
                    </span>
                    {(f.groupLabel ?? f.round) && (
                      <span className="truncate text-[10px] text-text-quaternary max-w-[80px]">
                        {f.groupLabel ?? f.round}
                      </span>
                    )}
                  </div>

                  {/* Live / final scores */}
                  {(isLive || isFinished) && (
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="text-xs font-bold tabular-nums text-text-primary">
                        {homeScore ?? '-'}
                        {showPens && (
                          <span className="font-semibold text-text-tertiary">
                            {' '}
                            ({homeScorePen})
                          </span>
                        )}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-text-primary">
                        {awayScore ?? '-'}
                        {showPens && (
                          <span className="font-semibold text-text-tertiary">
                            {' '}
                            ({awayScorePen})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </MatchLink>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
