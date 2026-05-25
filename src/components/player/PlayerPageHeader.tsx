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
  const posBadgeColor =
    POSITION_COLORS[player.position ?? ''] ?? 'bg-bg-surface-2 text-text-secondary';

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
      <div className="flex items-start gap-5">
        {/* Player photo */}
        <div className="size-[100px] shrink-0 overflow-hidden rounded-full border-[3px] border-border-subtle bg-bg-surface-2">
          {player.photoUrl ? (
            <img
              src={player.photoUrl}
              alt={name}
              width={100}
              height={100}
              className="size-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-3xl text-text-tertiary">
              👤
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight text-text-primary">
            {name}
          </h1>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
            <span
              className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${posBadgeColor}`}
            >
              {positionLabel(player.position, t)}
            </span>
            {flag && <span>{flag}</span>}
            {player.nationalityCode && <span>{player.nationalityCode}</span>}
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
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-bg-surface-2 px-2.5 py-1 text-[13px] font-medium text-text-primary">
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
        </div>
      </div>
    </div>
  );
}
