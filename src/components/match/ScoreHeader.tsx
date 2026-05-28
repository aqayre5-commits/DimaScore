import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { LiveScoreDisplay } from '@/components/match/LiveScoreDisplay';
import type { MatchDetail } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface ScoreHeaderProps {
  match: MatchDetail;
  locale: Locale;
  competitionHref?: string | null;
}

export function ScoreHeader({ match, locale, competitionHref }: ScoreHeaderProps) {
  const t = useTranslations('matchDetail');

  const homeName = getTeamDisplayName(match.homeTeam, locale);
  const awayName = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const homeFlag =
    match.homeTeam?.isNational && match.homeTeam.countryCode
      ? codeToFlag(match.homeTeam.countryCode)
      : null;
  const awayFlag =
    match.awayTeam?.isNational && match.awayTeam.countryCode
      ? codeToFlag(match.awayTeam.countryCode)
      : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      {/* Competition + round */}
      <div className="border-b border-border-subtle px-4 py-2.5 text-center">
        <p className="text-xs font-medium text-text-secondary">
          {competitionHref ? (
            <Link href={competitionHref} className="hover:text-accent hover:underline">
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
                className="flex flex-col items-center gap-2 hover:opacity-80"
              >
                {homeFlag && <span className="text-4xl leading-none">{homeFlag}</span>}
                {!homeFlag && match.homeTeam?.logoUrl && (
                  <img
                    src={match.homeTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    loading="lazy"
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
                  <img
                    src={match.homeTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    loading="lazy"
                  />
                )}
                <span className="text-base font-semibold text-text-primary">{homeName}</span>
              </>
            )}
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
                className="flex flex-col items-center gap-2 hover:opacity-80"
              >
                {awayFlag && <span className="text-4xl leading-none">{awayFlag}</span>}
                {!awayFlag && match.awayTeam?.logoUrl && (
                  <img
                    src={match.awayTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    loading="lazy"
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
                  <img
                    src={match.awayTeam.logoUrl}
                    alt=""
                    className="size-14 object-contain"
                    loading="lazy"
                  />
                )}
                <span className="text-base font-semibold text-text-primary">{awayName}</span>
              </>
            )}
          </div>
        </div>

        {/* Venue + referee */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-text-tertiary">
          {match.venue && (match.venue.name || match.venue.city) && (
            <span>
              {t('venue')}: {[match.venue.name, match.venue.city].filter(Boolean).join(', ')}
            </span>
          )}
          {match.referee && (
            <span>
              {t('referee')}: {match.referee}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
