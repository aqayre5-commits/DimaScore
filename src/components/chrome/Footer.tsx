'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import { buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';

// Inline SVG social icons (16x16, stroke style matching Lucide conventions)

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 2l5.5 6L2 14M14 2l-5.5 6L14 14" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="12" height="12" rx="3" />
      <circle cx="8" cy="8" r="3" />
      <circle cx="11.5" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="1" y="3" width="14" height="10" rx="3" />
      <path d="M6.5 6v4l3.5-2z" />
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 2v8a4 4 0 1 1-3-3.87" />
      <path d="M10 2a4 4 0 0 0 4 4" />
    </svg>
  );
}

const socialLinks = [
  { Icon: XIcon, href: 'https://x.com/atlaskings', label: 'X' },
  {
    Icon: InstagramIcon,
    href: 'https://instagram.com/atlaskings',
    label: 'Instagram',
  },
  {
    Icon: YoutubeIcon,
    href: 'https://youtube.com/@atlaskings',
    label: 'YouTube',
  },
  {
    Icon: TiktokIcon,
    href: 'https://tiktok.com/@atlaskings',
    label: 'TikTok',
  },
] as const;

const competitionLinks = [
  {
    labelKey: 'botolaPro' as const,
    entry: {
      competitionId: 200,
      labelKey: 'botolaPro',
      countryKey: 'maroc',
      slugs: {
        fr: 'botola-pro',
        en: 'botola-pro',
        ar: 'البطولة-الاحترافية',
      },
      isCurrentlyVisible: true,
    },
  },
  {
    labelKey: 'premierLeague' as const,
    entry: {
      competitionId: 39,
      labelKey: 'premierLeague',
      countryKey: 'angleterre',
      slugs: {
        fr: 'premier-league',
        en: 'premier-league',
        ar: 'الدوري-الإنجليزي-الممتاز',
      },
      isCurrentlyVisible: true,
    },
  },
  {
    labelKey: 'laLiga' as const,
    entry: {
      competitionId: 140,
      labelKey: 'laLiga',
      countryKey: 'espagne',
      slugs: { fr: 'la-liga', en: 'la-liga', ar: 'الدوري-الإسباني' },
      isCurrentlyVisible: true,
    },
  },
  {
    labelKey: 'championsLeague' as const,
    entry: {
      competitionId: 2,
      labelKey: 'championsLeague',
      countryKey: 'uefa',
      slugs: {
        fr: 'ligue-des-champions',
        en: 'champions-league',
        ar: 'دوري-أبطال-أوروبا',
      },
      isCurrentlyVisible: true,
    },
  },
];

const legalLinks = [
  { key: 'legalNotice', href: '#' },
  { key: 'privacyPolicy', href: '#' },
  { key: 'contact', href: '#' },
] as const;

export function Footer() {
  const t = useTranslations('footer');
  const tApp = useTranslations('app');
  const tMega = useTranslations('megaMenu');
  const locale = useLocale() as Locale;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        {/* Desktop: 3-zone grid / Mobile: stacked */}
        <div className="flex flex-col gap-8 md:grid md:grid-cols-[1fr_2fr_1fr] md:gap-6">
          {/* Zone 1 — Brand + social */}
          <div className="flex flex-col gap-3">
            <span className="text-lg font-bold text-accent-gold">{tApp('name')}</span>
            <span className="text-sm text-text-secondary">{t('tagline')}</span>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-text-tertiary transition-colors hover:text-text-secondary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Zone 2 — Link columns */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {/* Competitions */}
            <div>
              <h3 className="label-caps mb-2">{t('competitions')}</h3>
              <ul className="flex flex-col gap-1">
                {competitionLinks.map(({ labelKey, entry }) => (
                  <li key={entry.competitionId}>
                    <Link
                      href={buildCompetitionHref(entry, locale)}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {tMega(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="label-caps mb-2">{t('resources')}</h3>
              <ul className="flex flex-col gap-1">
                {legalLinks.map((link) => (
                  <li key={link.key}>
                    <a
                      href={link.href}
                      className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {t(link.key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="label-caps mb-2">{t('about')}</h3>
              <ul className="flex flex-col gap-1">
                <li>
                  <a
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {t('aboutUs')}
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {t('faq')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Zone 3 — Loi 09-08 + copyright */}
          <div className="flex flex-col gap-2">
            <p className="text-xs leading-relaxed text-text-tertiary">{t('loi0908')}</p>
            <p className="text-xs text-text-tertiary">{t('copyright', { year })}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
