import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SOCIAL_ALLOWLIST, SOCIAL_LINKS, socialLabel } from '@/lib/constants/social-links';
import { buildOrganization } from '@/lib/seo/jsonld';

const X = 'https://x.com/DimaScoreMa';
const FACEBOOK = 'https://www.facebook.com/profile.php?id=61596604236635';
const UNCONFIRMED = /instagram\.com|tiktok\.com|youtube\.com|youtu\.be/;

describe('footer social links', () => {
  it('the allow-list is exactly X and the Facebook Page', () => {
    expect(SOCIAL_ALLOWLIST).toEqual([X, FACEBOOK]);
  });

  it('the footer renders exactly the allow-listed accounts, nothing else', () => {
    expect(SOCIAL_LINKS.map((l) => l.href)).toEqual([X, FACEBOOK]);
    expect(SOCIAL_LINKS.map((l) => l.network)).toEqual(['x', 'facebook']);
    for (const l of SOCIAL_LINKS) expect(l.href).not.toMatch(UNCONFIRMED);
  });

  it('each link has an accessible name in EN, FR and AR', () => {
    const fb = SOCIAL_LINKS.find((l) => l.network === 'facebook')!;
    expect(socialLabel(fb.label, 'en')).toBe('DimaScore on Facebook');
    expect(socialLabel(fb.label, 'fr')).toBe('DimaScore sur Facebook');
    expect(socialLabel(fb.label, 'ar')).toBe('ديما سكور على فيسبوك');
    const x = SOCIAL_LINKS.find((l) => l.network === 'x')!;
    expect(socialLabel(x.label, 'en')).toBe('DimaScore on X');
    expect(socialLabel(x.label, 'fr')).toBe('DimaScore sur X');
    expect(socialLabel(x.label, 'ar')).toBe('ديما سكور على إكس');
    expect(socialLabel(fb.label, 'de')).toBe('DimaScore on Facebook');
  });

  it('the footer hard-codes no social URL and links with rel="me noopener"', () => {
    const src = readFileSync('src/components/chrome/Footer.tsx', 'utf8');
    expect(src).not.toMatch(UNCONFIRMED);
    expect(src).not.toMatch(/facebook\.com|https:\/\/x\.com/);
    expect(src).toContain('SOCIAL_LINKS');
    expect(src).toContain('rel="me noopener"');
    expect(src).toContain('aria-label={socialLabel(label, locale)}');
  });

  it('JSON-LD Organization.sameAs is exactly [X, Facebook Page]', () => {
    const sameAs = buildOrganization('https://dimascore.ma').sameAs;
    expect(sameAs).toEqual([X, FACEBOOK]);
    expect(JSON.stringify(sameAs)).not.toMatch(UNCONFIRMED);
  });

  it('the social constants name no unconfirmed account URL', () => {
    // (jsonld.ts legitimately builds youtube.com URLs for VideoObject nodes; that is not sameAs.)
    expect(readFileSync('src/lib/constants/social-links.ts', 'utf8')).not.toMatch(UNCONFIRMED);
  });
});
