import Link from 'next/link';
import Image from 'next/image';
import { MatchLink } from '@/components/shared/MatchLink';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { getTranslations } from 'next-intl/server';
import { formatMatchTime } from '@/lib/utils/date';
import { getMatchState } from '@/lib/match-status';
import { stripWomenSuffix, getTeamFlagUrl } from '@/lib/team-display';
import { getCachedNow } from '@/lib/cached-now';
import { FeaturedMatchCard } from '@/components/tournament/FeaturedMatchCard';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { TopPlayerRow } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';

interface LeagueRightRailCardProps {
  featuredMatches: FixtureWithTeams[];
  topScorer?: TopPlayerRow | null;
  topScorers?: TopPlayerRow[];
  locale: Locale;
  competitionName: string;
  /** When true, the first featured card stretches to fill parent height. */
  stretch?: boolean;
}

function resolveTeamCode(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '\u2014';
  return stripWomenSuffix(
    team.code ??
      team.shortName[locale] ??
      team.shortName['en'] ??
      (team.name[locale] ?? team.name['en'] ?? '\u2014').slice(0, 3).toUpperCase(),
  );
}

export async function LeagueRightRailCard({
  featuredMatches,
  topScorer,
  topScorers: topScorersProp,
  locale,
  competitionName,
  stretch,
}: LeagueRightRailCardProps) {
  const t = await getTranslations({ locale, namespace: 'leaguePage' });
  const now = new Date(await getCachedNow());

  // Merge legacy single scorer with array prop
  const scorers = topScorersProp ?? (topScorer ? [topScorer] : []);
  const displayScorers = scorers.slice(0, 3);

  if (featuredMatches.length === 0 && displayScorers.length === 0) return null;

  // Separate live matches for "LIVE NOW" header
  const liveMatches = featuredMatches.filter((f) => {
    const state = getMatchState(f.statusCode, f.kickoffAt, now);
    return state === 'live';
  });
  const featured = featuredMatches.slice(0, 2);
  const remaining = featuredMatches.slice(2);

  return (
    <div className={stretch ? 'flex h-full flex-1 flex-col' : 'space-y-4'}>
      {/* "See all live" header when live matches exist */}
      {liveMatches.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {t('featuredMatch')}
          </span>
          <Link
            href={`/${locale}`}
            className="text-xs font-semibold text-accent-azure transition-colors hover:text-accent-azure/80"
          >
            {t('seeAllLive')}
          </Link>
        </div>
      )}

      {/* Featured matches — unified FeaturedMatchCard */}
      {featured.map((fixture, idx) => (
        <FeaturedMatchCard key={fixture.id} fixture={fixture} locale={locale} />
      ))}

      {/* Remaining matches (compact rows) */}
      {remaining.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {competitionName}
            </span>
          </div>
          <div className="divide-y divide-border-subtle">
            {remaining.map((f) => (
              <CompactMatch key={f.id} fixture={f} locale={locale} now={now} />
            ))}
          </div>
        </div>
      )}

      {/* Top scorers — up to 3 with ranking */}
      {displayScorers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
          <div className="flex items-center justify-between bg-bg-surface-3 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
              {t('topScorers')}
            </span>
            {scorers.length > 3 && (
              <span className="text-xs font-semibold text-accent-azure">{t('viewAll')}</span>
            )}
          </div>
          <div className="divide-y divide-border-subtle">
            {displayScorers.map((scorer, idx) => (
              <Link
                key={scorer.playerId}
                href={`/${locale}/joueur/${scorer.playerSlug}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-accent-azure/5"
              >
                <span className="w-5 shrink-0 text-center text-xs font-bold text-text-tertiary">
                  {idx + 1}
                </span>
                {scorer.playerPhoto ? (
                  <Image
                    src={scorer.playerPhoto}
                    alt={scorer.playerName}
                    width={36}
                    height={36}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-full bg-bg-surface-2 text-xs font-semibold text-text-tertiary">
                    {scorer.playerName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-text-primary">
                    {scorer.playerName}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-tertiary">
                    {scorer.teamLogo && (
                      <Image
                        src={scorer.teamLogo}
                        alt=""
                        width={14}
                        height={14}
                        className="size-3.5 object-contain"
                      />
                    )}
                    <span className="truncate">{stripWomenSuffix(scorer.teamName)}</span>
                  </div>
                </div>
                <div className="text-lg font-bold tabular-nums text-text-primary">
                  {scorer.goals}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactMatch({
  fixture,
  locale,
  now,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  now: Date;
}) {
  const { homeTeam, awayTeam, kickoffAt, statusCode, homeScore, awayScore } = fixture;

  const homeCode = resolveTeamCode(homeTeam, locale);
  const awayCode = resolveTeamCode(awayTeam, locale);
  const _state = getMatchState(statusCode, kickoffAt, now);
  const isFinished = _state === 'finished';
  const isLive = _state === 'live';
  const kickoffTime = formatMatchTime(kickoffAt, locale);

  const preview = previewFromFixtureRow({
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    statusCode,
    kickoffAt,
  });

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={`/${locale}/match/${fixture.id}`}
      preview={preview}
      className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-accent-azure/5"
    >
      {/* Home */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {getTeamFlagUrl(homeTeam) ? (
          <Image
            src={getTeamFlagUrl(homeTeam)!}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 object-contain"
          />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
        <span className="truncate text-xs font-medium text-text-primary">{homeCode}</span>
      </div>

      {/* Score / time */}
      <div className="w-14 shrink-0 text-center">
        {homeScore != null && awayScore != null ? (
          <span
            className={`text-sm font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
          >
            {homeScore}-{awayScore}
          </span>
        ) : (
          <span className="text-xs tabular-nums text-text-secondary" suppressHydrationWarning>
            {isFinished ? '- : -' : kickoffTime}
          </span>
        )}
      </div>

      {/* Away */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <span className="truncate text-xs font-medium text-text-primary">{awayCode}</span>
        {getTeamFlagUrl(awayTeam) ? (
          <Image
            src={getTeamFlagUrl(awayTeam)!}
            alt=""
            width={16}
            height={16}
            className="size-4 shrink-0 object-contain"
          />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
      </div>
    </MatchLink>
  );
}
