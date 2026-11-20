import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pointXDefaultAtEnglish } from '@/lib/i18n/hreflang-header';
import { routing } from '@/lib/i18n/routing';
import { isRtl } from '@/lib/i18n/config';

const PRODUCTION_LINK =
  '<https://dimascore.ma/fr/match/netherlands-germany-1528862>; rel="alternate"; hreflang="fr", <https://dimascore.ma/en/match/netherlands-germany-1528862>; rel="alternate"; hreflang="en", <https://dimascore.ma/ar/match/netherlands-germany-1528862>; rel="alternate"; hreflang="ar", <https://dimascore.ma/match/netherlands-germany-1528862>; rel="alternate"; hreflang="x-default"';

describe('pointXDefaultAtEnglish', () => {
  it('points x-default at the English URL and keeps reciprocal fr/en/ar links', () => {
    const fixed = pointXDefaultAtEnglish(PRODUCTION_LINK);
    expect(fixed).toContain(
      '<https://dimascore.ma/fr/match/netherlands-germany-1528862>; rel="alternate"; hreflang="fr"',
    );
    expect(fixed).toContain(
      '<https://dimascore.ma/en/match/netherlands-germany-1528862>; rel="alternate"; hreflang="en"',
    );
    expect(fixed).toContain(
      '<https://dimascore.ma/ar/match/netherlands-germany-1528862>; rel="alternate"; hreflang="ar"',
    );
    expect(fixed).toContain(
      '<https://dimascore.ma/en/match/netherlands-germany-1528862>; rel="alternate"; hreflang="x-default"',
    );
    expect(fixed).not.toContain('https://dimascore.ma/match/netherlands-germany-1528862');
  });

  it('leaves a header alone when it has no x-default', () => {
    const link = '<https://dimascore.ma/fr>; rel="alternate"; hreflang="fr"';
    expect(pointXDefaultAtEnglish(link)).toBe(link);
  });
});

describe('locale routing', () => {
  it('does not negotiate the locale from Accept-Language, and English is the default', () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.defaultLocale).toBe('en');
    expect(routing.locales).toEqual(['fr', 'en', 'ar']);
  });
});

describe('arabic document direction', () => {
  it('sets lang and dir on the locale document, rtl only for Arabic', () => {
    expect(isRtl('ar')).toBe(true);
    expect(isRtl('fr')).toBe(false);
    expect(isRtl('en')).toBe(false);
    const layout = readFileSync('src/app/[locale]/layout.tsx', 'utf8');
    expect(layout).toContain('lang={locale}');
    expect(layout).toContain('dir={dir}');
    expect(layout).toContain("isRtl(typedLocale) ? 'rtl' : 'ltr'");
  });
});

describe('root redirect wiring', () => {
  it('sends / to English with a 308 and rewrites the x-default header', () => {
    const middleware = readFileSync('src/middleware.ts', 'utf8');
    expect(middleware).toContain("pathname === '/'");
    expect(middleware).toContain('NextResponse.redirect(url, 308)');
    expect(middleware).toContain('pointXDefaultAtEnglish');
    expect(middleware).toContain('routing.defaultLocale');
  });
});
