import { describe, expect, it } from 'vitest';
import {
  allowedSeasons,
  editionHasStartedOrHeldFor,
  seasonRetention,
} from '@/lib/competitions/allowed-seasons';
import { resolveLeagueSeason } from '@/lib/competitions/league-season';

/** 25 Nov 2026, after WC 2026, WAFCON 2026 and AFCON 2025 have all finished. */
const TODAY = new Date('2026-11-25T12:00:00Z');

describe('seasonRetention', () => {
  it('keeps only the latest edition for finals tournaments and qualifiers', () => {
    expect(seasonRetention(1)).toBe('latest-only'); // World Cup
    expect(seasonRetention(4)).toBe('latest-only'); // EURO
    expect(seasonRetention(29)).toBe('latest-only'); // WC qualifiers
    expect(seasonRetention(960)).toBe('latest-only'); // EURO qualifiers
  });

  it('keeps current plus previous for annual leagues and domestic cups', () => {
    expect(seasonRetention(39)).toBe('current-and-previous'); // Premier League
    expect(seasonRetention(200)).toBe('current-and-previous'); // Botola
    expect(seasonRetention(45)).toBe('current-and-previous'); // FA Cup
    expect(seasonRetention(2)).toBe('current-and-previous'); // UCL (annual club season)
    expect(seasonRetention(5)).toBe('current-and-previous'); // Nations League campaign
  });
});

describe('allowedSeasons as of 25 Nov 2026', () => {
  it('World Cup: 2026 only, no 2022', () => {
    expect(
      allowedSeasons(1, [{ year: 2026, isCurrent: true }, { year: 2022 }, { year: 2018 }], TODAY),
    ).toEqual([2026]);
    expect(editionHasStartedOrHeldFor(1, { year: 2026 }, TODAY)).toBe(true);
    expect(editionHasStartedOrHeldFor(1, { year: 2022 }, TODAY)).toBe(true);
  });

  it('EURO / Copa América: last completed edition until the next one starts', () => {
    expect(allowedSeasons(4, [{ year: 2028 }, { year: 2024 }, { year: 2020 }], TODAY)).toEqual([
      2024,
    ]);
    expect(allowedSeasons(9, [{ year: 2028 }, { year: 2024 }], TODAY)).toEqual([2024]);
  });

  it('AFCON 2025, Club World Cup 2025, Olympics 2024, Women\'s World Cup 2023', () => {
    expect(allowedSeasons(6, [{ year: 2025 }, { year: 2023 }], TODAY)).toEqual([2025]);
    expect(allowedSeasons(15, [{ year: 2029 }, { year: 2025 }], TODAY)).toEqual([2025]);
    expect(allowedSeasons(480, [{ year: 2028 }, { year: 2024 }], TODAY)).toEqual([2024]);
    expect(allowedSeasons(8, [{ year: 2027 }, { year: 2023 }], TODAY)).toEqual([2023]);
  });

  it('WAFCON Jul 2026 edition (API season 2025) is the latest, not 2024', () => {
    expect(allowedSeasons(922, [{ year: 2025, isCurrent: true }, { year: 2024 }], TODAY)).toEqual([
      2025,
    ]);
  });

  it('AFCON qualifiers: 2027 cycle is underway (started 24 Sep 2026), not 2025', () => {
    expect(allowedSeasons(36, [{ year: 2027 }, { year: 2025 }], TODAY)).toEqual([2027]);
    expect(editionHasStartedOrHeldFor(36, { year: 2027 }, TODAY)).toBe(true);
  });

  it('youth World Cups: latest held or underway edition only', () => {
    expect(allowedSeasons(490, [{ year: 2027 }, { year: 2025 }], TODAY)).toEqual([2025]);
    expect(allowedSeasons(920, [{ year: 2026 }, { year: 2024 }], TODAY)).toEqual([2026]);
    expect(allowedSeasons(587, [{ year: 2026 }, { year: 2023 }], TODAY)).toEqual([2026]);
    expect(allowedSeasons(950, [{ year: 2026 }, { year: 2024 }], TODAY)).toEqual([2026]);
  });

  it('annual leagues keep current plus the previous season only', () => {
    expect(
      allowedSeasons(
        39,
        [
          { year: 2026, isCurrent: true },
          { year: 2025 },
          { year: 2024 },
          { year: 2023 },
        ],
        TODAY,
      ),
    ).toEqual([2026, 2025]);
  });
});

describe('resolveLeagueSeason with the history policy', () => {
  it('hides older years from the picker and ignores a request for one', () => {
    const available = [
      { year: 2026, isCurrent: true, fixtureCount: 12 },
      { year: 2025, isCurrent: false, fixtureCount: 240 },
      { year: 2024, isCurrent: false, fixtureCount: 240 },
    ];
    const resolved = resolveLeagueSeason(available, 2026, 2024, [2026, 2025]);
    expect(resolved.seasons.map((s) => s.year)).toEqual([2026, 2025]);
    expect(resolved.seasonYear).toBe(2026);
  });
});
