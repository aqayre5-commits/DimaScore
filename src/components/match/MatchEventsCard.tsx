import { useTranslations } from 'next-intl';
import { Circle, Square, ArrowRightLeft } from 'lucide-react';
import type { MatchEvent } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface MatchEventsCardProps {
  events: MatchEvent[];
  homeTeamId: number;
  locale: Locale;
}

function playerName(
  player: { id: number; name: Record<string, string> } | null,
  locale: string,
): string {
  if (!player?.name) return '';
  return player.name[locale] ?? player.name['en'] ?? '';
}

export function MatchEventsCard({ events, homeTeamId, locale }: MatchEventsCardProps) {
  const t = useTranslations('matchDetail');

  // Filter to key events: goals, cards, substitutions
  const keyEvents = events.filter((e) => {
    const type = e.type?.toLowerCase() ?? '';
    return type === 'goal' || type === 'card' || type === 'subst';
  });

  if (keyEvents.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('matchEvents')}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {keyEvents.map((event) => {
          const isHome = event.teamId === homeTeamId;
          return <CompactEventRow key={event.id} event={event} isHome={isHome} locale={locale} />;
        })}
      </div>
      <a
        href="#sec-events"
        className="block border-t border-border-subtle px-4 py-2 text-center text-xs font-medium text-accent-azure hover:bg-bg-surface-2 hover:underline"
      >
        {t('seeAllEvents')}
      </a>
    </div>
  );
}

function CompactEventRow({
  event,
  isHome,
  locale,
}: {
  event: MatchEvent;
  isHome: boolean;
  locale: string;
}) {
  const type = event.type?.toLowerCase() ?? '';
  const detail = event.detail ?? '';
  const minute = event.extraMinute ? `${event.minute}+${event.extraMinute}'` : `${event.minute}'`;

  const { icon, label } = resolveCompactDisplay(type, detail, event, locale);

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <span className="w-9 shrink-0 text-[11px] font-semibold tabular-nums text-text-tertiary">
        {isHome ? minute : ''}
      </span>
      <span className="shrink-0">{icon}</span>
      <span
        className={`min-w-0 flex-1 truncate text-xs text-text-primary ${isHome ? 'text-start' : 'text-end'}`}
      >
        {label}
      </span>
      <span className="w-9 shrink-0 text-end text-[11px] font-semibold tabular-nums text-text-tertiary">
        {isHome ? '' : minute}
      </span>
    </div>
  );
}

function resolveCompactDisplay(
  type: string,
  detail: string,
  event: MatchEvent,
  locale: string,
): { icon: React.ReactNode; label: string } {
  const name = playerName(event.player, locale);
  const detailLower = detail.toLowerCase();

  if (type === 'goal') {
    const isMissed = detailLower.includes('missed');
    const isOwn = detailLower.includes('own goal');
    const isPen = detailLower.includes('penalty');

    if (isMissed) {
      return {
        icon: <Circle className="size-3 text-score-loss" />,
        label: `${name} (missed)`,
      };
    }
    if (isOwn) {
      return {
        icon: <Circle className="size-3 fill-score-loss text-score-loss" />,
        label: `${name} (OG)`,
      };
    }
    return {
      icon: <Circle className="size-3 fill-accent-emerald text-accent-emerald" />,
      label: isPen ? `${name} (P)` : name,
    };
  }

  if (type === 'card') {
    const isRed = detailLower.includes('red');
    const isSecondYellow = detailLower.includes('second yellow');

    if (isSecondYellow) {
      return {
        icon: (
          <span className="relative flex size-3 items-center justify-center">
            <Square
              className="absolute size-2 fill-yellow-400 text-yellow-400"
              style={{ top: 0, left: 0 }}
            />
            <Square
              className="absolute size-2 fill-red-500 text-red-500"
              style={{ bottom: 0, right: 0 }}
            />
          </span>
        ),
        label: name,
      };
    }
    if (isRed) {
      return {
        icon: <Square className="size-3 fill-red-500 text-red-500" />,
        label: name,
      };
    }
    return {
      icon: <Square className="size-3 fill-yellow-400 text-yellow-400" />,
      label: name,
    };
  }

  if (type === 'subst') {
    const playerIn = playerName(event.player, locale);
    const playerOut = playerName(event.assist, locale);
    return {
      icon: <ArrowRightLeft className="size-3 text-accent-emerald" />,
      label: playerOut ? `${playerIn} for ${playerOut}` : playerIn,
    };
  }

  return {
    icon: <Circle className="size-3 text-text-tertiary" />,
    label: name,
  };
}
