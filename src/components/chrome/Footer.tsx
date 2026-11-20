'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/i18n/config';
import {
  buildCompetitionHref,
  findEntryByCompetitionId,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { SOCIAL_LINKS, socialLabel } from '@/lib/constants/social-links';

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
      aria-hidden="true"
    >
      <path d="M2 2l5.5 6L2 14M14 2l-5.5 6L14 14" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.5 2.5H9a2.5 2.5 0 0 0-2.5 2.5v9M4.5 8h5" />
    </svg>
  );
}

// Only the owner's verified accounts (src/lib/constants/social-links.ts); each one needs an icon here.
const SOCIAL_ICONS = { x: XIcon, facebook: FacebookIcon } as const;
const socialLinks = SOCIAL_LINKS.map((l) => ({ ...l, Icon: SOCIAL_ICONS[l.network] }));

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
  { key: 'terms', route: 'terms' },
  { key: 'cookiePolicy', route: 'cookies' },
  { key: 'contact', route: 'contact' },
] as const;

function CopyrightLine() {
  const t = useTranslations('footer');
  return <>{t('copyright', { year: new Date().getFullYear() })}</>;
}

export function Footer() {
  const t = useTranslations('footer');
  const tApp = useTranslations('app');
  const tMega = useTranslations('megaMenu');
  const locale = useLocale() as Locale;
  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          {/* Brand — name, description, social (wide left column) */}
          <div className="flex flex-col gap-3 md:w-72 md:shrink-0">
            <span className="text-xl font-bold text-text-primary">{tApp('name')}</span>
            <p className="text-sm leading-relaxed text-text-secondary">{t('description')}</p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ Icon, href, label, network }) => (
                <a
                  key={network}
                  href={href}
                  target="_blank"
                  rel="me noopener"
                  aria-label={socialLabel(label, locale)}
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
                <li>
                  <Link
                    href={`/${locale}/lions-abroad`}
                    className="text-base text-text-secondary transition-colors hover:text-text-primary"
                  >
                    {t('lionsAbroad')}
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
          <p className="text-xs text-text-tertiary">
            {/* Only the year is request-time; the rest of the footer stays in the static shell. */}
            <Suspense fallback={t('copyright', { year: '' })}>
              <CopyrightLine />
            </Suspense>
          </p>
        </div>
      </div>
    </footer>
  );
}
