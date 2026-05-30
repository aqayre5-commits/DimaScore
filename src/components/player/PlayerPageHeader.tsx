import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { RatingSparkline } from '@/components/shared/FormSparkline';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import type { PlayerDetail } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerPageHeaderProps {
  player: PlayerDetail;
  locale: Locale;
  lastRatings?: number[];
}

function resolvePlayerName(player: PlayerDetail, locale: Locale): string {
  return (
    player.name[locale] ??
    player.name['en'] ??
    [player.firstname, player.lastname].filter(Boolean).join(' ') ??
    '—'
  );
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

const POSITION_COLORS: Record<string, string> = {
  Attacker: 'bg-accent-crimson/15 text-accent-crimson',
  Midfielder: 'bg-accent-green/15 text-accent-green',
  Defender: 'bg-accent-azure/15 text-accent-azure',
  Goalkeeper: 'bg-accent-amber/15 text-accent-amber',
};

function positionLabel(position: string | null, t: ReturnType<typeof useTranslations>): string {
  switch (position) {
    case 'Goalkeeper':
      return t('goalkeeper');
    case 'Defender':
      return t('defender');
    case 'Midfielder':
      return t('midfielder');
    case 'Attacker':
      return t('attacker');
    default:
      return position ?? '—';
  }
}

function ratingLabel(avg: number, t: ReturnType<typeof useTranslations>): string {
  if (avg >= 7.0) return t('goodForm');
  if (avg >= 6.0) return t('averageForm');
  return t('poorForm');
}

function ratingColor(avg: number): string {
  if (avg >= 7.0) return 'text-accent-green';
  if (avg >= 6.0) return 'text-accent-amber';
  return 'text-accent-crimson';
}

function ratingBgColor(avg: number): string {
  if (avg >= 7.0) return 'bg-accent-green';
  if (avg >= 6.0) return 'bg-accent-amber';
  return 'bg-accent-crimson';
}

export function PlayerPageHeader({ player, locale, lastRatings }: PlayerPageHeaderProps) {
  const t = useTranslations('playerPage');
  const name = resolvePlayerName(player, locale);
  const age = computeAge(player.birthDate);
  const flag = player.nationalityCode ? codeToFlag(player.nationalityCode) : null;
  const nationalityName = player.nationalityCode
    ? (getLeagueCountryName(player.nationalityCode, locale) ?? player.nationalityCode)
    : null;
  const clubName = player.currentTeam
    ? (player.currentTeam.name[locale] ??
      player.currentTeam.name['en'] ??
      player.currentTeam.code ??
      '—')
    : null;
  const posBadgeColor =
    POSITION_COLORS[player.position ?? ''] ?? 'bg-bg-surface-2 text-text-secondary';

  const avgRating =
    lastRatings && lastRatings.length > 0
      ? lastRatings.reduce((a, b) => a + b, 0) / lastRatings.length
      : null;

  return (
    <div className="h-full overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15">
      <div className="flex h-full items-stretch">
        {/* Player photo — fills left side edge-to-edge */}
        {player.photoUrl ? (
          <>
            {/* Desktop: full-height photo with gradient fade */}
            <div className="relative hidden w-[180px] shrink-0 md:block">
              <img
                src={player.photoUrl}
                alt={name}
                className="h-full w-full object-cover object-top"
                loading="eager"
              />
              {/* Gradient fade right edge */}
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-r from-transparent to-bg-surface" />
              {/* Gradient fade bottom */}
              <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-bg-surface to-transparent" />
            </div>
            {/* Mobile: circular photo */}
            <div className="flex shrink-0 items-center px-3 py-3 md:hidden">
              <img
                src={player.photoUrl}
                alt={name}
                className="size-[72px] shrink-0 rounded-full object-cover"
                loading="eager"
              />
            </div>
          </>
        ) : (
          <div className="hidden w-[180px] shrink-0 items-center justify-center bg-bg-surface-2 md:flex">
            <span className="text-5xl text-text-tertiary">&#128100;</span>
          </div>
        )}

        {/* Identity column */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-4 pr-5 md:py-5 md:pr-6">
          <div>
            <h1 className="font-display text-xl font-bold leading-tight text-text-primary md:text-[26px]">
              {name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${posBadgeColor}`}
              >
                {positionLabel(player.position, t)}
              </span>
              {flag && <span>{flag}</span>}
              {nationalityName && <span>{nationalityName}</span>}
              {age != null && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span>
                    {t('age')}: {age}
                  </span>
                </>
              )}
              {player.shirtNumber != null && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span>#{player.shirtNumber}</span>
                </>
              )}
            </div>

            {clubName && (
              <Link
                href={`/${locale}/equipe/${player.currentTeam?.slug ?? ''}`}
                className="mt-2.5 inline-flex items-center gap-2 text-[14px] font-medium text-text-primary transition-colors hover:text-accent-azure"
              >
                {player.currentTeam?.logoUrl && (
                  <img
                    src={player.currentTeam.logoUrl}
                    alt=""
                    width={22}
                    height={22}
                    className="size-[22px] object-contain"
                    loading="eager"
                  />
                )}
                <span>{clubName}</span>
              </Link>
            )}
          </div>

          {/* Rating section at bottom */}
          {avgRating != null && lastRatings && lastRatings.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {t('rating')}
              </span>
              <span
                className={`inline-flex size-9 items-center justify-center rounded-md text-sm font-bold text-white ${ratingBgColor(avgRating)}`}
              >
                {avgRating.toFixed(1)}
              </span>
              <span className={`text-[12px] font-medium ${ratingColor(avgRating)}`}>
                {ratingLabel(avgRating, t)}
              </span>
              <RatingSparkline ratings={lastRatings} width={100} height={28} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
