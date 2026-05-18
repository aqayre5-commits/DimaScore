import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { formatMatchDate, formatMatchTime } from '@/lib/utils/date';
import type { MatchDetail } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface ScoreHeaderProps {
  match: MatchDetail;
  locale: Locale;
}

type RenderState = 'upcoming' | 'live' | 'finished' | 'interrupted';

const LIVE_CODES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE']);
const FINISHED_CODES = new Set(['FT', 'AET', 'PEN']);
const INTERRUPTED_CODES = new Set(['SUSP', 'INT', 'PST', 'CANC', 'ABD', 'AWD', 'WO']);

function getRenderState(statusCode: string): RenderState {
  if (LIVE_CODES.has(statusCode)) return 'live';
  if (FINISHED_CODES.has(statusCode)) return 'finished';
  if (INTERRUPTED_CODES.has(statusCode)) return 'interrupted';
  return 'upcoming';
}

const INTERRUPTED_LABEL_KEY: Record<string, string> = {
  SUSP: 'suspended',
  INT: 'interrupted',
  PST: 'postponed',
  CANC: 'cancelled',
  ABD: 'abandoned',
  AWD: 'awarded',
  WO: 'walkover',
};

export function ScoreHeader({ match, locale }: ScoreHeaderProps) {
  const t = useTranslations('matchDetail');

  const state = getRenderState(match.statusCode);
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
    <div className="rounded-lg border border-border-subtle bg-bg-surface">
      {/* Competition + round */}
      <div className="border-b border-border-subtle px-4 py-2.5 text-center">
        <p className="text-xs font-medium text-text-secondary">
          {compName}
          {match.round && <span className="text-text-tertiary"> &middot; {match.round}</span>}
        </p>
      </div>

      {/* Main score area */}
      <div className="flex flex-col items-center gap-4 px-4 py-6">
        {/* Teams + score row */}
        <div className="flex w-full items-center justify-center gap-4">
          {/* Home team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {homeFlag && <span className="text-4xl leading-none">{homeFlag}</span>}
            {!homeFlag && match.homeTeam?.logoUrl && (
              <img
                src={match.homeTeam.logoUrl}
                alt=""
                className="size-10 object-contain"
                loading="lazy"
              />
            )}
            <span className="text-base font-semibold text-text-primary">{homeName}</span>
          </div>

          {/* Score / status center */}
          <div className="flex shrink-0 flex-col items-center gap-1">
            {state === 'upcoming' && (
              <>
                <p className="text-2xl font-bold tabular-nums text-text-tertiary">&ndash;</p>
                <p className="text-sm font-semibold tabular-nums text-text-primary">
                  {formatMatchTime(match.kickoffAt, locale)}
                </p>
                <p className="text-xs text-text-secondary">
                  {formatMatchDate(match.kickoffAt, locale)}
                </p>
              </>
            )}

            {state === 'live' && (
              <>
                <p className="text-3xl font-bold tabular-nums text-text-primary">
                  {match.homeScore ?? 0} &ndash; {match.awayScore ?? 0}
                </p>
                <span className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-score-live opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-score-live" />
                  </span>
                  <span className="text-xs font-bold text-score-live">
                    {match.statusCode === 'HT'
                      ? t('halfTime')
                      : match.minute != null
                        ? `${match.minute}'${match.extraMinute ? `+${match.extraMinute}` : ''}`
                        : match.statusCode}
                  </span>
                </span>
              </>
            )}

            {state === 'finished' && (
              <>
                <p className="text-3xl font-bold tabular-nums text-text-primary">
                  {match.homeScore ?? 0} &ndash; {match.awayScore ?? 0}
                </p>
                <span className="text-xs font-medium text-text-tertiary">
                  {match.statusCode === 'AET'
                    ? t('extraTime')
                    : match.statusCode === 'PEN'
                      ? t('penalties')
                      : t('fullTime')}
                </span>
                <ScoreBreakdown match={match} t={t} />
              </>
            )}

            {state === 'interrupted' && (
              <>
                {match.homeScore != null && match.awayScore != null ? (
                  <p className="text-3xl font-bold tabular-nums text-text-primary">
                    {match.homeScore} &ndash; {match.awayScore}
                  </p>
                ) : (
                  <p className="text-2xl font-bold tabular-nums text-text-tertiary">&ndash;</p>
                )}
                <span className="text-xs font-medium text-status-warning">
                  {t(INTERRUPTED_LABEL_KEY[match.statusCode] as never)}
                </span>
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {awayFlag && <span className="text-4xl leading-none">{awayFlag}</span>}
            {!awayFlag && match.awayTeam?.logoUrl && (
              <img
                src={match.awayTeam.logoUrl}
                alt=""
                className="size-10 object-contain"
                loading="lazy"
              />
            )}
            <span className="text-base font-semibold text-text-primary">{awayName}</span>
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

/** Period breakdown for finished matches (HT, ET, PEN lines). */
function ScoreBreakdown({
  match,
  t,
}: {
  match: MatchDetail;
  t: ReturnType<typeof useTranslations>;
}) {
  const parts: string[] = [];

  if (match.homeScoreHt != null && match.awayScoreHt != null) {
    parts.push(`${t('halfTime')} ${match.homeScoreHt}-${match.awayScoreHt}`);
  }

  if (match.statusCode === 'AET' && match.homeScoreEt != null && match.awayScoreEt != null) {
    parts.push(`${t('extraTime')} ${match.homeScoreEt}-${match.awayScoreEt}`);
  }

  if (match.statusCode === 'PEN' && match.homeScorePen != null && match.awayScorePen != null) {
    parts.push(`${t('penalties')} ${match.homeScorePen}-${match.awayScorePen}`);
  }

  if (parts.length === 0) return null;

  return <p className="mt-0.5 text-xs tabular-nums text-text-tertiary">({parts.join(' · ')})</p>;
}
