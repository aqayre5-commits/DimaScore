import { describe, expect, it } from 'vitest';
import { formatRoundRange } from '@/lib/competitions/round-range';

describe('formatRoundRange', () => {
  it('one day', () => {
    expect(formatRoundRange(['2026-05-30'], 'en')).toMatch(/^30 May$/);
  });
  it('same month: day span then the month once', () => {
    expect(formatRoundRange(['2026-11-25', '2026-11-26', '2026-11-25'], 'en')).toBe('25–26 Nov');
  });
  it('across months', () => {
    expect(formatRoundRange(['2026-04-28', '2026-05-06'], 'en')).toBe('28 Apr–6 May');
  });
  it('is order independent and ignores junk', () => {
    expect(formatRoundRange(['2026-11-26', 'x', '2026-11-25'], 'en')).toBe('25–26 Nov');
  });
  it('is empty without dated fixtures', () => {
    expect(formatRoundRange([], 'en')).toBe('');
  });
  it('localises (fr, ar)', () => {
    expect(formatRoundRange(['2026-11-25', '2026-11-26'], 'fr')).toMatch(/^25–26 nov/);
    expect(formatRoundRange(['2026-11-25', '2026-11-26'], 'ar')).toContain('–');
  });
});
