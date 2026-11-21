import { describe, expect, it } from 'vitest';
import { normalizeMetadataRoute } from 'next/dist/lib/metadata/get-metadata-route';
import { MATCH_OG_SEGMENT, matchOgImageAlt, matchOgImageUrl } from '@/lib/og/og-urls';

describe('match share image URL', () => {
  it('matches the segment Next gives the match opengraph-image route', () => {
    expect(normalizeMetadataRoute('/[locale]/(app)/match/[id]/opengraph-image')).toBe(
      `/[locale]/(app)/match/[id]/${MATCH_OG_SEGMENT}/route`,
    );
  });

  it('builds the absolute URL from the canonical slug', () => {
    expect(matchOgImageUrl('https://dimascore.ma', 'ar', 'morocco-spain-977345')).toBe(
      'https://dimascore.ma/ar/match/morocco-spain-977345/opengraph-image-2z6s0d',
    );
  });
});

describe('matchOgImageAlt (og:image:alt in the page language)', () => {
  it('en', () => {
    expect(matchOgImageAlt('Morocco', 'Spain', 'en')).toBe(
      'Morocco vs Spain: match card, DimaScore',
    );
  });
  it('fr', () => {
    expect(matchOgImageAlt('Maroc', 'Espagne', 'fr')).toBe(
      'Maroc vs Espagne : fiche du match, DimaScore',
    );
  });
  it('ar, with ضد and no English', () => {
    const alt = matchOgImageAlt('المغرب', 'إسبانيا', 'ar');
    expect(alt).toBe('المغرب ضد إسبانيا — بطاقة المباراة، DimaScore');
    expect(alt).not.toMatch(/\bvs\b|match/i);
  });
});
