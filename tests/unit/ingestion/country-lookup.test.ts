import { describe, it, expect } from 'vitest';
import { resolveCountryCode } from '@/lib/ingestion/country-lookup';

const lookup = new Map<string, string>([
  ['morocco', 'MA'],
  ['belgium', 'BE'],
  ['england', 'GB-ENG'],
  ['south-korea', 'KR'],
  ['south korea', 'KR'],
  ['united-arab-emirates', 'AE'],
  ['united arab emirates', 'AE'],
]);

describe('resolveCountryCode', () => {
  it('resolves exact match (case-insensitive)', () => {
    expect(resolveCountryCode(lookup, 'Morocco')).toBe('MA');
    expect(resolveCountryCode(lookup, 'BELGIUM')).toBe('BE');
    expect(resolveCountryCode(lookup, 'england')).toBe('GB-ENG');
  });

  it('resolves hyphenated names', () => {
    expect(resolveCountryCode(lookup, 'South-Korea')).toBe('KR');
    expect(resolveCountryCode(lookup, 'United-Arab-Emirates')).toBe('AE');
  });

  it('resolves space-separated names', () => {
    expect(resolveCountryCode(lookup, 'South Korea')).toBe('KR');
    expect(resolveCountryCode(lookup, 'United Arab Emirates')).toBe('AE');
  });

  it('returns null for unknown country', () => {
    expect(resolveCountryCode(lookup, 'Narnia')).toBeNull();
  });

  it('returns null for null/undefined input', () => {
    expect(resolveCountryCode(lookup, null)).toBeNull();
    expect(resolveCountryCode(lookup, undefined)).toBeNull();
  });

  it('trims whitespace', () => {
    expect(resolveCountryCode(lookup, '  Morocco  ')).toBe('MA');
  });
});
