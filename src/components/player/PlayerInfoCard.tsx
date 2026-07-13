import { useTranslations } from 'next-intl';
import { Flag } from '@/components/shared/Flag';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import type { PlayerDetail } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';
import Image from 'next/image';

interface PlayerInfoCardProps {
  player: PlayerDetail;
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

function formatBirthDate(birthDate: string | null, locale: Locale): string {
  if (!birthDate) return '—';
  try {
    const loc = locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB';
    return new Intl.DateTimeFormat(loc, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(birthDate));
  } catch {
    return birthDate;
  }
}

function positionFullLabel(position: string | null, t: ReturnType<typeof useTranslations>): string {
  const short = {
    Goalkeeper: t('goalkeeper'),
    Defender: t('defender'),
    Midfielder: t('midfielder'),
    Attacker: t('attacker'),
  }[position ?? ''];
  if (!short) return position ?? '—';
  return `${position} (${short})`;
}

export function PlayerInfoCard({ player, locale }: PlayerInfoCardProps) {
  const t = useTranslations('playerPage');
  const age = computeAge(player.birthDate);
  const clubName = player.currentTeam
    ? (player.currentTeam.name[locale] ?? player.currentTeam.name['en'] ?? '—')
    : null;

  const rows: { label: string; value: React.ReactNode }[] = [];

  if (player.nationalityCode) {
    const nationalityName =
      getLeagueCountryName(player.nationalityCode, locale) ?? player.nationalityCode;
    rows.push({
      label: t('nationality'),
      value: (
        <span className="flex items-center gap-1.5">
          {player.nationalityCode && (
            <Flag countryCode={player.nationalityCode} size={14} className="inline-block" />
          )}
          <span>{nationalityName}</span>
        </span>
      ),
    });
  }

  if (player.birthDate) {
    rows.push({
      label: t('dateOfBirth'),
      value: formatBirthDate(player.birthDate, locale),
    });
  }

  if (age != null) {
    rows.push({ label: t('age'), value: age });
  }

  if (player.birthPlace) {
    const birthCountryName = player.birthCountryCode
      ? getLeagueCountryName(player.birthCountryCode, locale)
      : null;
    const birthPlaceDisplay = birthCountryName
      ? `${player.birthPlace}, ${birthCountryName}`
      : player.birthPlace;
    rows.push({ label: t('birthPlace'), value: birthPlaceDisplay });
  }

  if (player.height) {
    const h = player.height.includes('cm') ? player.height : `${player.height} cm`;
    rows.push({ label: t('height'), value: h });
  }

  if (player.weight) {
    const w = player.weight.includes('kg') ? player.weight : `${player.weight} kg`;
    rows.push({ label: t('weight'), value: w });
  }

  if (player.position) {
    rows.push({ label: t('position'), value: positionFullLabel(player.position, t) });
  }

  if (clubName) {
    rows.push({
      label: t('club'),
      value: (
        <span className="flex items-center gap-1.5">
          {player.currentTeam?.logoUrl && (
            <Image
              src={player.currentTeam.logoUrl}
              alt=""
              width={18}
              height={18}
              className="size-[18px] object-contain"
            />
          )}
          <span>{clubName}</span>
        </span>
      ),
    });
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-2.5">
        <h3 className="label-caps">{t('playerInfo')}</h3>
      </div>
      <div className="px-4 py-1">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between border-b border-border-subtle py-2.5 text-[13px] last:border-b-0"
          >
            <span className="text-text-secondary">{row.label}</span>
            <span className="font-medium text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
