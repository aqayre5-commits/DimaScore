'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu } from 'lucide-react';
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
import { ALL_ENTRIES } from '@/lib/constants/competitions-mega-menu';
import { LeagueLeftRail } from '@/components/league/LeagueLeftRail';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';

// Competition logos come from a fixed CDN path, so derive them by id — no server fetch needed.
const COMPETITION_LOGOS: Record<number, string> = Object.fromEntries(
  ALL_ENTRIES.map((e) => [
    e.competitionId,
    `https://media.api-sports.io/football/leagues/${e.competitionId}.png`,
  ]),
);

export function MobileDrawer() {
  const t = useTranslations('topbar');
  const tApp = useTranslations('app');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const side = isRtl(locale) ? 'right' : 'left';
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="size-11" aria-label="Menu" />}
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side={side} className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-text-primary">{tApp('name')}</SheetTitle>
          <SheetDescription>{tApp('tagline')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-2 px-4">
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

          {/* The full competitions rail. Tapping any competition/team link closes the drawer —
              the click bubbles from the rail's <a> elements; the "View all" toggle is a <button>,
              so expanding it leaves the drawer open. */}
          <div
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setOpen(false);
            }}
          >
            <LeagueLeftRail locale={locale} competitionLogos={COMPETITION_LOGOS} />
          </div>
        </div>

        <Separator className="mx-4" />

        <div className="flex items-center gap-2 px-4">
          <LangSwitcher />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
