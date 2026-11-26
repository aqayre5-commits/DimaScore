import { beforeEach, describe, expect, it, vi } from 'vitest';

const permanentRedirect = vi.fn((to: string) => {
  throw new Error(`REDIRECT:${to}`);
});
vi.mock('next/navigation', () => ({ permanentRedirect: (to: string) => permanentRedirect(to) }));

const resolveCompetitionSeason = vi.fn();
vi.mock('@/lib/competitions/league-season-query', () => ({
  resolveCompetitionSeason: (...args: unknown[]) => resolveCompetitionSeason(...args),
}));

import { redirectOutOfWindowSeason } from '@/lib/competitions/season-redirect';

const resolved = (requestedOutOfWindow: boolean) => ({
  seasonYear: 2026,
  seasons: [],
  currentSeasonYear: 2026,
  requestedOutOfWindow,
});

describe('redirectOutOfWindowSeason', () => {
  beforeEach(() => {
    permanentRedirect.mockClear();
    resolveCompetitionSeason.mockReset();
  });

  it('308s an out-of-window season to the current-season URL', async () => {
    resolveCompetitionSeason.mockResolvedValue(resolved(true));
    await expect(
      redirectOutOfWindowSeason(2, 2024, '/en/competition/uefa/champions-league'),
    ).rejects.toThrow('REDIRECT:/en/competition/uefa/champions-league');
    expect(permanentRedirect).toHaveBeenCalledTimes(1);
    expect(resolveCompetitionSeason).toHaveBeenCalledWith(2, 2024);
  });

  it('does the same for a league (one resolver for every competition)', async () => {
    resolveCompetitionSeason.mockResolvedValue(resolved(true));
    await expect(
      redirectOutOfWindowSeason(39, 2023, '/en/competition/england/premier-league'),
    ).rejects.toThrow('REDIRECT:/en/competition/england/premier-league');
  });

  it('serves a season inside the window', async () => {
    resolveCompetitionSeason.mockResolvedValue(resolved(false));
    await expect(redirectOutOfWindowSeason(2, 2025, '/x')).resolves.toBeUndefined();
    expect(permanentRedirect).not.toHaveBeenCalled();
  });

  it('leaves constants-driven tournaments (World Cup) alone', async () => {
    resolveCompetitionSeason.mockResolvedValue(resolved(true));
    await expect(redirectOutOfWindowSeason(1, 2022, '/x')).resolves.toBeUndefined();
    expect(permanentRedirect).not.toHaveBeenCalled();
  });
});
