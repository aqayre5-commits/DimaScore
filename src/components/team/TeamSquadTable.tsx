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
    <div className="space-y-4">
      {POSITION_ORDER.map((pos) => {
        const group = grouped.get(pos);
        if (!group || group.length === 0) return null;
        return (
          <div
            key={pos}
            className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden"
          >
            <div className="border-b border-border-subtle px-4 py-2">
              <h3 className="label-caps">{t(positionKey(pos))}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-xs text-text-tertiary">
                  <th className="px-4 py-2 text-start font-medium">{t('number')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('player')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('age')}</th>
                  <th className="px-4 py-2 text-start font-medium">{t('nationality')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {group.map((player) => {
                  const age = computeAge(player.birthDate);
                  const flag = player.nationalityCode ? codeToFlag(player.nationalityCode) : null;
                  return (
                    <tr key={player.id} className="hover:bg-bg-surface-2 transition-colors">
                      <td className="px-4 py-2 tabular-nums text-text-secondary">
                        {player.shirtNumber ?? '—'}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {player.photoUrl ? (
                            <img
                              src={player.photoUrl}
                              alt=""
                              width={28}
                              height={28}
                              className="size-7 rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="size-7 rounded-full bg-bg-surface-2" />
                          )}
                          <span className="font-medium text-text-primary">
                            {resolvePlayerName(player, locale)}
                          </span>
                          {player.injured && (
                            <span className="text-xs text-accent-crimson" title="Injured">
                              +
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 tabular-nums text-text-secondary">{age ?? '—'}</td>
                      <td className="px-4 py-2">
                        {flag && <span title={player.nationalityCode ?? ''}>{flag}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
