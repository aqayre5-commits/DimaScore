import { codeToFlag } from '@/lib/flags';
import { ShareButton } from '@/components/shared/ShareButton';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';

interface FeaturedMatchCardProps {
  fixture: FixtureWithTeams;
  locale: Locale;
  cardTitle: string;
  shareHash?: string;
}

/** Full localized name: name[locale] → name['en'] → shortName[locale] → shortName['en'] → code → '—' */
function resolveFullName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  if (!team) return '\u2014';
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.code ??
    '\u2014'
  );
}

/**
 * Featured match card — left rail Card 1 for cup/tournament pages.
 * Shows next/current match with team flags, kickoff time, and full team names.
 */
export function FeaturedMatchCard({
  fixture,
  locale,
  cardTitle,
  shareHash,
}: FeaturedMatchCardProps) {
  const { homeTeam, awayTeam, kickoffAt, venue } = fixture;

  const homeName = resolveFullName(homeTeam, locale);
  const awayName = resolveFullName(awayTeam, locale);

  const homeFlag =
    homeTeam?.isNational && homeTeam.countryCode ? codeToFlag(homeTeam.countryCode) : null;
  const awayFlag =
    awayTeam?.isNational && awayTeam.countryCode ? codeToFlag(awayTeam.countryCode) : null;

  const kickoffDate = kickoffAt.toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
  const kickoffTime = kickoffAt.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div id={shareHash} className="relative rounded-lg border border-border-subtle bg-bg-surface">
      {shareHash && (
        <div className="absolute end-2 top-2 z-10">
          <ShareButton title={cardTitle || 'Match'} hash={shareHash} />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 px-4 py-5">
        {/* Kickoff time */}
        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums text-text-primary">{kickoffTime}</p>
          <p className="text-xs uppercase text-text-secondary">{kickoffDate}</p>
        </div>

        {/* Teams */}
        <div className="flex w-full items-center justify-between gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {homeFlag && <span className="text-3xl leading-none">{homeFlag}</span>}
            <span className="text-sm font-medium text-text-primary">{homeName}</span>
          </div>

          <span className="text-xs font-medium text-text-secondary">vs</span>

          {/* Away */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            {awayFlag && <span className="text-3xl leading-none">{awayFlag}</span>}
            <span className="text-sm font-medium text-text-primary">{awayName}</span>
          </div>
        </div>

        {/* Venue */}
        {venue && (venue.name || venue.city) && (
          <p className="text-xs text-text-tertiary">
            📍 {[venue.name, venue.city].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
