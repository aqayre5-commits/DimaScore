import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BASE_URL } from '@/lib/constants/site';
import { locales } from '@/lib/i18n/config';
import { CHUNK_SIZE } from '@/lib/seo/sitemap/chunks';
import { entry } from '@/lib/seo/sitemap/data';

describe('sitemap locales', () => {
  it('emits a loc for French, English and Arabic with reciprocal hreflang', () => {
    const lastModified = new Date('2026-09-24T18:45:00.000Z');
    const slug = '/match/netherlands-germany-1528862';
    const rows = entry((locale) => `/${locale}${slug}`, {
      priority: 0.5,
      changeFrequency: 'weekly',
      lastModified,
    });

    expect(rows.map((row) => row.url)).toEqual(
      locales.map((locale) => `${BASE_URL}/${locale}${slug}`),
    );
    for (const row of rows) {
      expect(row.lastModified).toEqual(lastModified);
      expect(row.alternates?.languages).toEqual({
        fr: `${BASE_URL}/fr${slug}`,
        en: `${BASE_URL}/en${slug}`,
        ar: `${BASE_URL}/ar${slug}`,
        'x-default': `${BASE_URL}/en${slug}`,
      });
    }
  });

  it('keeps each locale on its own path and does not invent lastmod', () => {
    const rows = entry(
      (locale) =>
        locale === 'en'
          ? '/en/competition/morocco/botola-pro'
          : `/${locale}/competition/maroc/botola-pro`,
      { priority: 0.9, changeFrequency: 'daily' },
    );
    expect(rows.map((row) => row.url)).toEqual([
      `${BASE_URL}/fr/competition/maroc/botola-pro`,
      `${BASE_URL}/en/competition/morocco/botola-pro`,
      `${BASE_URL}/ar/competition/maroc/botola-pro`,
    ]);
    expect(rows.every((row) => row.lastModified == null)).toBe(true);
    expect(rows[2].alternates?.languages?.['x-default']).toBe(
      `${BASE_URL}/en/competition/morocco/botola-pro`,
    );
  });

  it('stays under Google’s 50,000 loc cap once each page is listed per language', () => {
    expect(locales).toEqual(['fr', 'en', 'ar']);
    expect(CHUNK_SIZE * locales.length).toBeLessThanOrEqual(50_000);
  });

  it('still includes only the indexable set, which is what drops thin pages', () => {
    const src = readFileSync('src/lib/seo/sitemap/data.ts', 'utf8');
    expect(src).toContain('matchSitemapInclusionCondition');
    expect(src).toContain('teamIndexableSitemapCondition');
    expect(src).toContain('playerIndexableSitemapCondition');
    expect(src).not.toContain('new Date()');
  });
});
