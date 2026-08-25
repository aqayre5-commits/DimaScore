'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import {
  buildCompetitionHref,
  findEntryByCompetitionId,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';

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
  { Icon: XIcon, href: 'https://x.com/dimascore', label: 'X' },
  {
    Icon: InstagramIcon,
    href: 'https://instagram.com/dimascore',
    label: 'Instagram',
  },
  {
    Icon: YoutubeIcon,
    href: 'https://youtube.com/@dimascore',
    label: 'YouTube',
  },
  {
    Icon: TiktokIcon,
    href: 'https://tiktok.com/@dimascore',
    label: 'TikTok',
  },
] as const;

// Coverage columns — titleKey is a `megaMenu` i18n key; ids resolve to canonical localized
// competition entries via the mega-menu (single source of truth for slugs), so links never drift.
const COVERAGE_COLUMNS: { titleKey: string; ids: number[] }[] = [
  { titleKey: 'topLeagues', ids: [39, 140, 78, 135, 61, 200] },
  { titleKey: 'cupsAndContinental', ids: [2, 3, 848, 12, 20, 822] },
  { titleKey: 'international', ids: [1, 6, 922, 29, 32] },
];

const coverageColumns = COVERAGE_COLUMNS.map((col) => ({
  titleKey: col.titleKey,
  entries: col.ids
    .map((id) => findEntryByCompetitionId(id))
    .filter((e): e is MegaMenuEntry => e !== null),
}));

const legalLinks = [
  { key: 'legalNotice', route: 'legal' },
  { key: 'privacyPolicy', route: 'privacy' },
  { key: 'contact', route: 'contact' },
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
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          {/* Brand — name, description, social (wide left column) */}
          <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
            <span className="text-xl font-bold text-text-primary">{tApp('name')}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{t('description')}</p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-text-tertiary transition-colors hover:text-accent-green"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns — coverage groups + resources + about */}
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {coverageColumns.map((col) => (
              <div key={col.titleKey}>
                <h3 className="label-caps mb-2">{tMega(col.titleKey)}</h3>
                <ul className="flex flex-col gap-1">
                  {col.entries.map((entry) => (
                    <li key={`${entry.competitionId}-${entry.labelKey}`}>
                      <Link
                        href={buildCompetitionHref(entry, locale)}
                        className="text-base text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {tMega(entry.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Resources */}
            <div>
              <h3 className="label-caps mb-2">{t('resources')}</h3>
              <ul className="flex flex-col gap-1">
                {legalLinks.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={`/${locale}/${link.route}`}
                      className="text-base text-text-secondary transition-colors hover:text-text-primary"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* About */}
            <div>
              <h3 className="label-caps mb-2">{t('about')}</h3>
              <ul className="flex flex-col gap-1">
                <li>
                  <Link
                    href={`/${locale}/about`}
                    className="text-base text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {t('aboutUs')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/faq`}
                    className="text-base text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {t('faq')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-footer — copyright */}
      <div className="border-t border-border-subtle">
        <div className="mx-auto flex max-w-[1280px] items-center justify-center px-4 py-3">
          <p className="text-xs text-text-tertiary">{t('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
