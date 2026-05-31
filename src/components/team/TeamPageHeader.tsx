import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FormDots } from '@/components/shared/FormSparkline';
import type { TeamDetail, FormResult } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';
import { codeToFlag } from '@/lib/flags';
import { slugify } from '@/lib/ingestion/slug';
import Image from 'next/image';

interface TeamPageHeaderProps {
  team: TeamDetail;
  locale: Locale;
  formResults?: FormResult[];
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

export function TeamPageHeader({ team, locale, formResults }: TeamPageHeaderProps) {
  const t = useTranslations('teamPage');
  const name = resolveTeamName(team, locale);
  const flag = team.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="h-full overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15">
      <div className="flex h-full items-stretch gap-5 p-2">
        {/* Team logo — fills vertical space */}
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={name}
            className="hidden h-full max-h-[140px] w-auto shrink-0 object-contain object-center md:block"
            width={140}
            height={140}
            priority
          />
        ) : flag ? (
          <span className="hidden text-6xl md:flex md:items-center">{flag}</span>
        ) : (
          <div className="hidden size-24 shrink-0 items-center justify-center rounded-lg bg-bg-surface-2 md:flex">
            <span className="text-3xl">&#9917;</span>
          </div>
        )}
        {/* Mobile-only smaller logo */}
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt={name}
            className="h-[72px] w-auto shrink-0 self-center object-contain md:hidden"
            width={72}
            height={72}
            priority
          />
        ) : flag ? (
          <span className="flex items-center text-4xl md:hidden">{flag}</span>
        ) : null}

        {/* Identity */}
        <div className="flex min-w-0 flex-1 flex-col py-1">
          <h1 className="font-display text-xl font-bold leading-tight text-text-primary md:text-2xl">
            {name}
          </h1>

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
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t('form')}
              </span>
              <FormDots results={formResults} />
            </div>
          )}

          {/* Quick facts — bordered pills, pushed to bottom */}
          {(team.venue || team.founded) && (
            <div className="mt-auto flex flex-wrap gap-3 pt-2">
              {team.founded && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold tabular-nums text-text-primary">
                    {team.founded}
                  </span>
                  <span className="text-[10px] text-text-tertiary">{t('founded_label')}</span>
                </div>
              )}
              {team.venue?.name && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold text-text-primary">{team.venue.name}</span>
                  <span className="text-[10px] text-text-tertiary">{t('stadium')}</span>
                </div>
              )}
              {team.venue?.capacity && (
                <div className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5">
                  <span className="text-sm font-bold tabular-nums text-text-primary">
                    {team.venue.capacity.toLocaleString()}
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
