import { describe, expect, it } from 'vitest';
import { AR_MOROCCAN_MONTHS, formatCalendarDay, formatDateRange } from '@/lib/utils/date-range';

describe('date-range helper', () => {
  it('uses Moroccan Arabic month names for all twelve months', () => {
    expect([...AR_MOROCCAN_MONTHS]).toEqual([
      'يناير',
      'فبراير',
      'مارس',
      'أبريل',
      'ماي',
      'يونيو',
      'يوليوز',
      'غشت',
      'شتنبر',
      'أكتوبر',
      'نونبر',
      'دجنبر',
    ]);
    // None of the Levantine/ICU-default spellings that differ.
    const joined = AR_MOROCCAN_MONTHS.join(' ');
    for (const bad of ['ديسمبر', 'نوفمبر', 'سبتمبر', 'أغسطس', 'مايو', 'يوليو '])
      expect(joined + ' ').not.toContain(bad);
  });

  it('formats a range that crosses New Year with both years, in each language', () => {
    expect(formatDateRange('2025-12-21', '2026-01-18', 'en')).toBe(
      '21 December 2025 – 18 January 2026',
    );
    expect(formatDateRange('2025-12-21', '2026-01-18', 'fr')).toBe(
      '21 décembre 2025 – 18 janvier 2026',
    );
    expect(formatDateRange('2025-12-21', '2026-01-18', 'ar')).toBe('21 دجنبر 2025 – 18 يناير 2026');
  });

  it('writes the shared year once', () => {
    expect(formatDateRange('2026-06-11', '2026-07-19', 'ar')).toBe('11 يونيو – 19 يوليوز 2026');
    expect(formatDateRange('2026-06-11', '2026-07-19', 'en')).toBe('11 June – 19 July 2026');
    expect(formatDateRange('2026-06-21', '2026-06-25', 'ar')).toBe('21 – 25 يونيو 2026');
  });

  it('formats single days', () => {
    expect(formatCalendarDay('2026-01-18', 'ar')).toBe('18 يناير 2026');
    expect(formatCalendarDay('2025-12-21', 'fr')).toBe('21 décembre 2025');
    expect(formatCalendarDay('2025-12-21', 'en')).toBe('21 December 2025');
  });

  it('rejects anything that is not a calendar day', () => {
    expect(() => formatCalendarDay('2026-13-01', 'en')).toThrow();
    expect(() => formatCalendarDay('soon', 'en')).toThrow();
  });
});
