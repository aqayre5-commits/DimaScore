import { describe, expect, it, vi } from 'vitest';
import {
  competitionSeasonRedirect,
  type SeasonSnapshot,
} from '@/lib/seo/competition-season-redirect';

// Current season 2026/27, last 2025/26; 2024/25 and older exist in the data and are not deleted.
const snapshot: SeasonSnapshot = {
  currentSeasonYear: 2026,
  availableSeasons: [
    { year: 2026, isCurrent: true, fixtureCount: 12 },
    { year: 2025, isCurrent: false, fixtureCount: 240 },
    { year: 2024, isCurrent: false, fixtureCount: 240 },
  ],
};
const load = vi.fn(async () => snapshot);

const UCL = '/en/competition/uefa/champions-league';
const PL = '/en/competition/england/premier-league';
const FA = '/en/competition/england/fa-cup';

describe('competitionSeasonRedirect (middleware 308s)', () => {
  it.each([
    [`${UCL}/2024`, UCL],
    [`${UCL}/2024/round/final`, UCL],
    [`${PL}/2023`, PL],
    [`${FA}/2024`, FA],
    [`${PL}/2024/`, PL],
  ])('%s → %s', async (path, target) => {
    expect(await competitionSeasonRedirect(path, load)).toBe(target);
  });

  it('serves the current and the last season', async () => {
    for (const p of [`${UCL}/2026`, `${UCL}/2025`, `${PL}/2025`, `${UCL}/2025/round/final`]) {
      expect(await competitionSeasonRedirect(p, load)).toBeNull();
    }
  });

  it('redirects a season with no data at all', async () => {
    expect(await competitionSeasonRedirect(`${UCL}/2031`, load)).toBe(UCL);
  });

  it('keeps the locale and the percent-encoded Arabic slugs of the request', async () => {
    const ar =
      '/ar/competition/%D8%A3%D9%88%D8%B1%D9%88%D8%A8%D8%A7/%D8%AF%D9%88%D8%B1%D9%8A-%D8%A3%D8%A8%D8%B7%D8%A7%D9%84-%D8%A3%D9%88%D8%B1%D9%88%D8%A8%D8%A7';
    expect(await competitionSeasonRedirect(`${ar}/2024`, load)).toBe(ar);
  });

  it.each(['knockout', 'knockout-round-play-offs', 'round-of-32'])(
    'sends the UEFA play-offs alias /round/%s to /round/knockout-play-offs',
    async (slug) => {
      expect(await competitionSeasonRedirect(`${UCL}/round/${slug}`, load)).toBe(
        `${UCL}/round/knockout-play-offs`,
      );
      expect(await competitionSeasonRedirect(`${UCL}/2025/round/${slug}`, load)).toBe(
        `${UCL}/2025/round/knockout-play-offs`,
      );
    },
  );

  it('does not treat a domestic "round-of-32" as an alias', async () => {
    expect(await competitionSeasonRedirect(`${FA}/round/round-of-32`, load)).toBeNull();
  });

  it('308s retired Nth-finals slugs to the canonical round', async () => {
    const trone = '/en/competition/morocco/coupe-du-trone';
    expect(await competitionSeasonRedirect(`${trone}/2025/round/16th-finals`, load)).toBe(
      `${trone}/2025/round/round-of-32`,
    );
    expect(await competitionSeasonRedirect(`${trone}/2025/round/8th-finals`, load)).toBe(
      `${trone}/2025/round/round-of-16`,
    );
    expect(await competitionSeasonRedirect(`${FA}/round/1-128-finals`, load)).toBe(
      `${FA}/round/round-of-256`,
    );
    // UEFA: one hop through the play-offs alias
    expect(await competitionSeasonRedirect(`${UCL}/round/16th-finals`, load)).toBe(
      `${UCL}/round/knockout-play-offs`,
    );
  });

  it('a out-of-window season wins over a round alias (one hop to the current-season URL)', async () => {
    expect(await competitionSeasonRedirect(`${UCL}/2024/round/round-of-32`, load)).toBe(UCL);
  });

  it('ignores URLs that are not competition season/round pages', async () => {
    for (const p of [UCL, `${UCL}/round/final`, '/en/competition/uefa', '/en/match/123']) {
      expect(await competitionSeasonRedirect(p, load)).toBeNull();
    }
    expect(
      await competitionSeasonRedirect('/en/competition/nowhere/not-a-cup/2020', load),
    ).toBeNull();
  });

  it('leaves World Cup editions to their own resolver', async () => {
    expect(
      await competitionSeasonRedirect('/en/competition/world/world-cup/2022', load),
    ).toBeNull();
  });

  it('fails open when the database is unreachable', async () => {
    const down = vi.fn(async () => {
      throw new Error('db down');
    });
    expect(await competitionSeasonRedirect(`${UCL}/2024`, down)).toBeNull();
  });
});
