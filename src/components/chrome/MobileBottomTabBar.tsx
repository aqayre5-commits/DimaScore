'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Home, Trophy, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Locale } from '@/lib/i18n/config';
import { getTopNavEntries, buildCompetitionHref } from '@/lib/constants/competitions-mega-menu';
import { SettingsSheet } from './SettingsSheet';

const SearchModal = dynamic(() => import('./SearchModal').then((m) => m.SearchModal), {
  ssr: false,
});

const tabClass = 'flex flex-col items-center gap-0.5 px-3 py-1';

/**
 * Mobile bottom tab bar — Home / WC26 / Search / Settings. Fixed bottom, md:hidden.
 * Search opens the same modal as the desktop header; Settings opens a sheet with the
 * theme + language controls.
 */
export function MobileBottomTabBar() {
  const t = useTranslations('mobileTabBar');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  const wcEntry = getTopNavEntries().find((e) => e.competitionId === 1);
  const wcHref = wcEntry ? buildCompetitionHref(wcEntry, locale) : `/${locale}`;

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isWc = wcHref !== `/${locale}` && pathname.startsWith(wcHref);

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center justify-around border-t border-border-subtle bg-bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Link
        href={`/${locale}`}
        className={cn(tabClass, isHome ? 'text-accent-azure' : 'text-text-tertiary')}
      >
        <Home className="size-5" />
        <span className="text-xs font-medium">{t('home')}</span>
      </Link>

      <Link
        href={wcHref}
        className={cn(tabClass, isWc ? 'text-accent-azure' : 'text-text-tertiary')}
      >
        <Trophy className="size-5" />
        <span className="text-xs font-medium">{t('wc26')}</span>
      </Link>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label={t('search')}
        className={cn(tabClass, 'text-text-tertiary')}
      >
        <Search className="size-5" />
        <span className="text-xs font-medium">{t('search')}</span>
      </button>

      <SettingsSheet />

      {searchOpen && <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </nav>
  );
}
