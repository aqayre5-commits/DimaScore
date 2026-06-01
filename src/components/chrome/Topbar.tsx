'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Menu } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import {
  MEGA_MENU_SECTIONS,
  getTopNavEntries,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { SearchTrigger } from './SearchTrigger';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileDrawer } from './MobileDrawer';

function MoreMegaMenu({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const t = useTranslations('megaMenu');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute start-0 end-0 top-full z-50 border-b border-border-subtle bg-bg-surface shadow-lg"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-6 py-5 md:grid-cols-3">
        {MEGA_MENU_SECTIONS.map((section) => {
          const visibleEntries = section.entries.filter((e) => e.isCurrentlyVisible);
          if (visibleEntries.length === 0) return null;
          return (
            <div key={section.titleKey}>
              <h3 className="label-caps mb-2">{t(section.titleKey)}</h3>
              <ul className="flex flex-col gap-0.5">
                {visibleEntries.map((entry) => (
                  <li key={`${entry.competitionId}-${entry.labelKey}`}>
                    <Link
                      href={buildCompetitionHref(entry, locale)}
                      prefetch={false}
                      onClick={onClose}
                      className="block rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-accent-azure/5 hover:text-accent-azure"
                    >
                      {t(entry.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Topbar() {
  const t = useTranslations('topbar');
  const tMega = useTranslations('megaMenu');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const topNavEntries = getTopNavEntries();

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-10 z-40 border-b border-border-subtle bg-bg-surface"
    >
      <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-0.5 px-4">
        {/* Mobile hamburger */}
        <div className="md:hidden">
          <MobileDrawer />
        </div>

        {/* Logo */}
        <Link href={`/${locale}`} className="me-3 text-lg font-bold">
          <span className="text-text-primary">Dima</span>
          <span className="text-accent-azure">Score</span>
        </Link>

        {/* Desktop nav — 11 direct competition links + More */}
        <div className="hidden items-center gap-0 lg:flex">
          {topNavEntries.map((entry) => {
            const href = buildCompetitionHref(entry, locale);
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={`${entry.competitionId}-${entry.labelKey}`}
                href={href}
                className={cn(
                  'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'text-accent-azure' : 'text-text-secondary hover:text-accent-azure',
                )}
              >
                {tMega(entry.labelKey)}
              </Link>
            );
          })}

          {/* More trigger */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
              moreOpen ? 'text-accent-azure' : 'text-text-secondary hover:text-accent-azure',
            )}
          >
            {t('more')}
            <ChevronDown className={cn('size-3 transition-transform', moreOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <SearchTrigger />
          <div className="hidden items-center gap-1 md:flex">
            <LangSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* More mega-menu panel */}
      {moreOpen && <MoreMegaMenu locale={locale} onClose={() => setMoreOpen(false)} />}
    </nav>
  );
}
