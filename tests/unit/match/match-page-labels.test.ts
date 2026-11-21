import { describe, expect, it } from 'vitest';
import { crestAlt, goalMarker, matchupLabel } from '@/lib/i18n/feed-labels';
import { flagImageSrc } from '@/components/shared/Flag';

describe('fixture labels', () => {
  it('never says "vs" in Arabic', () => {
    expect(matchupLabel('المغرب', 'إسبانيا', 'ar')).toBe('المغرب ضد إسبانيا');
    expect(matchupLabel('Morocco', 'Spain', 'en')).toBe('Morocco vs Spain');
    expect(goalMarker('penalty', 'ar')).not.toMatch(/[A-Za-z]/);
    expect(goalMarker('ownGoal', 'ar')).not.toMatch(/[A-Za-z]/);
    expect(crestAlt('المغرب', 'ar', true)).toBe('علم المغرب');
  });
});

describe('flagImageSrc (the image the header shows, reused by the SportsEvent image)', () => {
  it('is the flag for a national team and the crest for a club', () => {
    expect(flagImageSrc({ countryCode: 'MA', logoUrl: 'https://x/31.png', isNational: true })).toBe(
      'https://media.api-sports.io/flags/ma.svg',
    );
    expect(
      flagImageSrc({ countryCode: 'GB', logoUrl: 'https://x/50.png', isNational: false }),
    ).toBe('https://x/50.png');
  });
});
