'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
import { isRtl, type Locale } from '@/lib/i18n/config';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { key: 'competitions', href: '/competitions' },
  { key: 'teams', href: '/teams' },
  { key: 'players', href: '/players' },
  { key: 'live', href: '/live' },
] as const;

const sports = [
  { key: 'football', active: true },
  { key: 'basketball', active: false },
  { key: 'tennis', active: false },
] as const;

export function MobileDrawer() {
  const t = useTranslations('chrome');
  const tApp = useTranslations('app');
  const locale = useLocale();
  const pathname = usePathname();
  const side = isRtl(locale as Locale) ? 'right' : 'left';
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname.startsWith(`/${locale}${href}`);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle className="text-accent-gold">{tApp('name')}</SheetTitle>
          <SheetDescription>{tApp('tagline')}</SheetDescription>
        </SheetHeader>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              onClick={() => setOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-bg-surface-2 text-accent-gold'
                  : 'text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary',
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <Separator className="mx-4" />

        {/* Sport selector */}
        <div className="flex flex-col gap-1 px-4">
          {sports.map((sport) => (
            <div
              key={sport.key}
              className={cn(
                'flex items-center justify-between rounded-lg px-3 py-2.5 text-sm',
                sport.active ? 'font-medium text-text-primary' : 'text-text-tertiary',
              )}
            >
              {t(sport.key)}
              {!sport.active && (
                <Badge variant="secondary" className="text-[10px] leading-none">
                  {t('comingSoon')}
                </Badge>
              )}
            </div>
          ))}
        </div>

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
