import { describe, it, expect } from 'vitest';
import { parseRoundNumber } from '@/lib/ingestion/round';

describe('parseRoundNumber', () => {
  // Group / regular season
  it('parses "Group C - 3" → 3', () => {
    expect(parseRoundNumber('Group C - 3')).toBe(3);
  });

  it('parses "Regular Season - 12" → 12', () => {
    expect(parseRoundNumber('Regular Season - 12')).toBe(12);
  });

  it('parses "Group A - 1" → 1', () => {
    expect(parseRoundNumber('Group A - 1')).toBe(1);
  });

  // Knockout rounds (synthetic ordering)
  it('parses "Round of 32" → 32', () => {
    expect(parseRoundNumber('Round of 32')).toBe(32);
  });

  it('parses "Round of 16" → 33', () => {
    expect(parseRoundNumber('Round of 16')).toBe(33);
  });

  it('parses "Quarter-finals" → 34', () => {
    expect(parseRoundNumber('Quarter-finals')).toBe(34);
  });

  it('parses "Semi-finals" → 35', () => {
    expect(parseRoundNumber('Semi-finals')).toBe(35);
  });

  it('parses "3rd Place" → 36', () => {
    expect(parseRoundNumber('3rd Place')).toBe(36);
  });

  it('parses "3rd place playoff" → 36', () => {
    expect(parseRoundNumber('3rd place playoff')).toBe(36);
  });

  it('parses "Final" → 37', () => {
    expect(parseRoundNumber('Final')).toBe(37);
  });

  // Case insensitivity
  it('is case-insensitive for knockouts', () => {
    expect(parseRoundNumber('quarter-finals')).toBe(34);
    expect(parseRoundNumber('QUARTER-FINALS')).toBe(34);
    expect(parseRoundNumber('FINAL')).toBe(37);
  });

  // Edge cases
  it('returns null for empty string', () => {
    expect(parseRoundNumber('')).toBe(null);
  });

  it('parses "Knockout Round Play-offs" → 31', () => {
    expect(parseRoundNumber('Knockout Round Play-offs')).toBe(31);
  });

  it('parses "8th Finals" as Round of 16', () => {
    expect(parseRoundNumber('8th Finals')).toBe(33);
  });

  it('parses "16th Finals" as Round of 32', () => {
    expect(parseRoundNumber('16th Finals')).toBe(32);
  });

  it('parses "1st Qualifying Round" before the league phase', () => {
    expect(parseRoundNumber('1st Qualifying Round')).toBe(-39);
    expect(parseRoundNumber('2nd Qualifying Round')).toBe(-38);
  });

  it('parses Preliminary Round ahead of group stages', () => {
    expect(parseRoundNumber('Preliminary Round')).toBe(-30);
  });

  it('returns null for unknown format', () => {
    expect(parseRoundNumber('Not a round')).toBe(null);
  });

  it('handles whitespace', () => {
    expect(parseRoundNumber('  Group B - 5  ')).toBe(5);
    expect(parseRoundNumber('  Final  ')).toBe(37);
  });
});
