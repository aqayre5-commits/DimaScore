import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOCIAL_ALLOWLIST, SOCIAL_LINKS } from '@/lib/constants/social-links';
import { buildOrganization } from '@/lib/seo/jsonld';

describe('footer social links', () => {
  it('every footer social href is on the allow-list (X only for now)', () => {
    expect(SOCIAL_ALLOWLIST).toEqual(['https://x.com/DimaScoreMa']);
    for (const l of SOCIAL_LINKS) expect(SOCIAL_ALLOWLIST).toContain(l.href);
  });

  it('the footer hard-codes no other social URL', () => {
    const src = readFileSync('src/components/chrome/Footer.tsx', 'utf8');
    expect(src).not.toMatch(
      /instagram\.com|tiktok\.com|youtube\.com|facebook\.com|https:\/\/x\.com/,
    );
    expect(src).toContain('SOCIAL_LINKS');
  });

  it('JSON-LD sameAs lists the same accounts', () => {
    expect(buildOrganization('https://dimascore.ma').sameAs).toEqual([...SOCIAL_ALLOWLIST]);
  });
});
