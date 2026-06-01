import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { LiveScoreDisplay } from '@/components/match/LiveScoreDisplay';
import type { MatchDetail } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

export interface GoalScorer {
  playerName: string;
  minute: number;
  extraMinute: number | null;
  isOwnGoal: boolean;
  isPenalty: boolean;
  teamId: number | null;
}

interface ScoreHeaderProps {
  match: MatchDetail;
  locale: Locale;
  competitionHref?: string | null;
  goalScorers?: GoalScorer[];
}

export function ScoreHeader({
  match,
  locale,
  competitionHref,
  goalScorers = [],
}: ScoreHeaderProps) {
  const t = useTranslations('matchDetail');

  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const homeTeamId = match.homeTeam?.id ?? -1;
  const awayTeamId = match.awayTeam?.id ?? -1;
  const homeGoals = goalScorers.filter((g) => g.teamId === homeTeamId);
  const awayGoals = goalScorers.filter((g) => g.teamId === awayTeamId);

  const homeFlag =
    match.homeTeam?.isNational && match.homeTeam.countryCode
      ? codeToFlag(match.homeTeam.countryCode)
      : null;
  const awayFlag =
    match.awayTeam?.isNational && match.awayTeam.countryCode
      ? codeToFlag(match.awayTeam.countryCode)
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15">
      {/* Competition + round */}
      <div className="border-b border-border-subtle px-4 py-2.5 text-center">
        <p className="text-xs font-medium text-text-secondary">
          {competitionHref ? (
            <Link
              href={competitionHref}
              prefetch={false}
              className="hover:text-accent hover:underline"
            >
              {compName}
            </Link>
          ) : (
            compName
          )}
          {match.round && <span className="text-text-tertiary"> &middot; {match.round}</span>}
        </p>
      </div>

      {/* Main score area */}
      <div className="flex flex-col items-center gap-4 px-4 py-6">
        {/* Teams + score row */}
        <div className="flex w-full items-center justify-center gap-4">
          {/* Home team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {match.homeTeam?.slug ? (
              <Link
                href={`/${locale}/equipe/${match.homeTeam.slug}`}
                prefetch={false}
                className="flex flex-col items-center gap-2 hover:opacity-80"
              >
                {homeFlag && <span className="text-4xl leading-none">{homeFlag}</span>}
                {!homeFlag && match.homeTeam?.logoUrl && (
                  <Image
                    src={match.homeTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    width={56}
                    height={56}
                  />
                )}
                <span className="text-base font-semibold text-text-primary hover:text-accent hover:underline">
                  {homeName}
                </span>
              </Link>
            ) : (
              <>
                {homeFlag && <span className="text-4xl leading-none">{homeFlag}</span>}
                {!homeFlag && match.homeTeam?.logoUrl && (
                  <Image
                    src={match.homeTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    width={56}
                    height={56}
                  />
                )}
                <span className="text-base font-semibold text-text-primary">{homeName}</span>
              </>
            )}
            {homeGoals.length > 0 && <GoalScorerList goals={homeGoals} />}
          </div>

          {/* Score / status center — client component for live updates */}
          <LiveScoreDisplay
            statusCode={match.statusCode}
            homeScore={match.homeScore}
            awayScore={match.awayScore}
            homeScoreHt={match.homeScoreHt}
            awayScoreHt={match.awayScoreHt}
            homeScoreEt={match.homeScoreEt}
            awayScoreEt={match.awayScoreEt}
            homeScorePen={match.homeScorePen}
            awayScorePen={match.awayScorePen}
            minute={match.minute}
            extraMinute={match.extraMinute}
            kickoffAt={match.kickoffAt.toISOString()}
            locale={locale}
          />

          {/* Away team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {match.awayTeam?.slug ? (
              <Link
                href={`/${locale}/equipe/${match.awayTeam.slug}`}
                prefetch={false}
                className="flex flex-col items-center gap-2 hover:opacity-80"
              >
                {awayFlag && <span className="text-4xl leading-none">{awayFlag}</span>}
                {!awayFlag && match.awayTeam?.logoUrl && (
                  <Image
                    src={match.awayTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    width={56}
                    height={56}
                  />
                )}
                <span className="text-base font-semibold text-text-primary hover:text-accent hover:underline">
                  {awayName}
                </span>
              </Link>
            ) : (
              <>
                {awayFlag && <span className="text-4xl leading-none">{awayFlag}</span>}
                {!awayFlag && match.awayTeam?.logoUrl && (
                  <Image
                    src={match.awayTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    width={56}
                    height={56}
                  />
                )}
                <span className="text-base font-semibold text-text-primary">{awayName}</span>
              </>
            )}
            {awayGoals.length > 0 && <GoalScorerList goals={awayGoals} />}
          </div>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-text-tertiary">
          {match.venue && (match.venue.name || match.venue.city) && (
            <span>{[match.venue.name, match.venue.city].filter(Boolean).join(', ')}</span>
          )}
          {match.venue && match.referee && <span className="text-border-subtle">&middot;</span>}
          {match.referee && <span>{match.referee}</span>}
        </div>
      </div>
    </div>
  );
}

function GoalScorerList({ goals }: { goals: GoalScorer[] }) {
  return (
    <div className="mt-0.5 flex flex-col items-center gap-0.5">
      {goals.map((g, i) => {
        const min = g.extraMinute ? `${g.minute}+${g.extraMinute}'` : `${g.minute}'`;
        const suffix = g.isOwnGoal ? ' (OG)' : g.isPenalty ? ' (P)' : '';
        return (
          <span key={i} className="text-[11px] leading-tight text-text-secondary">
            {g.playerName} {min}
            {suffix}
          </span>
        );
      })}
    </div>
  );
}
