'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, ChevronDown } from 'lucide-react';
import { isRtl, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  MEGA_MENU_SECTIONS,
  getFeaturedSlots,
  buildCompetitionHref,
} from '@/lib/constants/competitions-mega-menu';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function MobileDrawer() {
  const t = useTranslations('topbar');
  const tApp = useTranslations('app');
  const tMega = useTranslations('megaMenu');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const side = isRtl(locale) ? 'right' : 'left';
  const [open, setOpen] = useState(false);
  const [competitionsOpen, setCompetitionsOpen] = useState(false);

  const featuredSlots = getFeaturedSlots();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="size-11" aria-label="Menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle className="text-text-primary">{tApp('name')}</SheetTitle>
          <SheetDescription>{tApp('tagline')}</SheetDescription>
        </SheetHeader>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-4">
          {/* Home */}
          <Link
            href={`/${locale}`}
            onClick={() => setOpen(false)}
            className={cn(
              'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              pathname === `/${locale}` || pathname === `/${locale}/`
                ? 'bg-bg-surface-2 text-text-primary'
                : 'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary',
            )}
          >
            {t('home')}
          </Link>

          {/* Botola Pro — permanent anchor */}
          <Link
            href={buildCompetitionHref(MEGA_MENU_SECTIONS[0].entries[0], locale)}
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
          >
            {t('botolaProShort')}
          </Link>

          {/* Featured slots */}
          {featuredSlots.map((entry) => (
            <Link
              key={entry.competitionId}
              href={buildCompetitionHref(entry, locale)}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
            >
              {tMega(entry.labelKey)}
            </Link>
          ))}

          {/* Competitions expandable */}
          <button
            onClick={() => setCompetitionsOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
          >
            {t('competitions')}
            <ChevronDown
              className={cn('size-4 transition-transform', competitionsOpen && 'rotate-180')}
            />
          </button>
          {competitionsOpen && (
            <div className="flex flex-col gap-0.5 ps-4">
              {MEGA_MENU_SECTIONS.flatMap((section) =>
                section.entries
                  .filter((e) => e.isCurrentlyVisible)
                  .map((entry) => (
                    <Link
                      key={entry.competitionId}
                      href={buildCompetitionHref(entry, locale)}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-surface-2 hover:text-text-primary"
                    >
                      {tMega(entry.labelKey)}
                    </Link>
                  )),
              )}
            </div>
          )}
        </nav>

        <Separator className="mx-4" />

        {/* Bottom actions */}
        <div className="flex items-center gap-2 px-4">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
