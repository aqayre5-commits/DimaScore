import { describe, expect, it } from 'vitest';
import { getTeamDisplayName } from '@/lib/utils/team-name';

// No id: these exercise the country-name rule, not the by-ID table (team-names-ar.ts).
const nat = (en: string, countryCode: string) => ({
  id: null,
  name: { en },
  shortName: { en },
  code: null,
  countryCode,
  isNational: true,
});
const club = (id: number, en: string) => ({
  id,
  name: { en },
  shortName: { en },
  code: null,
  countryCode: 'MA',
  isNational: false,
});

describe('getTeamDisplayName localization', () => {
  it('localizes national teams from the country name, with suffixes', () => {
    expect(getTeamDisplayName(nat('Morocco', 'MA'), 'fr')).toBe('Maroc');
    expect(getTeamDisplayName(nat('Morocco', 'MA'), 'ar')).toBe('المغرب');
    expect(getTeamDisplayName(nat('Morocco U23', 'MA'), 'ar')).toBe('المغرب تحت 23 سنة');
    expect(getTeamDisplayName(nat('Morocco W', 'MA'), 'fr')).toBe('Maroc F');
    expect(getTeamDisplayName(nat('Morocco W', 'MA'), 'ar')).toBe('المغرب للسيدات');
    expect(getTeamDisplayName(nat('Czechia U17', 'CZ'), 'fr')).toBe('Tchéquie U17');
  });

  it('keeps English as-is and keeps provider variants it cannot map safely', () => {
    expect(getTeamDisplayName(nat('Morocco', 'MA'), 'en')).toBe('Morocco');
    expect(getTeamDisplayName(nat('Congo DR', 'CD'), 'fr')).toBe('Congo DR');
  });

  it('localizes Moroccan clubs by ID and falls back visibly otherwise', () => {
    expect(getTeamDisplayName(club(976, 'Raja Casablanca'), 'ar')).toBe('الرجاء الرياضي');
    expect(getTeamDisplayName(club(976, 'Raja Casablanca'), 'fr')).toBe('Raja Casablanca');
    expect(getTeamDisplayName(club(969, 'FAR Rabat'), 'fr')).toBe('AS FAR');
    expect(getTeamDisplayName(club(123456, 'Some Club'), 'ar')).toBe('Some Club');
  });

  it('a stored translation always wins', () => {
    expect(
      getTeamDisplayName(
        { ...club(976, 'Raja Casablanca'), name: { en: 'Raja', ar: 'الرجاء' } },
        'ar',
      ),
    ).toBe('الرجاء');
  });
});
