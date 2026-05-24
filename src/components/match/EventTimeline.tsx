import { useTranslations } from 'next-intl';
import { Circle, Square, ArrowRightLeft, Monitor } from 'lucide-react';
import type { MatchEvent } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';

interface EventTimelineProps {
  events: MatchEvent[];
  homeTeamId: number | null;
  locale: Locale;
}

function playerName(
  player: { id: number; name: Record<string, string> } | null,
  locale: string,
): string {
  if (!player) return '';
  return player.name[locale] ?? player.name['en'] ?? '';
}

export function EventTimeline({ events, homeTeamId, locale }: EventTimelineProps) {
  const t = useTranslations('matchDetail');

  if (events.length === 0) return null;

  // Find where to insert HT separator
  const htIndex = events.findIndex(
    (e) => e.minute > 45 || (e.minute === 45 && e.extraMinute != null && e.extraMinute > 0),
  );

  return (
    <div className="divide-y divide-border-subtle">
      {events.map((event, i) => {
        const isHome = event.teamId === homeTeamId;
        const showHtBefore = htIndex === i && htIndex > 0;

        return (
          <div key={event.id}>
            {showHtBefore && <HalfTimeSeparator label={t('halfTime')} />}
            <EventRow event={event} isHome={isHome} locale={locale} t={t} />
          </div>
        );
      })}
    </div>
  );
}

function HalfTimeSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-1.5">
      <div className="h-px flex-1 bg-border-subtle" />
      <span className="text-xs font-medium text-text-tertiary">{label}</span>
      <div className="h-px flex-1 bg-border-subtle" />
    </div>
  );
}

function EventRow({
  event,
  isHome,
  locale,
  t,
}: {
  event: MatchEvent;
  isHome: boolean;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const minute = event.extraMinute ? `${event.minute}+${event.extraMinute}'` : `${event.minute}'`;

  const { icon, content } = resolveEventDisplay(event, locale, t);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
    >
      {/* Minute */}
      <span className="w-10 shrink-0 text-xs font-semibold tabular-nums text-text-secondary">
        {isHome ? minute : ''}
      </span>

      {/* Icon */}
      <span className="shrink-0">{icon}</span>

      {/* Content */}
      <div className={`min-w-0 flex-1 ${isHome ? 'text-start' : 'text-end'}`}>{content}</div>

      {/* Minute (away side) */}
      <span className="w-10 shrink-0 text-end text-xs font-semibold tabular-nums text-text-secondary">
        {isHome ? '' : minute}
      </span>
    </div>
  );
}

function resolveEventDisplay(
  event: MatchEvent,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): { icon: React.ReactNode; content: React.ReactNode } {
  const type = event.type?.toLowerCase() ?? '';
  const detail = event.detail ?? '';

  // Goal
  if (type === 'goal') {
    const name = playerName(event.player, locale);
    const isOwn = detail.toLowerCase().includes('own goal');
    const isPen = detail.toLowerCase().includes('penalty');
    const isMissed = detail.toLowerCase().includes('missed');

    if (isMissed) {
      return {
        icon: <Circle className="size-4 text-score-loss" />,
        content: (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{name}</span>{' '}
            <span className="text-xs text-score-loss">({t('penaltyMissed')})</span>
          </p>
        ),
      };
    }

    if (isOwn) {
      return {
        icon: <Circle className="size-4 fill-score-loss text-score-loss" />,
        content: (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">{name}</span>{' '}
            <span className="text-xs text-score-loss">({t('ownGoal')})</span>
          </p>
        ),
      };
    }

    const assistName = playerName(event.assist, locale);
    return {
      icon: <Circle className="size-4 fill-accent-emerald text-accent-emerald" />,
      content: (
        <p className="text-sm">
          <span className="font-semibold text-text-primary">{name}</span>
          {isPen && <span className="text-xs text-text-tertiary"> ({t('penaltyGoal')})</span>}
          {assistName && <span className="text-xs text-text-tertiary"> ({assistName})</span>}
        </p>
      ),
    };
  }

  // Card
  if (type === 'card') {
    const name = playerName(event.player, locale);
    const isRed = detail.toLowerCase().includes('red');
    const isSecondYellow = detail.toLowerCase().includes('second yellow');

    if (isSecondYellow) {
      return {
        icon: (
          <span className="relative flex size-4 items-center justify-center">
            <Square
              className="absolute size-3 fill-yellow-400 text-yellow-400"
              style={{ top: 0, left: 0 }}
            />
            <Square
              className="absolute size-3 fill-red-500 text-red-500"
              style={{ bottom: 0, right: 0 }}
            />
          </span>
        ),
        content: (
          <p className="text-sm">
            <span className="font-medium text-text-primary">{name}</span>
          </p>
        ),
      };
    }

    if (isRed) {
      return {
        icon: <Square className="size-4 fill-red-500 text-red-500" />,
        content: (
          <p className="text-sm">
            <span className="font-medium text-text-primary">{name}</span>
          </p>
        ),
      };
    }

    // Yellow card (default)
    return {
      icon: <Square className="size-4 fill-yellow-400 text-yellow-400" />,
      content: (
        <p className="text-sm">
          <span className="font-medium text-text-primary">{name}</span>
        </p>
      ),
    };
  }

  // Substitution
  if (type === 'subst') {
    const playerIn = playerName(event.player, locale);
    const playerOut = playerName(event.assist, locale);

    return {
      icon: <ArrowRightLeft className="size-4 text-accent-emerald" />,
      content: (
        <p className="text-sm">
          <span className="font-medium text-accent-emerald">{playerIn}</span>
          {playerOut && (
            <>
              {' '}
              <span className="text-xs text-text-tertiary">
                {t('playerOut')}: {playerOut}
              </span>
            </>
          )}
        </p>
      ),
    };
  }

  // VAR
  if (type === 'var') {
    return {
      icon: <Monitor className="size-4 text-text-secondary" />,
      content: (
        <p className="text-sm">
          <span className="font-medium text-text-primary">{t('varDecision')}</span>
          {detail && <span className="text-xs text-text-tertiary"> — {detail}</span>}
        </p>
      ),
    };
  }

  // Fallback for unknown event types
  return {
    icon: <Circle className="size-4 text-text-tertiary" />,
    content: (
      <p className="text-sm text-text-secondary">
        {playerName(event.player, locale)}
        {detail && <span className="text-xs text-text-tertiary"> — {detail}</span>}
      </p>
    ),
  };
}
