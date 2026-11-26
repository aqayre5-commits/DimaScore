import { describe, expect, it } from 'vitest';
import { formatSeasonLabel, resolveLeagueSeason } from '@/lib/competitions/league-season';
import { allowedSeasons } from '@/lib/competitions/allowed-seasons';

const seasons = [
  { year: 2026, isCurrent: true, fixtureCount: 12 },
  { year: 2025, isCurrent: false, fixtureCount: 240 },
  { year: 2024, isCurrent: false, fixtureCount: 240 },
];

describe('resolveLeagueSeason', () => {
  it('defaults every alias path to the same current year', () => {
    const a = resolveLeagueSeason(seasons, 2026, null);
    const b = resolveLeagueSeason(seasons, 2026, undefined);
    expect(a.seasonYear).toBe(2026);
    expect(b.seasonYear).toBe(2026);
    expect(a.seasons.find((s) => s.isCurrent)?.year).toBe(2026);
  });

  it('honours a valid requested archive year', () => {
    const resolved = resolveLeagueSeason(seasons, 2026, 2025);
    expect(resolved.seasonYear).toBe(2025);
    expect(resolved.currentSeasonYear).toBe(2026);
    expect(resolved.seasons.some((s) => s.year === 2026 && s.isCurrent)).toBe(true);
  });

  it('ignores an unknown requested year and keeps current', () => {
    expect(resolveLeagueSeason(seasons, 2026, 2019).seasonYear).toBe(2026);
  });

  it('injects current into the picker when the stale list omitted it', () => {
    const stale = [
      { year: 2025, isCurrent: true, fixtureCount: 240 },
      { year: 2024, isCurrent: false, fixtureCount: 240 },
    ];
    const resolved = resolveLeagueSeason(stale, 2026, null);
    expect(resolved.seasonYear).toBe(2026);
    expect(resolved.seasons.map((s) => s.year)).toEqual([2026, 2025, 2024]);
    expect(resolved.seasons.find((s) => s.year === 2026)?.isCurrent).toBe(true);
    expect(resolved.seasons.find((s) => s.year === 2025)?.isCurrent).toBe(false);
  });

  it('realigns stale is_current flags to the live current year', () => {
    const drifted = [
      { year: 2026, isCurrent: false, fixtureCount: 4 },
      { year: 2025, isCurrent: true, fixtureCount: 240 },
    ];
    const resolved = resolveLeagueSeason(drifted, 2026, null);
    expect(resolved.seasonYear).toBe(2026);
    expect(resolved.seasons.find((s) => s.year === 2026)?.isCurrent).toBe(true);
    expect(resolved.seasons.find((s) => s.year === 2025)?.isCurrent).toBe(false);
  });
});

describe('formatSeasonLabel', () => {
  it('formats 2026 as 2026/27', () => {
    expect(formatSeasonLabel(2026)).toBe('2026/27');
    expect(formatSeasonLabel(2025)).toBe('2025/26');
  });
});

describe('seasons outside the allowed window', () => {
  const allowed = allowedSeasons(2, seasons, new Date('2026-11-26T12:00:00Z'));

  it('allows current and last season only', () => {
    expect(allowed).toEqual([2026, 2025]);
  });

  it('flags a request for an older season so the route can redirect', () => {
    const r = resolveLeagueSeason(seasons, 2026, 2024, allowed);
    expect(r.requestedOutOfWindow).toBe(true);
    expect(r.seasonYear).toBe(2026);
    // Nothing is deleted: the older season is still in the data, just not offered.
    expect(seasons.some((s) => s.year === 2024)).toBe(true);
    expect(r.seasons.map((s) => s.year)).toEqual([2026, 2025]);
  });

  it('flags a season that has no data at all', () => {
    expect(resolveLeagueSeason(seasons, 2026, 2031, allowed).requestedOutOfWindow).toBe(true);
  });

  it.each([
    [null, false],
    [2026, false],
    [2025, false],
  ])('does not redirect a request for %s', (requested, expected) => {
    expect(resolveLeagueSeason(seasons, 2026, requested, allowed).requestedOutOfWindow).toBe(
      expected,
    );
  });
});
