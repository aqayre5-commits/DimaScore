import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { requireLocale } from '@/lib/i18n/require-locale';
import { getFifaRankingTop, getFullFifaRanking } from '@/lib/constants/fifa-ranking';
import type { Locale } from '@/lib/i18n/config';

// Paths seen returning 500 in production because they were rendered as `[locale]`.
const BOGUS = ['llms.txt', 'ads.txt', 'xmlrpc.php', 'wp-login.php', '.env', 'zz'];

function notFoundDigest(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (err) {
    return (err as { digest?: string }).digest;
  }
  return undefined;
}

describe('requireLocale', () => {
  it.each(['fr', 'en', 'ar'])('accepts supported locale %s', (loc) => {
    expect(requireLocale(loc)).toBe(loc);
  });

  it.each(BOGUS)('throws a Next.js 404 (notFound) for %s', (loc) => {
    expect(notFoundDigest(() => requireLocale(loc))).toBe('NEXT_HTTP_ERROR_FALLBACK;404');
  });
});

describe('FIFA ranking resolver with an invalid locale tag', () => {
  it('confirms the original crash: Intl.DisplayNames rejects "llms.txt"', () => {
    expect(() => new Intl.DisplayNames(['llms.txt'], { type: 'region' })).toThrow(RangeError);
  });

  it('does not throw (defence in depth) and still returns rows', () => {
    const bad = 'llms.txt' as Locale;
    expect(() => getFifaRankingTop(bad)).not.toThrow();
    expect(getFifaRankingTop(bad).length).toBeGreaterThan(0);
    expect(() => getFullFifaRanking(bad)).not.toThrow();
  });
});

describe('[locale] route entry points validate the locale before using it', () => {
  const root = path.resolve(__dirname, '../../../src/app/[locale]');
  const files = ['layout.tsx', '(app)/layout.tsx', '(app)/page.tsx'];

  it.each(files)('%s uses requireLocale and never casts the raw param', (file) => {
    const src = readFileSync(path.join(root, file), 'utf8');
    expect(src).toContain('requireLocale((await params).locale)');
    expect(src).not.toMatch(/as Locale;/);
  });

  it('root layout generateMetadata validates the locale', () => {
    const src = readFileSync(path.join(root, 'layout.tsx'), 'utf8');
    const meta = src.slice(src.indexOf('export async function generateMetadata'));
    expect(meta.slice(0, 300)).toContain('requireLocale(');
  });
});
