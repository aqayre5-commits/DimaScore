/**
 * DimaScore's social accounts, as verified by the owner. The footer renders exactly this list.
 * Add an account only once the owner confirms it is theirs (the @dimascore Instagram, TikTok and
 * YouTube handles are not, so they are not listed). The sitewide JSON-LD sameAs
 * (src/lib/seo/jsonld.ts) should list the same accounts.
 */
export const SOCIAL_ALLOWLIST = ['https://x.com/DimaScoreMa'] as const;

export const SOCIAL_LINKS: readonly {
  network: 'x';
  href: (typeof SOCIAL_ALLOWLIST)[number];
  label: string;
}[] = [{ network: 'x', href: 'https://x.com/DimaScoreMa', label: 'X' }];
