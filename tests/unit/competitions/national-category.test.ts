import { describe, it, expect } from 'vitest';
import {
  classifyNationalTeamName,
  nationalFamilyBaseName,
  nationalFamilyLinks,
  categoryLabel,
} from '@/lib/competitions/national-category';

describe('classifyNationalTeamName', () => {
  it('classifies senior men and women', () => {
    expect(classifyNationalTeamName('France')).toEqual({ category: 'men', ageGroup: null });
    expect(classifyNationalTeamName('France W')).toEqual({ category: 'women', ageGroup: null });
    expect(classifyNationalTeamName('France Women')).toEqual({ category: 'women', ageGroup: null });
    expect(classifyNationalTeamName('France', true)).toEqual({ category: 'women', ageGroup: null });
  });

  it('classifies youth age groups, including women', () => {
    expect(classifyNationalTeamName('France U21')).toEqual({ category: 'men', ageGroup: 21 });
    expect(classifyNationalTeamName('France U-20')).toEqual({ category: 'men', ageGroup: 20 });
    expect(classifyNationalTeamName('France U23 W')).toEqual({ category: 'women', ageGroup: 23 });
  });

  it('shares a family base name across categories', () => {
    expect(nationalFamilyBaseName('France U21')).toBe('france');
    expect(nationalFamilyBaseName('France W')).toBe('france');
    expect(nationalFamilyBaseName('France')).toBe('france');
  });
});

describe('nationalFamilyLinks', () => {
  it('emits crawlable equipe URLs and skips sides with no fixtures', () => {
    const links = nationalFamilyLinks('en', [
      { teamId: 2, slug: 'france-2', englishName: 'France', countryCode: 'FR', hasFixtures: true },
      {
        teamId: 10,
        slug: 'france-w-10',
        englishName: 'France W',
        countryCode: 'FR',
        hasFixtures: true,
      },
      {
        teamId: 21,
        slug: 'france-u21-21',
        englishName: 'France U21',
        countryCode: 'FR',
        hasFixtures: true,
      },
      {
        teamId: 99,
        slug: 'france-u17-99',
        englishName: 'France U17',
        countryCode: 'FR',
        hasFixtures: false,
      },
    ]);
    expect(links.map((l) => l.label)).toEqual(['Men', 'U21', 'Women']);
    expect(links.map((l) => l.href)).toEqual([
      '/en/equipe/france-2',
      '/en/equipe/france-u21-21',
      '/en/equipe/france-w-10',
    ]);
  });

  it('labels a youth women side clearly', () => {
    expect(categoryLabel({ category: 'women', ageGroup: 20 })).toBe('U20 women');
  });
});
