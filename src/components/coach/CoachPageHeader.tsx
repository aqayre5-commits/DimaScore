import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { CoachDetail } from '@/lib/db/queries/coach';
import type { Locale } from '@/lib/i18n/config';

interface CoachPageHeaderProps {
  coach: CoachDetail;
  locale: Locale;
}

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function resolveTeamName(team: CoachDetail['currentTeam'], locale: Locale): string {
  if (!team) return '—';
  return team.name[locale] ?? team.name['en'] ?? '—';
}

export function CoachPageHeader({ coach, locale }: CoachPageHeaderProps) {
  const t = useTranslations('coachPage');
  const displayName =
    coach.firstname && coach.lastname ? `${coach.firstname} ${coach.lastname}` : coach.name;
  const age = computeAge(coach.birthDate);
  const flag = coach.nationalityCode ? codeToFlag(coach.nationalityCode) : null;
  const teamName = resolveTeamName(coach.currentTeam, locale);

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
      <div className="flex items-start gap-5">
        {/* Photo */}
        <div className="size-[100px] shrink-0 overflow-hidden rounded-full border-[3px] border-border-subtle bg-bg-surface-2">
          {coach.photoUrl ? (
            <img
              src={coach.photoUrl}
              alt={displayName}
              width={100}
              height={100}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl text-text-tertiary">
              &#128100;
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight text-text-primary">
            {displayName}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
            <span className="inline-block rounded bg-bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
              {t('manager')}
            </span>
            {flag && <span>{flag}</span>}
            {coach.nationalityCode && <span>{coach.nationalityCode}</span>}
            {age != null && (
              <>
                <span className="text-text-tertiary">·</span>
                <span>
                  {t('age')}: {age}
                </span>
              </>
            )}
          </div>

          {coach.currentTeam && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-bg-surface-2 px-2.5 py-1 text-[13px] font-medium text-text-primary">
              {coach.currentTeam.logoUrl && (
                <img
                  src={coach.currentTeam.logoUrl}
                  alt=""
                  className="size-4 object-contain"
                  loading="lazy"
                />
              )}
              <Link href={`/${locale}/equipe/${coach.currentTeam.id}`} className="hover:underline">
                {teamName}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
