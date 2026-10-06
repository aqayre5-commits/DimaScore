import { describe, it, expect } from 'vitest';
import { computeAge, isUnderage, UNDERAGE_THRESHOLD } from '@/lib/utils/age';

/** Fixed "now" so the thresholds are deterministic. */
const NOW = new Date('2026-10-06T12:00:00.000Z');

describe('computeAge', () => {
  it('returns completed years', () => {
    expect(computeAge('2000-01-01', NOW)).toBe(26);
  });

  it('subtracts a year when the birthday has not occurred yet this year', () => {
    expect(computeAge('2010-12-31', NOW)).toBe(15);
  });

  it('counts the birthday itself as the new age', () => {
    expect(computeAge('2010-10-06', NOW)).toBe(16);
  });

  it('is null for missing or unparseable dates', () => {
    expect(computeAge(null, NOW)).toBeNull();
    expect(computeAge(undefined, NOW)).toBeNull();
    expect(computeAge('not-a-date', NOW)).toBeNull();
  });
});

describe('isUnderage', () => {
  it('is true below 16', () => {
    expect(isUnderage('2011-01-01', NOW)).toBe(true); // 15
    expect(isUnderage('2012-06-01', NOW)).toBe(true); // 14
  });

  it('is false at exactly 16 and older', () => {
    expect(isUnderage('2010-10-06', NOW)).toBe(false); // turns 16 today
    expect(isUnderage('2010-01-01', NOW)).toBe(false); // 16
    expect(isUnderage('2000-01-01', NOW)).toBe(false); // 26
  });

  it('is false when the birth date is unknown (cannot assert)', () => {
    expect(isUnderage(null, NOW)).toBe(false);
    expect(isUnderage(undefined, NOW)).toBe(false);
  });

  it('uses a threshold of 16', () => {
    expect(UNDERAGE_THRESHOLD).toBe(16);
  });
});
