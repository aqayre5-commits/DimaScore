import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FormDots } from '@/components/shared/FormSparkline';
import type { TeamDetail, FormResult } from '@/lib/db/queries/team';
import { TeamFollowButton } from '@/components/team/TeamFollowButton';
import type { Locale } from '@/lib/i18n/config';
import { slugify } from '@/lib/ingestion/slug';
import { TeamMark } from '@/components/shared/TeamMark';
import { getTeamDisplayName } from '@/lib/utils/team-name';

interface TeamPageHeaderProps {
  team: TeamDetail;
  locale: Locale;
  formResults?: FormResult[];
}

function resolveTeamName(team: TeamDetail, locale: Locale): string {
  const name = getTeamDisplayName(team, locale);
  return name === 'TBD' ? '\u2014' : name;
}

export function TeamPageHeader({ team, locale, formResults }: TeamPageHeaderProps) {
  const t = useTranslations('teamPage');
  const name = resolveTeamName(team, locale);
  // National teams have no single home stadium — the API's "default venue" is misleading,
  // so suppress venue/capacity for them (founded year still shows). Audit P2-3.
  const headerVenue = team.isNational ? null : team.venue;

  return (
    <div className="h-full overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15">
      <div className="flex h-full items-stretch gap-5 p-2">
        {/* Team logo — fills vertical space. TeamMark uses the crest, the country
            flag for national sides, or the inline fallback shield. */}
        <TeamMark
          src={team.logoUrl}
          status={team.logoStatus}
          teamId={team.id}
          isNational={team.isNational}
          countryCode={team.countryCode}
          name={team.name}
          shortName={team.shortName}
          code={team.code}
          primary={team.primaryColor}
          secondary={team.secondaryColor}
          alt={name}
          className="hidden max-h-[140px] w-auto shrink-0 object-contain object-center md:block"
          size={140}
        />
        <TeamMark
          src={team.logoUrl}
          status={team.logoStatus}
          teamId={team.id}
          isNational={team.isNational}
          countryCode={team.countryCode}
          name={team.name}
          shortName={team.shortName}
          code={team.code}
          primary={team.primaryColor}
          secondary={team.secondaryColor}
          alt={name}
          className="max-h-[104px] w-auto shrink-0 self-stretch object-contain object-center md:hidden"
          size={104}
        />

        {/* Identity */}
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 break-words font-display text-xl font-bold leading-tight text-text-primary [overflow-wrap:anywhere] md:text-2xl">
              {name}
            </h1>
            <TeamFollowButton teamId={team.id} teamName={name} />
          </div>

          {team.coach && (
            <div className="mt-1 text-sm text-text-tertiary">
              <span>
                {t('coach')}:{' '}
                <Link
                  href={`/${locale}/entraineur/${slugify(team.coach.name)}-${team.coach.id}`}
                  className="text-text-secondary hover:text-text-primary hover:underline"
                >
                  {team.coach.name}
                </Link>
              </span>
            </div>
          )}

          {formResults && formResults.length > 0 && (
            <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t('form')}
              </span>
              <FormDots results={formResults} />
            </div>
          )}

          {/* Mobile-only dense meta line (Variant B) — replaces the pills below md */}
          {(team.founded || headerVenue?.name || headerVenue?.capacity) && (
            <p className="mt-1.5 truncate text-xs text-text-tertiary md:hidden">
              {[team.founded, headerVenue?.name, headerVenue?.capacity?.toLocaleString()]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}

          {/* Quick facts — bordered pills (desktop only), pushed to bottom */}
          {(headerVenue || team.founded) && (
            <div className="mt-auto hidden flex-wrap gap-3 pt-2 md:flex">
              {team.founded && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold tabular-nums text-text-primary">
                    {team.founded}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{t('founded_label')}</span>
                </div>
              )}
              {headerVenue?.name && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold text-text-primary">{headerVenue.name}</span>
                  <span className="text-[10px] text-text-tertiary">{t('stadium')}</span>
                </div>
              )}
              {headerVenue?.capacity && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold tabular-nums text-text-primary">
                    {headerVenue.capacity.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{t('capacity')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
