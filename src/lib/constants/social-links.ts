/**
 * DimaScore's social accounts, as verified by the owner. The footer renders exactly this list and
 * the sitewide JSON-LD sameAs (src/lib/seo/jsonld.ts) lists the same URLs, in the same order.
 * Add an account only once the owner confirms it is theirs (the @dimascore Instagram, TikTok and
 * YouTube handles are not, so they are not listed). The Facebook Page was confirmed by Reach Studio
 * (20 Nov 2026).
 */
export const SOCIAL_ALLOWLIST = [
  'https://x.com/DimaScoreMa',
  'https://www.facebook.com/profile.php?id=61596604236635',
] as const;

type SocialLocale = 'en' | 'fr' | 'ar';

export const SOCIAL_LINKS: readonly {
  network: 'x' | 'facebook';
  href: (typeof SOCIAL_ALLOWLIST)[number];
  /** Accessible name of the icon link, in the page language. */
  label: Record<SocialLocale, string>;
}[] = [
  {
    network: 'x',
    href: 'https://x.com/DimaScoreMa',
    label: { en: 'DimaScore on X', fr: 'DimaScore sur X', ar: 'ديما سكور على إكس' },
  },
  {
    network: 'facebook',
    href: 'https://www.facebook.com/profile.php?id=61596604236635',
    label: {
      en: 'DimaScore on Facebook',
      fr: 'DimaScore sur Facebook',
      ar: 'ديما سكور على فيسبوك',
    },
  },
];

export function socialLabel(label: Record<SocialLocale, string>, locale: string): string {
  return label[locale as SocialLocale] ?? label.en;
}
