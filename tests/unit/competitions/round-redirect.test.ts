import { beforeEach, describe, expect, it, vi } from 'vitest';

const permanentRedirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
vi.mock('next/navigation', () => ({ permanentRedirect: (to: string) => permanentRedirect(to) }));

import { isPlayoffsAlias, redirectPlayoffsAlias } from '@/lib/competitions/round-redirect';

const UCL = 2;
const PREMIER_LEAGUE = 39;
const base = '/en/competition/uefa/champions-league';

describe('play-offs alias redirect', () => {
  beforeEach(() => {
    permanentRedirect.mockClear();
  });

  it.each(['knockout', 'knockout-round-play-offs', 'round-of-32'])(
    '308s /round/%s to /round/knockout-play-offs',
    (slug) => {
      expect(() => redirectPlayoffsAlias(UCL, slug, base)).toThrow(
        `REDIRECT:${base}/round/knockout-play-offs`,
      );
    },
  );

  it('keeps the season segment', () => {
    expect(() => redirectPlayoffsAlias(UCL, 'round-of-32', base, '2025')).toThrow(
      `REDIRECT:${base}/2025/round/knockout-play-offs`,
    );
  });

  it('leaves the canonical slug and other stages alone', () => {
    for (const slug of ['knockout-play-offs', 'round-of-16', 'final', 'league-phase']) {
      redirectPlayoffsAlias(UCL, slug, base);
    }
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it('does not touch non-UEFA competitions (a domestic "Round of 32" is a real round)', () => {
    expect(isPlayoffsAlias(PREMIER_LEAGUE, 'round-of-32')).toBe(false);
  });
});
