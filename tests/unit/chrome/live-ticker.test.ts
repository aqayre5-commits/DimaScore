import { describe, it, expect } from 'vitest';
import {
  applyScoreUpdate,
  applyStatusChange,
  TERMINAL_STATUSES,
  type LiveMatch,
} from '@/components/chrome/LiveTicker';
import type { ScoreUpdatePayload, StatusChangePayload } from '@/lib/realtime/channels';

describe('LiveTicker logic', () => {
  it('empty matches record produces no entries (component returns null)', () => {
    const matches: Record<number, LiveMatch> = {};

    // Verify empty state — maps to LiveTicker returning null
    expect(Object.keys(matches)).toHaveLength(0);

    // A terminal status on a non-existent fixture also stays empty
    const result = applyStatusChange(matches, {
      fixtureId: 999,
      statusCode: 'FT',
      minute: 90,
    });
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('score update populates match data (component renders strip)', () => {
    const payload: ScoreUpdatePayload = {
      fixtureId: 1,
      homeName: 'Brazil',
      awayName: 'Morocco',
      homeScore: 0,
      awayScore: 1,
      statusCode: '1H',
      minute: 34,
      extraMinute: null,
    };

    // Apply score update to empty record
    const after = applyScoreUpdate({}, payload);
    expect(Object.keys(after)).toHaveLength(1);
    expect(after[1]).toEqual({
      homeName: 'Brazil',
      awayName: 'Morocco',
      homeScore: 0,
      awayScore: 1,
      minute: 34,
      statusCode: '1H',
    });

    // Terminal status removes it — back to empty (returns null)
    for (const status of TERMINAL_STATUSES) {
      const cleaned = applyScoreUpdate(after, {
        fixtureId: 1,
        homeScore: 0,
        awayScore: 1,
        statusCode: status,
        minute: 90,
        extraMinute: null,
      });
      expect(Object.keys(cleaned)).toHaveLength(0);
    }
  });
});
