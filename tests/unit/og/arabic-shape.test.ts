import { describe, expect, it } from 'vitest';
import { shapeArabic, visualArabic } from '@/lib/og/arabic-shape';

const cps = (s: string) => [...s].map((c) => c.codePointAt(0)!.toString(16));

// Satori measured Arabic words with the unjoined (isolated) glyph widths, which made big gaps
// between words in /ar OG images. The text is now pre-shaped into presentation forms.
describe('shapeArabic', () => {
  it('picks initial / medial / final / isolated forms', () => {
    // ب ي ت: beh initial, yeh medial, teh final
    expect(cps(shapeArabic('بيت'))).toEqual(['fe91', 'fef4', 'fe96']);
    // دوري: dal, waw (right-joining, no initial), reh isolated, yeh isolated (reh doesn't join on)
    expect(cps(shapeArabic('دوري'))).toEqual(['fea9', 'feed', 'fead', 'fef1']);
  });

  it('forms lam-alef ligatures', () => {
    // الأهلي: alef, lam+alef-hamza final? lam has alef before (no join) -> isolated ligature
    expect(cps(shapeArabic('لا'))).toEqual(['fefb']);
    expect(cps(shapeArabic('سلا'))).toEqual(['feb3', 'fefc']);
    expect(cps(shapeArabic('الأهلي'))).toEqual(['fe8d', 'fef7', 'feeb', 'fee0', 'fef2']);
  });

  it('keeps tatweel joining and drops harakat', () => {
    expect(cps(shapeArabic('الـ'))).toEqual(['fe8d', 'fedf', '640']);
    expect(shapeArabic('مُحَمَّد')).toBe(shapeArabic('محمد'));
  });

  it('leaves non-Arabic text alone', () => {
    expect(shapeArabic('Abc 12')).toBe('Abc 12');
  });
});

describe('visualArabic', () => {
  it('reverses each shaped Arabic sequence for left-to-right drawing', () => {
    expect(cps(visualArabic('بيت'))).toEqual(['fe96', 'fef4', 'fe91']);
  });
  it('keeps digits in place', () => {
    // ogRuns already put "16" on the left of "الـ"
    const v = visualArabic('16الـ');
    expect(v.startsWith('16')).toBe(true);
    expect(cps(v.slice(2))).toEqual(['640', 'fedf', 'fe8d']);
  });
});
