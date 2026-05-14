'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Menu } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import {
  MEGA_MENU_SECTIONS,
  getFeaturedSlots,
  buildCompetitionHref,
  type MegaMenuEntry,
} from '@/lib/constants/competitions-mega-menu';
import { SearchTrigger } from './SearchTrigger';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileDrawer } from './MobileDrawer';

function MegaMenu({ locale, onClose }: { locale: Locale; onClose: () => void }) {
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
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-6 px-6 py-5 md:grid-cols-4">
        {MEGA_MENU_SECTIONS.map((section) => (
          <div key={section.titleKey}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {t(section.titleKey)}
            </h3>
            <ul className="flex flex-col gap-0.5">
              {section.entries
                .filter((e) => e.isCurrentlyVisible)
                .map((entry) => (
                  <li key={entry.competitionId}>
                    <Link
                      href={buildCompetitionHref(entry, locale)}
                      onClick={onClose}
                      className="block rounded px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
                    >
                      {t(entry.labelKey)}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeaturedSlot({
  entry,
  locale,
  isMostImminent,
}: {
  entry: MegaMenuEntry;
  locale: Locale;
  isMostImminent: boolean;
}) {
  const t = useTranslations('megaMenu');

  return (
    <Link
      href={buildCompetitionHref(entry, locale)}
      className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
    >
      {t(entry.labelKey)}
      {isMostImminent && (
        <span className="text-xs" aria-hidden="true">
          🔥
        </span>
      )}
    </Link>
  );
}

export function Topbar() {
  const t = useTranslations('topbar');
  const locale = useLocale() as Locale;
  const [megaOpen, setMegaOpen] = useState(false);
  const featuredSlots = getFeaturedSlots();

  return (
    <nav className="sticky top-10 z-40 border-b border-border-subtle bg-bg-surface">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-1 px-4">
        {/* Mobile hamburger */}
        <div className="md:hidden">
          <MobileDrawer />
        </div>

        {/* Logo */}
        <Link href={`/${locale}`} className="text-lg font-bold text-accent-gold">
          Atlas Kings
        </Link>

        {/* Desktop nav items */}
        <div className="hidden items-center gap-0.5 md:flex ms-4">
          <Link
            href={`/${locale}`}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('home')}
          </Link>

          {/* Botola Pro — permanent anchor */}
          <Link
            href={buildCompetitionHref(MEGA_MENU_SECTIONS[0].entries[0], locale)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            {t('botolaProShort')}
          </Link>

          {/* Featured slots */}
          {featuredSlots.map((entry, i) => (
            <FeaturedSlot
              key={entry.competitionId}
              entry={entry}
              locale={locale}
              isMostImminent={i === 0}
            />
          ))}

          {/* Mega-menu trigger */}
          <div className="relative">
            <button
              onClick={() => setMegaOpen((v) => !v)}
              className={cn(
                'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                megaOpen ? 'text-accent-gold' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {t('competitions')}
              <ChevronDown
                className={cn('size-3.5 transition-transform', megaOpen && 'rotate-180')}
              />
            </button>
          </div>
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

      {/* Mega-menu panel */}
      {megaOpen && <MegaMenu locale={locale} onClose={() => setMegaOpen(false)} />}
    </nav>
  );
}
