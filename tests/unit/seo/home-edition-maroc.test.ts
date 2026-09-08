import { describe, expect, it } from 'vitest';
import ar from '@/lib/i18n/messages/ar.json';
import en from '@/lib/i18n/messages/en.json';
import fr from '@/lib/i18n/messages/fr.json';

const ODDS_UI_RE = /\b(odds|cotes?)\b.*\b(bookmaker|pari|betting)\b/i;
const STREAM_SEO_RE = /kooora|yalla|قنوات|\bبث\b/i;

const HOME_KEYS = [
  'metaTitle',
  'metaDescription',
  'pageHeading',
  'editionMetaTitle',
  'editionMetaDescription',
  'editionH1',
  'editionLead',
] as const;

describe('AR homepage + Edition Maroc SERP polish (IMP-013)', () => {
  const packs = {
    fr: fr.homepage,
    en: en.homepage,
    ar: ar.homepage,
  };

  it('shares the same homepage SERP keys across FR/EN/AR', () => {
    for (const key of HOME_KEYS) {
      expect(packs.fr[key]).toEqual(expect.any(String));
      expect(packs.en[key]).toEqual(expect.any(String));
      expect(packs.ar[key]).toEqual(expect.any(String));
    }
  });

  it('uses the AR home title with مباريات اليوم + مباشر/نتائج', () => {
    expect(packs.ar.metaTitle).toBe('مباريات اليوم مباشرة — نتائج وجدول | ديماسكور');
    expect(packs.ar.metaTitle).toMatch(/مباريات اليوم/);
    expect(packs.ar.metaTitle).toMatch(/مباشر|نتائج/);
    expect(packs.ar.pageHeading).toBe('مباريات اليوم مباشرة');
  });

  it('uses the AR edition title with المغرب + اليوم + مباشر/مباريات', () => {
    expect(packs.ar.editionMetaTitle).toBe(
      'مباريات المغرب اليوم مباشرة — البطولة وأسود الأطلس | ديماسكور',
    );
    expect(packs.ar.editionMetaTitle).toMatch(/المغرب/);
    expect(packs.ar.editionMetaTitle).toMatch(/اليوم/);
    expect(packs.ar.editionMetaTitle).toMatch(/مباشر|مباريات/);
    expect(packs.ar.editionH1).toBe('كرة القدم المغربية اليوم — مباريات ونتائج مباشرة');
  });

  it('home meta includes اليوم/مباشر/نتائج/جدول and a no-odds line', () => {
    expect(packs.ar.metaDescription).toMatch(/مباريات اليوم/);
    expect(packs.ar.metaDescription).toMatch(/مباشر/);
    expect(packs.ar.metaDescription).toMatch(/نتائج/);
    expect(packs.ar.metaDescription).toMatch(/جدول/);
    expect(packs.ar.metaDescription).toMatch(/رهان/);
    expect(packs.fr.metaDescription).toMatch(/[Mm]atchs du jour/);
    expect(packs.fr.metaDescription).toMatch(/en direct/);
    expect(packs.fr.metaDescription).toMatch(/résultats/);
    expect(packs.fr.metaDescription).toMatch(/calendrier/);
    expect(packs.fr.metaDescription).toMatch(/sans paris|sans cotes/i);
    expect(packs.en.metaDescription).toMatch(/today/i);
    expect(packs.en.metaDescription).toMatch(/live/i);
    expect(packs.en.metaDescription).toMatch(/results/i);
    expect(packs.en.metaDescription).toMatch(/fixtures/i);
    expect(packs.en.metaDescription).toMatch(/no betting|no odds/i);
  });

  it('edition meta includes المغرب + اليوم + مباشر + نتائج/جدول + البطولة/كأس/أسود', () => {
    expect(packs.ar.editionMetaDescription).toMatch(/المغرب/);
    expect(packs.ar.editionMetaDescription).toMatch(/اليوم/);
    expect(packs.ar.editionMetaDescription).toMatch(/مباشر/);
    expect(packs.ar.editionMetaDescription).toMatch(/نتائج|جدول/);
    expect(packs.ar.editionMetaDescription).toMatch(/البطولة|كأس|أسود/);
    expect(packs.ar.editionLead).toMatch(/مباريات اليوم/);
    expect(packs.ar.editionLead).toMatch(/مباشر/);
    expect(packs.ar.editionLead).toMatch(/رهان/);
  });

  it('keeps AR today / LIVE / upcoming / results chrome labels', () => {
    expect(packs.ar.today).toBe('اليوم');
    expect(packs.ar.live).toBe('مباشر');
    expect(packs.ar.upcoming).toBe('القادمة');
    expect(packs.ar.resultsTab).toBe('النتائج');
  });

  it('does not use kooora/yalla/بث/قنوات as primary keywords or ship odds UI', () => {
    for (const pack of Object.values(packs)) {
      const serp = HOME_KEYS.map((key) => pack[key]).join('\n');
      expect(serp).not.toMatch(STREAM_SEO_RE);
      expect(serp).not.toMatch(ODDS_UI_RE);
    }
  });
});
