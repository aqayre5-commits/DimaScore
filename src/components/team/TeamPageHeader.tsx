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
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
      <div className="flex items-start gap-5">
        {/* Team logo */}
        <div className="flex size-[88px] shrink-0 items-center justify-center rounded-xl bg-bg-surface-2 p-2">
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={name}
              width={72}
              height={72}
              className="size-[72px] object-contain"
              loading="eager"
            />
          ) : flag ? (
            <span className="text-5xl">{flag}</span>
          ) : (
            <span className="text-3xl text-text-tertiary">⚽</span>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight text-text-primary">
            {name}
          </h1>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-text-secondary">
            {flag && <span>{flag}</span>}
            {team.countryCode && <span>{team.countryCode}</span>}
            {team.founded && (
              <>
                <span className="text-text-tertiary">·</span>
                <span>{t('founded', { year: team.founded })}</span>
              </>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-tertiary">
            {team.coach && (
              <span className="flex items-center gap-1">
                {t('coach')}: <span className="text-text-secondary">{team.coach.name}</span>
              </span>
            )}
            {team.venue && (team.venue.name || team.venue.city) && (
              <span className="flex items-center gap-1">
                {[team.venue.name, team.venue.city].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
