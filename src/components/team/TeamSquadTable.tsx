import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import type { SquadPlayer } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamSquadTableProps {
  players: SquadPlayer[];
  locale: Locale;
}

const POSITION_ORDER = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'] as const;

function positionKey(position: string | null): string {
  switch (position) {
    case 'Goalkeeper':
      return 'goalkeeper';
    case 'Defender':
      return 'defender';
    case 'Midfielder':
      return 'midfielder';
    case 'Attacker':
      return 'attacker';
    default:
      return 'attacker';
  }
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

function resolvePlayerName(player: SquadPlayer, locale: Locale): string {
  return (
    player.name[locale] ??
    player.name['en'] ??
    [player.firstname, player.lastname].filter(Boolean).join(' ') ??
    '—'
  );
}

export function TeamSquadTable({ players, locale }: TeamSquadTableProps) {
  const t = useTranslations('teamPage');

  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noSquadData')}</p>
      </div>
    );
  }

  const grouped = new Map<string, SquadPlayer[]>();
  for (const pos of POSITION_ORDER) grouped.set(pos, []);
  for (const player of players) {
    const key = POSITION_ORDER.includes(player.position as (typeof POSITION_ORDER)[number])
      ? player.position!
      : 'Attacker';
    grouped.get(key)!.push(player);
  }

  return (
    <div className="space-y-5">
      {POSITION_ORDER.map((pos) => {
        const group = grouped.get(pos);
        if (!group || group.length === 0) return null;
        return (
          <div key={pos}>
            <h3 className="label-caps mb-3 border-b border-border-subtle pb-2 text-accent-green">
              {t(positionKey(pos))}
            </h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
              {group.map((player) => {
                const age = computeAge(player.birthDate);
                return (
                  <a
                    key={player.id}
                    href={`/${locale}/joueur/${player.slug}`}
                    className="flex flex-col items-center gap-1 rounded-lg px-1 py-2.5 transition-colors hover:bg-accent-green/[0.06]"
                  >
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt=""
                        width={48}
                        height={48}
                        className="size-12 rounded-full border-2 border-border-subtle object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-full border-2 border-border-subtle bg-bg-surface-2 text-sm text-text-tertiary">
                        {player.shirtNumber ?? '?'}
                      </div>
                    )}
                    <span className="text-center text-xs font-semibold leading-tight text-text-primary">
                      {resolvePlayerName(player, locale)}
                    </span>
                    {age != null && <span className="text-[11px] text-text-secondary">{age}</span>}
                    {player.injured && (
                      <span className="text-[10px] font-semibold text-accent-crimson">+</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
