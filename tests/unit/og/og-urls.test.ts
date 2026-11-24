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

describe('competition share image', () => {
  it('matches the segment Next gives the competition opengraph-image route', async () => {
    const { COMPETITION_OG_SEGMENT } = await import('@/lib/og/og-urls');
    expect(
      normalizeMetadataRoute('/[locale]/(app)/competition/[country]/[tournament]/opengraph-image'),
    ).toBe(`/[locale]/(app)/competition/[country]/[tournament]/${COMPETITION_OG_SEGMENT}/route`);
  });

  it('builds og + twitter images with a page-language alt (ar)', async () => {
    const { competitionShareMeta } = await import('@/lib/og/og-urls');
    const m = competitionShareMeta({
      base: 'https://dimascore.ma',
      locale: 'ar',
      country: 'أوروبا',
      tournament: 'دوري-أبطال-أوروبا',
      name: 'دوري أبطال أوروبا',
      title: 'ترتيب دوري أبطال أوروبا',
      description: 'د',
    });
    const url =
      'https://dimascore.ma/ar/competition/%D8%A3%D9%88%D8%B1%D9%88%D8%A8%D8%A7/%D8%AF%D9%88%D8%B1%D9%8A-%D8%A3%D8%A8%D8%B7%D8%A7%D9%84-%D8%A3%D9%88%D8%B1%D9%88%D8%A8%D8%A7/opengraph-image-i9zysm';
    expect(m.images[0]).toMatchObject({ url, width: 1200, height: 630 });
    expect(m.images[0].alt).toBe('دوري أبطال أوروبا — بطاقة البطولة، DimaScore');
    expect(m.twitter.images).toEqual([{ url, alt: m.images[0].alt }]);
    expect(m.twitter.card).toBe('summary_large_image');
    expect(m.twitter.title).toBe('ترتيب دوري أبطال أوروبا');
  });

  it('en and fr alts', async () => {
    const { competitionOgImageAlt } = await import('@/lib/og/og-urls');
    expect(competitionOgImageAlt('Champions League', 'en')).toBe(
      'Champions League: competition card, DimaScore',
    );
    expect(competitionOgImageAlt('Ligue des champions', 'fr')).toBe(
      'Ligue des champions : fiche de la compétition, DimaScore',
    );
  });
});
