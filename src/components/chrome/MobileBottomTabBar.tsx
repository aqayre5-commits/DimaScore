'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Trophy, Search, Heart, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { key: 'matches', icon: Trophy, href: '' },
  { key: 'search', icon: Search, href: null },
  { key: 'favorites', icon: Heart, href: '/favoris' },
  { key: 'settings', icon: Settings, href: '/parametres' },
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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-around border-t border-border-subtle bg-bg-surface md:hidden">
      {tabs.map((tab) => {
        const href = tab.href != null ? `/${locale}${tab.href}` : '#';
        const isActive =
          tab.href === ''
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : tab.href != null && pathname.startsWith(`/${locale}${tab.href}`);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.key}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1',
              isActive ? 'text-text-primary' : 'text-text-tertiary',
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{t(tab.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
