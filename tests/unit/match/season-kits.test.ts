import { describe, expect, it } from 'vitest';
import { kitsNeedRefresh } from '@/lib/match/kit-colours';
import {
  SEASON_KITS,
  catalogSeasonKits,
  contrastRatio,
  contrastSafeNumber,
  inferSeasonKitsFromApiSamples,
  pickWornSlot,
  resolveTeamKitsWithSeason,
  applyStoredSeasonFallback,
  shirtsClash,
  type FixtureKitContext,
} from '@/lib/match/season-kits';

const CITY_FULHAM: FixtureKitContext = {
  fixtureId: 9000001,
  season: 2026,
  homeTeamId: 50,
  awayTeamId: 36,
};

describe('catalog', () => {
  it('has cited 2026/27 palettes for Manchester City and Fulham', () => {
    const city = catalogSeasonKits(50, 2026);
    const fulham = catalogSeasonKits(36, 2026);
    expect(city?.sourceUrl).toMatch(/wikipedia\.org/);
    expect(fulham?.sourceUrl).toMatch(/wikipedia\.org/);
    expect(city?.player.home?.primary).toBe('#98c6eb');
    expect(fulham?.player.home?.primary).toBe('#ffffff');
    expect(fulham?.player.away?.primary).toBe('#000000');
  });

  it('stores contrast-safe numbers (AA 4.5:1) on every curated shirt', () => {
    for (const set of SEASON_KITS) {
      for (const role of ['player', 'goalkeeper'] as const) {
        for (const slot of ['home', 'away', 'third'] as const) {
          const pal = set[role]?.[slot];
          if (!pal) continue;
          expect(contrastRatio(pal.primary, pal.number)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });
});

describe('contrastSafeNumber', () => {
  it('picks the darker number on a mid-tone shirt where contrastNumber would fail AA', () => {
    expect(contrastSafeNumber('#3c9d82')).toBe('#111111');
    expect(contrastRatio('#3c9d82', '#111111')).toBeGreaterThanOrEqual(4.5);
    expect(contrastSafeNumber('#ffffff')).toBe('#111111');
    expect(contrastSafeNumber('#000000')).toBe('#f5f5f5');
  });
});

describe('worn-kit convention', () => {
  it('gives the home team its home kit and the away team its away kit', () => {
    const city = catalogSeasonKits(50, 2026)!;
    const fulham = catalogSeasonKits(36, 2026)!;
    expect(
      pickWornSlot({ fixtureId: 1, teamId: 50, isHome: true, kits: city.player }),
    ).toMatchObject({
      slot: 'home',
      basis: 'convention',
    });
    expect(
      pickWornSlot({
        fixtureId: 1,
        teamId: 36,
        isHome: false,
        kits: fulham.player,
        opponentPrimary: city.player.home?.primary,
      }),
    ).toMatchObject({ slot: 'away', basis: 'convention' });
  });

  it('switches the away team to its third kit when the away shirt clashes with the home shirt', () => {
    const kits = {
      home: { primary: '#ffffff', number: '#111111', border: '#111111' },
      away: { primary: '#f0f0f0', number: '#111111', border: '#111111' },
      third: { primary: '#111111', number: '#f5f5f5', border: '#f5f5f5' },
    };
    expect(shirtsClash(kits.away.primary, '#ffffff')).toBe(true);
    expect(
      pickWornSlot({
        fixtureId: 2,
        teamId: 1,
        isHome: false,
        kits,
        opponentPrimary: '#ffffff',
      }),
    ).toMatchObject({ slot: 'third', basis: 'convention' });
  });

  it('stays unknown (grey) when the team has no season kit', () => {
    expect(pickWornSlot({ fixtureId: 1, teamId: 99, isHome: true, kits: null })).toMatchObject({
      slot: null,
      basis: 'unknown',
    });
  });
});

describe('resolveTeamKitsWithSeason', () => {
  it('uses the season kit when the API palette is missing (City home, Fulham away)', () => {
    const city = resolveTeamKitsWithSeason(CITY_FULHAM, 50, null);
    const fulham = resolveTeamKitsWithSeason(CITY_FULHAM, 36, null);
    expect(city.player).toMatchObject({ primary: '#98c6eb', source: 'season' });
    expect(city.worn).toMatchObject({ slot: 'home', basis: 'convention' });
    expect(fulham.player).toMatchObject({ primary: '#000000', source: 'season' });
    expect(fulham.worn).toMatchObject({ slot: 'away', basis: 'convention' });
    expect(city.goalkeeper.source).toBe('season');
    expect(fulham.goalkeeper.source).toBe('season');
  });

  it('keeps an API palette and does not apply the season kit', () => {
    const city = resolveTeamKitsWithSeason(CITY_FULHAM, 50, {
      player: { primary: 'ff00ff', number: 'ffffff', border: 'ffffff' },
      goalkeeper: { primary: '00ff00', number: '111111', border: '111111' },
    });
    expect(city.player).toMatchObject({ primary: '#ff00ff', source: 'api' });
  });

  it('looks up by team.id, not by home/away array order', () => {
    const [awayFirst, homeSecond] = [36, 50].map((id) =>
      resolveTeamKitsWithSeason(CITY_FULHAM, id, null),
    );
    expect(awayFirst.teamId).toBe(36);
    expect(awayFirst.player.primary).toBe('#000000');
    expect(homeSecond.teamId).toBe(50);
    expect(homeSecond.player.primary).toBe('#98c6eb');
  });
});

describe('applyStoredSeasonFallback', () => {
  it('fills a missing or neutral stored row and leaves a complete API row alone', () => {
    const filled = applyStoredSeasonFallback(CITY_FULHAM, 50, null);
    expect(filled?.player.source).toBe('season');
    expect(filled?.player.primary).toBe('#98c6eb');
    expect(kitsNeedRefresh(filled)).toBe(false);

    const grey = applyStoredSeasonFallback(CITY_FULHAM, 50, {
      player: { primary: '#c8cdd1', number: '#1a1a1a', border: '#4a4f54', source: 'neutral' },
      goalkeeper: { primary: '#c8cdd1', number: '#1a1a1a', border: '#4a4f54', source: 'neutral' },
    });
    expect(grey?.player.source).toBe('season');

    const api = applyStoredSeasonFallback(CITY_FULHAM, 50, {
      player: { primary: '#ff00ff', number: '#ffffff', border: '#ffffff', source: 'api' },
      goalkeeper: { primary: '#00ff00', number: '#111111', border: '#111111', source: 'api' },
    });
    expect(api?.player.primary).toBe('#ff00ff');
    expect(api?.player.source).toBe('api');
  });
});

describe('inferSeasonKitsFromApiSamples', () => {
  it('takes the most common home and away API primaries from other fixtures', () => {
    const inferred = inferSeasonKitsFromApiSamples(12, 2026, [
      {
        teamId: 12,
        isHome: true,
        player: { primary: '#aa0000', number: '#ffffff', border: '#ffffff' },
        goalkeeper: { primary: '#00aa00', number: '#111111', border: '#111111' },
      },
      {
        teamId: 12,
        isHome: true,
        player: { primary: '#aa0000', number: '#ffffff', border: '#ffffff' },
        goalkeeper: { primary: '#00aa00', number: '#111111', border: '#111111' },
      },
      {
        teamId: 12,
        isHome: false,
        player: { primary: '#0000aa', number: '#ffffff', border: '#ffffff' },
        goalkeeper: { primary: '#00aa00', number: '#111111', border: '#111111' },
      },
    ]);
    expect(inferred?.player.home?.primary).toBe('#aa0000');
    expect(inferred?.player.away?.primary).toBe('#0000aa');
  });
});
