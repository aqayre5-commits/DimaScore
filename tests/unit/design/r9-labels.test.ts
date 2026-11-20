import { describe, expect, it } from 'vitest';
import { getCompactTeamLabel, getScoreCardLabel, getTickerCode } from '@/lib/utils/team-name';
import { formatTournamentDateRange } from '@/components/tournament/TournamentPageHeader';

const team = (over: Partial<Parameters<typeof getScoreCardLabel>[0] & object>) => ({
  id: null,
  name: { en: 'X' },
  shortName: { en: 'X' },
  code: null,
  countryCode: null,
  isNational: false,
  ...over,
});

const raja = team({
  id: 976,
  name: { en: 'Raja Casablanca' },
  shortName: { en: 'Raja Casablanca' },
});
const wydad = team({
  id: 968,
  name: { en: 'Wydad AC' },
  shortName: { en: 'Wydad AC' },
  code: 'WYD',
});
const morocco = team({
  id: 31,
  name: { en: 'Morocco' },
  shortName: { en: 'Morocco' },
  code: 'MAR',
  countryCode: 'MA',
  isNational: true,
});
// An id with no entry in team-names-ar.ts (Manchester City, id 50, is mapped since Nov 2026).
const unmapped = team({
  id: 999901,
  name: { en: 'Manchester City' },
  shortName: { en: 'Man City' },
  code: 'MCI',
});

describe('compact labels use the curated Arabic names (R3 leftover)', () => {
  it('score cards: Arabic on /ar, code on /en and /fr', () => {
    expect(getScoreCardLabel(raja, 'ar')).toBe('الرجاء الرياضي');
    expect(getScoreCardLabel(wydad, 'ar')).toBe('الوداد الرياضي');
    expect(getScoreCardLabel(morocco, 'ar')).toBe('المغرب');
    expect(getScoreCardLabel(wydad, 'fr')).toBe('WYD');
    expect(getScoreCardLabel(morocco, 'en')).toBe('MAR');
    // No Arabic name known: the existing Latin fallback, never empty.
    expect(getScoreCardLabel(unmapped, 'ar')).toBe('MCI');
  });

  it('ticker: Arabic names instead of Latin codes on /ar', () => {
    expect(getTickerCode(raja, 'ar')).toBe('الرجاء الرياضي');
    expect(getTickerCode(morocco, 'ar')).toBe('المغرب');
    expect(getTickerCode(morocco, 'en')).toBe('MAR');
    expect(getTickerCode(unmapped, 'ar')).toBe('MCI');
  });

  it('compact label: Arabic before Latin on /ar; long names fall through', () => {
    expect(getCompactTeamLabel(wydad, 'ar')).toBe('الوداد الرياضي');
    expect(getCompactTeamLabel(morocco, 'ar')).toBe('المغرب');
    const longName = team({ id: 17716, name: { en: 'USM Oujda' }, shortName: { en: 'USM Oujda' } });
    expect(getCompactTeamLabel(longName, 'ar')).not.toMatch(/الاتحاد الإسلامي/);
  });
});

describe('tournament date range', () => {
  it('is in the page language, with both years across New Year', () => {
    expect(formatTournamentDateRange('2025-12-21', '2026-01-18', 'en')).toBe(
      '21 December 2025 – 18 January 2026',
    );
    expect(formatTournamentDateRange('2025-12-21', '2026-01-18', 'fr')).toBe(
      '21 décembre 2025 – 18 janvier 2026',
    );
    const ar = formatTournamentDateRange('2025-12-21', '2026-01-18', 'ar');
    // Moroccan month names (دجنبر, not the ICU default ديسمبر), same helper as the #34 hub intros.
    expect(ar).toBe('21 دجنبر 2025 – 18 يناير 2026');
    expect(ar).not.toContain('ديسمبر');
    expect(ar).not.toMatch(/December|January/);
    // Start date comes first in logical order (rendered right-to-left on /ar).
    expect(ar.indexOf('21')).toBeLessThan(ar.indexOf('18'));
    expect(ar.indexOf('2025')).toBeLessThan(ar.indexOf('2026'));
    expect(formatTournamentDateRange('2026-06-11', '2026-07-19', 'ar')).toBe(
      '11 يونيو – 19 يوليوز 2026',
    );
  });
});
