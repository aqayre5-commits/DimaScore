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
    team.name[locale] ?? team.name['en'] ?? team.shortName[locale] ?? team.shortName['en'] ?? '—'
  );
}

export function TeamPageHeader({ team, locale }: TeamPageHeaderProps) {
  const t = useTranslations('teamPage');
  const name = resolveTeamName(team, locale);
  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Team logo or flag */}
      <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-bg-surface-2">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={name}
            width={64}
            height={64}
            className="size-16 object-contain"
            loading="eager"
          />
        ) : flag ? (
          <span className="text-4xl">{flag}</span>
        ) : (
          <span className="text-2xl text-text-tertiary">⚽</span>
        )}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold leading-tight text-text-primary">{name}</h1>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-text-secondary">
          {flag && <span>{flag}</span>}
          {team.countryCode && <span>{team.countryCode}</span>}
          {team.founded && (
            <>
              <span className="text-text-tertiary">·</span>
              <span>{t('founded', { year: team.founded })}</span>
            </>
          )}
        </div>

        {team.coach && (
          <p className="mt-1 text-sm text-text-secondary">
            {t('coach')}: {team.coach.name}
          </p>
        )}

        {team.venue && (team.venue.name || team.venue.city) && (
          <p className="mt-0.5 text-sm text-text-tertiary">
            {[team.venue.name, team.venue.city].filter(Boolean).join(', ')}
          </p>
        )}
      </div>
    </div>
  );
}
