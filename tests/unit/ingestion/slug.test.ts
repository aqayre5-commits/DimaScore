import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/ingestion/slug';

describe('slugify', () => {
  it('lowercases and dashes ASCII', () => {
    expect(slugify('Premier League')).toBe('premier-league');
  });

  it('strips diacritics', () => {
    expect(slugify('Botola Pro')).toBe('botola-pro');
    expect(slugify("Côte d'Ivoire")).toBe('cote-d-ivoire');
    expect(slugify('São Paulo')).toBe('sao-paulo');
  });

  it('strips Arabic script', () => {
    const result = slugify('الوداد');
    // Arabic stripped leaves empty — should produce empty string
    expect(result).toBe('');
  });

  it('handles mixed Latin + Arabic', () => {
    expect(slugify('Wydad الوداد AC')).toBe('wydad-ac');
  });

  it('collapses consecutive spaces and dashes', () => {
    expect(slugify('FC   Barcelona')).toBe('fc-barcelona');
    expect(slugify('FC---Barcelona')).toBe('fc-barcelona');
  });

  it('trims leading and trailing whitespace', () => {
    expect(slugify('  Morocco  ')).toBe('morocco');
  });

  it('replaces special characters', () => {
    expect(slugify('Real Madrid C.F.')).toBe('real-madrid-c-f');
  });

  it('handles single word', () => {
    expect(slugify('Hakimi')).toBe('hakimi');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});
