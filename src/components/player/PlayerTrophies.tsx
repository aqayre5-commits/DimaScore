import { useTranslations } from 'next-intl';
import type { PlayerTrophy } from '@/lib/db/queries/player';
import type { Locale } from '@/lib/i18n/config';

interface PlayerTrophiesProps {
  trophies: PlayerTrophy[];
  locale: Locale;
}

interface GroupedTrophy {
  league: string;
  country: string | null;
  entries: { season: string | null; place: string | null }[];
}

function groupByLeague(trophies: PlayerTrophy[]): GroupedTrophy[] {
  const map = new Map<string, GroupedTrophy>();

  for (const t of trophies) {
    const key = `${t.league}||${t.country ?? ''}`;
    let group = map.get(key);
    if (!group) {
      group = { league: t.league, country: t.country, entries: [] };
      map.set(key, group);
    }
    if (t.season) {
      group.entries.push({ season: t.season, place: t.place });
    }
  }

  // Sort entries within each group: most recent season first
  for (const group of map.values()) {
    group.entries.sort((a, b) => (b.season ?? '').localeCompare(a.season ?? ''));
  }

  return [...map.values()]
    .filter((g) => g.entries.length > 0)
    .sort((a, b) => competitionRank(a.league) - competitionRank(b.league));
}

function competitionRank(league: string): number {
  const l = league.toLowerCase();
  if (l.includes('champions league') || l.includes('uefa champions')) return 1;
  if (l.includes('world cup') && !l.includes('club')) return 2;
  if (l.includes('europa league')) return 3;
  if (l.includes('conference league')) return 4;
  if (
    l.includes('copa america') ||
    l.includes('euro championship') ||
    l.includes('african cup') ||
    l.includes('afcon')
  )
    return 5;
  if (
    l.includes('premier league') ||
    l.includes('la liga') ||
    l.includes('serie a') ||
    l.includes('bundesliga') ||
    l.includes('ligue 1') ||
    l.includes('botola')
  )
    return 6;
  if (l.includes('league') || l.includes('liga') || l.includes('serie') || l.includes('division'))
    return 10;
  if (
    l.includes('fa cup') ||
    l.includes('copa del rey') ||
    l.includes('coupe') ||
    l.includes('dfb') ||
    l.includes('coppa')
  )
    return 15;
  if (l.includes('league cup') || l.includes('carabao') || l.includes('efl cup')) return 16;
  if (l.includes('club world')) return 20;
  if (
    l.includes('super cup') ||
    l.includes('supercup') ||
    l.includes('community shield') ||
    l.includes('supercopa') ||
    l.includes('trophée')
  )
    return 25;
  if (l.includes('friendly') || l.includes('challenge') || l.includes('trophy')) return 30;
  return 50;
}

function translatePlace(place: string | null, t: ReturnType<typeof useTranslations>): string {
  if (!place) return '—';
  const lower = place.toLowerCase();
  if (lower === 'winner') return t('placeWinner');
  if (lower === '2nd place' || lower === '2nd') return t('place2nd');
  if (lower === '3rd place' || lower === '3rd') return t('place3rd');
  if (lower === 'runner-up' || lower === 'runner up') return t('placeRunnerUp');
  return place;
}

function placeColorClass(place: string | null): string {
  if (place?.toLowerCase() === 'winner') return 'text-amber-500 font-semibold';
  return 'text-text-secondary';
}

export function PlayerTrophies({ trophies }: PlayerTrophiesProps) {
  const t = useTranslations('playerPage');

  if (trophies.length === 0) {
    return (
      <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('trophiesComingSoon')}</p>
      </div>
    );
  }

  const grouped = groupByLeague(trophies);

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface overflow-hidden">
      {grouped.map((group, gi) => (
        <div key={`${group.league}-${group.country ?? ''}`}>
          {/* Competition header bar */}
          <div
            className={`bg-bg-surface-2 px-4 py-2.5 ${gi > 0 ? 'border-t border-border-subtle' : ''}`}
          >
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
              {group.league}
              {group.country && ` (${group.country})`}
            </h3>
          </div>

          {/* Season rows */}
          <div className="divide-y divide-border-subtle">
            {group.entries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-sm tabular-nums text-accent-green font-medium">
                  {entry.season ?? '—'}
                </span>
                <span className={`text-sm ${placeColorClass(entry.place)}`}>
                  {translatePlace(entry.place, t)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
