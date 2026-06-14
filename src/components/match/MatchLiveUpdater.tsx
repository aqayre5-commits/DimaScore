'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getPusherClient } from '@/lib/realtime/pusher-client';
import { CHANNELS, EVENTS } from '@/lib/realtime/channels';
import type { ScoreUpdatePayload } from '@/lib/realtime/channels';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';

const LIVE_CODES = new Set<string>(LIVE_CODES_ARRAY);
const TERMINAL_CODES = new Set([
  'FT',
  'AET',
  'PEN',
  'SUSP',
  'INT',
  'PST',
  'CANC',
  'ABD',
  'AWD',
  'WO',
]);

export interface LiveMatchState {
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
  /** True when score just changed — triggers flash animation. */
  scoreFlash: boolean;
}

const LiveMatchContext = createContext<LiveMatchState | null>(null);

/**
 * Returns live match state if inside a MatchLiveUpdater, or null otherwise.
 * Components can use this to overlay live data on top of server-rendered props.
 */
export function useLiveMatch(): LiveMatchState | null {
  return useContext(LiveMatchContext);
}

interface MatchLiveUpdaterProps {
  fixtureId: number;
  initialStatus: string;
  initialHomeScore: number | null;
  initialAwayScore: number | null;
  initialMinute: number | null;
  initialExtraMinute: number | null;
  children: React.ReactNode;
}

export function MatchLiveUpdater({
  fixtureId,
  initialStatus,
  initialHomeScore,
  initialAwayScore,
  initialMinute,
  initialExtraMinute,
  children,
}: MatchLiveUpdaterProps) {
  const [state, setState] = useState<LiveMatchState>({
    homeScore: initialHomeScore,
    awayScore: initialAwayScore,
    statusCode: initialStatus,
    minute: initialMinute,
    extraMinute: initialExtraMinute,
    scoreFlash: false,
  });

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    (payload: ScoreUpdatePayload) => {
      if (payload.fixtureId !== fixtureId) return;

      setState((prev) => {
        const scoreChanged =
          prev.homeScore !== payload.homeScore || prev.awayScore !== payload.awayScore;

        // Invalidate all match sub-queries (events, stats, lineups, sidebar) on score change
        if (scoreChanged) {
          queryClient.invalidateQueries({ queryKey: ['match', String(fixtureId)] });
        }

        return {
          homeScore: payload.homeScore,
          awayScore: payload.awayScore,
          statusCode: payload.statusCode,
          minute: payload.minute,
          extraMinute: payload.extraMinute,
          scoreFlash: scoreChanged,
        };
      });
    },
    [fixtureId, queryClient],
  );

  // Clear flash after animation duration
  useEffect(() => {
    if (state.scoreFlash) {
      flashTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, scoreFlash: false }));
      }, 1500);
      return () => {
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      };
    }
  }, [state.scoreFlash]);

  // Subscribe to fixture-specific Pusher channel
  useEffect(() => {
    // Only subscribe if the match is live
    if (!LIVE_CODES.has(initialStatus) && !LIVE_CODES.has(state.statusCode)) return;

    // If match has transitioned to terminal, don't subscribe
    if (TERMINAL_CODES.has(state.statusCode)) return;

    let pusher: ReturnType<typeof getPusherClient>;
    try {
      pusher = getPusherClient();
    } catch {
      // Pusher env vars not configured — graceful degradation
      return;
    }

    const channelName = CHANNELS.fixture(fixtureId);
    const channel = pusher.subscribe(channelName);
    channel.bind(EVENTS.SCORE_UPDATE, handleUpdate);

    return () => {
      channel.unbind(EVENTS.SCORE_UPDATE, handleUpdate);
      pusher.unsubscribe(channelName);
    };
  }, [fixtureId, initialStatus, state.statusCode, handleUpdate]);

  // 30s live poll (shared) — the reliable source that ticks the minute and survives a
  // starved or disconnected Pusher. Applies this fixture's patch to the overlay state.
  const livePatches = useLiveFixtures();
  const poll = livePatches.get(fixtureId);
  const prevPollScore = useRef(`${initialHomeScore}-${initialAwayScore}`);
  useEffect(() => {
    if (!poll) return;
    const scoreKey = `${poll.homeScore}-${poll.awayScore}`;
    const scoreChanged = scoreKey !== prevPollScore.current;
    prevPollScore.current = scoreKey;
    setState({
      homeScore: poll.homeScore,
      awayScore: poll.awayScore,
      statusCode: poll.statusCode,
      minute: poll.minute,
      extraMinute: poll.extraMinute,
      scoreFlash: scoreChanged,
    });
    if (scoreChanged) {
      queryClient.invalidateQueries({ queryKey: ['match', String(fixtureId)] });
    }
  }, [poll, fixtureId, queryClient]);

  return <LiveMatchContext.Provider value={state}>{children}</LiveMatchContext.Provider>;
}
