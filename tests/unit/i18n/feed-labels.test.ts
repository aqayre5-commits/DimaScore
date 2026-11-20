import { describe, expect, it } from 'vitest';
import {
  localizeContextLabel,
  localizeMatchStatus,
  localizePosition,
  localizeRound,
  localizeStatType,
} from '@/lib/i18n/feed-labels';
import { arabicCompetitionName, arabicTeamName } from '@/lib/i18n/localized-names';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { AR_ROUND_TEMPLATES } from '@/lib/i18n/feed-labels-ar';

describe('feed labels on /ar', () => {
  it('translates status codes, stats, positions; other locales pass through', () => {
    expect(localizeMatchStatus('FT', 'ar')).toBe('ن.م');
    expect(localizeMatchStatus('FT', 'en')).toBe('FT');
    expect(localizeMatchStatus('XYZ', 'ar')).toBe('XYZ');
    expect(localizeStatType('Ball Possession', 'ar')).toBe('الاستحواذ');
    expect(localizeStatType('ball possession', 'ar')).toBe('الاستحواذ');
    expect(localizeStatType('Ball Possession', 'fr')).toBe('Ball Possession');
    expect(localizePosition('F', 'ar')).toBe('ه');
    expect(localizePosition('F', 'en')).toBe('F');
  });

  it('fills round templates and keeps unknown rounds', () => {
    expect(localizeRound('Regular Season - 7', 'ar')).toContain('7');
    expect(localizeRound('Regular Season - 7', 'ar')).not.toMatch(/[A-Za-z]/);
    expect(localizeRound('Group H', 'ar')).toContain('H');
    expect(localizeRound('Group H', 'ar')).toMatch(/[\u0600-\u06FF]/);
    expect(localizeRound('Some New Round', 'ar')).toBe('Some New Round');
    expect(localizeRound('Regular Season - 7', 'en')).toBe('Regular Season - 7');
    expect(localizeContextLabel('MD 12', 'ar')).toContain('12');
    expect(localizeContextLabel('QF', 'en')).toBe('QF');
  });

  it('every round template keeps its placeholders', () => {
    for (const [en, ar] of Object.entries(AR_ROUND_TEMPLATES)) {
      const ph = (s: string) => (s.match(/\{[a-z]+\}/g) ?? []).sort();
      expect(ph(ar), en).toEqual(ph(en));
    }
  });
});

describe('Arabic team and competition names', () => {
  const team = (id: number, en: string, ar?: string) => ({
    id,
    name: (ar ? { en, ar } : { en }) as Record<string, string>,
    shortName: { en },
    code: null,
    countryCode: 'MA',
    isNational: id === 31,
  });

  it('ignores a Latin copy stored in name.ar and uses the curated Arabic name', () => {
    expect(getTeamDisplayName(team(31, 'Morocco', 'Morocco'), 'ar')).toBe('المغرب');
    expect(getTeamDisplayName(team(976, 'Raja Casablanca', 'Raja Casablanca'), 'ar')).toBe(
      'الرجاء الرياضي',
    );
    expect(arabicTeamName(team(31, 'Morocco', 'Morocco'), 'ar')).toBe('المغرب');
    expect(arabicTeamName(team(31, 'Morocco'), 'en')).toBeNull();
  });

  it('names Gulf clubs that used to show in English', () => {
    expect(getTeamDisplayName(team(2939, 'Al-Nassr'), 'ar')).toMatch(/[\u0600-\u06FF]/);
  });

  it('resolves competitions by id, and by unambiguous feed name without an id', () => {
    expect(arabicCompetitionName({ id: 36, name: { en: 'x' } }, 'ar')).toBe(
      'تصفيات كأس أمم إفريقيا',
    );
    expect(
      arabicCompetitionName({ name: { en: 'Africa Cup of Nations - Qualification' } }, 'ar'),
    ).toBe('تصفيات كأس أمم إفريقيا');
    // "Premier League" is England and Egypt in the feed: no guess without an id.
    expect(arabicCompetitionName({ name: { en: 'Premier League' } }, 'ar')).toBeNull();
    expect(arabicCompetitionName({ id: 36, name: { en: 'x' } }, 'en')).toBeNull();
  });
});
