import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { PlayerDetail } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerPageHeaderProps {
  player: PlayerDetail;
  locale: Locale;
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

export function PlayerPageHeader({ player, locale }: PlayerPageHeaderProps) {
  const t = useTranslations('playerPage');
  const name = resolvePlayerName(player, locale);
  const age = computeAge(player.birthDate);
  const flag = player.nationalityCode ? codeToFlag(player.nationalityCode) : null;
  const clubName = player.currentTeam
    ? (player.currentTeam.name[locale] ??
      player.currentTeam.name['en'] ??
      player.currentTeam.code ??
      '—')
    : null;

  return (
    <div className="flex items-start gap-4 py-4">
      {/* Player photo */}
      <div className="flex size-24 shrink-0 items-center justify-center rounded-full bg-bg-surface-2 overflow-hidden">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={name}
            width={96}
            height={96}
            className="size-24 object-cover"
            loading="eager"
          />
        ) : (
          <span className="text-3xl text-text-tertiary">👤</span>
        )}
      </div>

      {/* Identity */}
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold leading-tight text-text-primary">{name}</h1>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-text-secondary">
          <span>{positionLabel(player.position, t)}</span>
          {player.shirtNumber != null && (
            <>
              <span className="text-text-tertiary">·</span>
              <span>#{player.shirtNumber}</span>
            </>
          )}
          {age != null && (
            <>
              <span className="text-text-tertiary">·</span>
              <span>
                {t('age')}: {age}
              </span>
            </>
          )}
        </div>

        {clubName && (
          <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
            {player.currentTeam?.logoUrl && (
              <img
                src={player.currentTeam.logoUrl}
                alt=""
                width={20}
                height={20}
                className="size-5 object-contain"
                loading="eager"
              />
            )}
            <span>{clubName}</span>
          </div>
        )}

        {flag && (
          <p className="mt-1 text-sm text-text-tertiary">
            {flag} {player.nationalityCode}
          </p>
        )}

        {player.height && (
          <p className="mt-0.5 text-sm text-text-tertiary">
            {player.height}
            {player.weight ? ` · ${player.weight}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
