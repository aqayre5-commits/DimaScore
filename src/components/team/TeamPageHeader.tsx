import { useTranslations } from 'next-intl';
import type { TeamDetail } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';
import { codeToFlag } from '@/lib/flags';

interface TeamPageHeaderProps {
  team: TeamDetail;
  locale: Locale;
}

function resolveTeamName(team: TeamDetail, locale: Locale): string {
  return (
    team.name[locale] ??
    team.name['en'] ??
    team.shortName[locale] ??
    team.shortName['en'] ??
    '\u2014'
  );
}

export function TeamPageHeader({ team, locale }: TeamPageHeaderProps) {
  const t = useTranslations('teamPage');
  const name = resolveTeamName(team, locale);
  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface px-5 py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Left: logo + identity */}
        <div className="flex flex-1 items-center gap-4">
          {/* Team logo */}
          <div className="flex size-[120px] shrink-0 items-center justify-center">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={name}
                width={76}
                height={76}
                className="size-full object-contain"
                loading="eager"
              />
            ) : flag ? (
              <span className="text-5xl">{flag}</span>
            ) : (
              <span className="text-2xl text-text-tertiary">&#9917;</span>
            )}
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold leading-tight text-text-primary">
              {name}
            </h1>

            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-text-secondary">
              {flag && <span>{flag}</span>}
              {team.founded && (
                <>
                  {flag && <span className="text-text-tertiary">&middot;</span>}
                  <span>{t('founded', { year: team.founded })}</span>
                </>
              )}
            </div>

            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-tertiary">
              {team.coach && (
                <span>
                  {t('coach')}: <span className="text-text-secondary">{team.coach.name}</span>
                </span>
              )}
              {team.venue && (team.venue.name || team.venue.city) && (
                <span>{[team.venue.name, team.venue.city].filter(Boolean).join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
