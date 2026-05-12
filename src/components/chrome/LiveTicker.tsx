'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload, StatusChangePayload } from '@/lib/realtime/channels';
import { Badge } from '@/components/ui/badge';

export interface LiveMatch {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  minute: number | null;
  statusCode: string;
}

export const TERMINAL_STATUSES = new Set(['FT', 'AET', 'PEN', 'PST', 'CANC', 'ABD', 'AWD', 'WO']);

export function applyScoreUpdate(
  matches: Record<number, LiveMatch>,
  payload: ScoreUpdatePayload,
): Record<number, LiveMatch> {
  if (TERMINAL_STATUSES.has(payload.statusCode)) {
    const next = { ...matches };
    delete next[payload.fixtureId];
    return next;
  }
  return {
    ...matches,
    [payload.fixtureId]: {
      homeName: payload.homeName ?? 'Team',
      awayName: payload.awayName ?? 'Team',
      homeScore: payload.homeScore ?? 0,
      awayScore: payload.awayScore ?? 0,
      minute: payload.minute,
      statusCode: payload.statusCode,
    },
  };
}

export function applyStatusChange(
  matches: Record<number, LiveMatch>,
  payload: StatusChangePayload,
): Record<number, LiveMatch> {
  if (TERMINAL_STATUSES.has(payload.statusCode)) {
    const next = { ...matches };
    delete next[payload.fixtureId];
    return next;
  }
  if (payload.fixtureId in matches) {
    return {
      ...matches,
      [payload.fixtureId]: {
        ...matches[payload.fixtureId],
        statusCode: payload.statusCode,
        minute: payload.minute,
      },
    };
  }
  return matches;
}

export function LiveTicker() {
  const t = useTranslations('liveTicker');
  const [matches, setMatches] = useState<Record<number, LiveMatch>>({});

  useEffect(() => {
    const client = getPusherClient();
    const channel = client.subscribe(CHANNELS.LIVE_SCORES);

    channel.bind(EVENTS.SCORE_UPDATE, (payload: ScoreUpdatePayload) => {
      setMatches((prev) => applyScoreUpdate(prev, payload));
    });

    channel.bind(EVENTS.STATUS_CHANGE, (payload: StatusChangePayload) => {
      setMatches((prev) => applyStatusChange(prev, payload));
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(CHANNELS.LIVE_SCORES);
    };
  }, []);

  if (Object.keys(matches).length === 0) return null;

  return (
    <div className="flex items-center gap-3 overflow-x-auto bg-score-live-bg ps-4 pe-4 py-2">
      <Badge className="shrink-0 bg-score-live text-white text-[10px] font-bold">{t('live')}</Badge>
      <div className="flex items-center gap-4 flex-nowrap">
        {Object.entries(matches).map(([id, match]) => (
          <div key={id} className="flex shrink-0 items-center gap-2 text-sm text-text-primary">
            <span className="font-medium">{match.homeName}</span>
            <span className="font-bold text-score-live">
              {match.homeScore} - {match.awayScore}
            </span>
            <span className="font-medium">{match.awayName}</span>
            {match.minute != null && (
              <span className="text-xs text-text-tertiary">{match.minute}&apos;</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
