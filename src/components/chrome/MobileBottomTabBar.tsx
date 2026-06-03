'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Trophy, Search, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'matches', icon: Trophy, href: '', disabled: false },
  { key: 'search', icon: Search, href: null, disabled: false },
  { key: 'favorites', icon: Heart, href: null, disabled: true },
  { key: 'settings', icon: Settings, href: null, disabled: true },
] as const;

/**
 * Mobile bottom tab bar — 4 tabs, fixed bottom, shown md:hidden only.
 * Matches homepage.md Section inherited chrome spec.
 */
export function MobileBottomTabBar() {
  const t = useTranslations('mobileTabBar');
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex min-h-14 items-center justify-around border-t border-border-subtle bg-bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;

        if (tab.disabled) {
          return (
            <span
              key={tab.key}
              className="flex flex-col items-center gap-0.5 px-3 py-1 text-text-tertiary/40"
            >
              <Icon className="size-5" />
              <span className="text-xs font-medium">{t(tab.key)}</span>
            </span>
          );
        }

        const tabHref = tab.href;
        const href = tabHref != null ? `/${locale}${tabHref}` : '#';
        const isActive =
          tabHref === ''
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : tabHref != null && pathname.startsWith(`/${locale}${tabHref}`);

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1',
              isActive ? 'text-accent-azure' : 'text-text-tertiary',
            )}
          >
            <Icon className="size-5" />
            <span className="text-xs font-medium">{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
