import { describe, expect, it } from 'vitest';
import { formatSeasonLabel, resolveLeagueSeason } from '@/lib/competitions/league-season';

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
