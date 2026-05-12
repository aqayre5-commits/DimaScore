// Realtime channel names, event names, and payload types.
// Used by Pusher server (worker) and Pusher client (browser components).

export const CHANNELS = {
  LIVE_SCORES: 'live-scores',
  fixture: (id: number) => `fixture-${id}`,
} as const;

export const EVENTS = {
  SCORE_UPDATE: 'score-update',
  STATUS_CHANGE: 'status-change',
} as const;

export interface ScoreUpdatePayload {
  fixtureId: number;
  homeScore: number | null;
  awayScore: number | null;
  statusCode: string;
  minute: number | null;
  extraMinute: number | null;
}

export interface StatusChangePayload {
  fixtureId: number;
  statusCode: string;
  minute: number | null;
}
