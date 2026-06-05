import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { KeyPlayer } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface KeyPlayersCardProps {
  players: KeyPlayer[];
  locale: Locale;
}

function positionKey(position: string | null): string | null {
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
      return null;
  }
}

/**
 * Right-rail card: the team's top contributors (goals+assists) over recent
 * seasons, shown with position + current club. Renders nothing with no data.
 */
export async function KeyPlayersCard({ players, locale }: KeyPlayersCardProps) {
  if (players.length === 0) return null;
  const t = await getTranslations({ locale, namespace: 'teamPage' });

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps">{t('keyPlayers')}</h3>
      </div>
      <ul className="divide-y divide-border-subtle/60">
        {players.map((p) => {
          const name = p.name[locale] ?? p.name['en'] ?? '—';
          const club = p.clubName?.[locale] ?? p.clubName?.['en'] ?? null;
          const pk = positionKey(p.position);
          return (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              {p.photoUrl ? (
                <Image
                  src={p.photoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="size-9 shrink-0 rounded-full bg-bg-surface-2 object-cover"
                />
              ) : (
                <div className="size-9 shrink-0 rounded-full bg-bg-surface-2" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">{name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-text-tertiary">
                  {pk && <span>{t(pk)}</span>}
                  {pk && club && <span aria-hidden>·</span>}
                  {p.clubLogoUrl && (
                    <Image
                      src={p.clubLogoUrl}
                      alt=""
                      width={12}
                      height={12}
                      className="size-3 shrink-0 object-contain"
                    />
                  )}
                  {club && <span className="truncate">{club}</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
