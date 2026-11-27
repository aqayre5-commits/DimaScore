import { describe, expect, it } from 'vitest';
import {
  COMPETITION_LOGO_FULL,
  COMPETITION_LOGO_OVERRIDES,
  resolveCompetitionHeaderLogo,
  resolveCompetitionLogo,
} from '@/lib/constants/competition-logos';

describe('competition logo resolvers', () => {
  it('keeps the compact WebP on ordinary surfaces for the senior World Cup', () => {
    expect(resolveCompetitionLogo(1, 'https://example.com/api-shield.png')).toBe(
      COMPETITION_LOGO_OVERRIDES[1],
    );
    expect(COMPETITION_LOGO_OVERRIDES[1]).toBe('/competitions/wc-2026-128.webp');
  });

  it('uses the full SVG only for the big competition-page header', () => {
    expect(resolveCompetitionHeaderLogo(1, 'https://example.com/api-shield.png')).toBe(
      COMPETITION_LOGO_FULL[1],
    );
    expect(COMPETITION_LOGO_FULL[1]).toBe('/competitions/wc-2026.svg');
  });
});
