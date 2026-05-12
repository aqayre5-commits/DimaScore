'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { SearchTrigger } from './SearchTrigger';
import { LangSwitcher } from './LangSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { MobileDrawer } from './MobileDrawer';

const navItems = [
  { key: 'competitions', href: '/competitions' },
  { key: 'teams', href: '/teams' },
  { key: 'players', href: '/players' },
  { key: 'live', href: '/live' },
] as const;

export function TopNav() {
  const t = useTranslations('chrome');
  const locale = useLocale();
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname.startsWith(`/${locale}${href}`);
  }

  return (
    <nav className="flex h-14 items-center gap-4 border-b border-border-subtle bg-bg-surface ps-4 pe-4">
      {/* Mobile: hamburger + logo */}
      <div className="flex items-center gap-3 md:hidden">
        <MobileDrawer />
      </div>

      {/* Logo */}
      <Link href={`/${locale}`} className="text-lg font-bold text-accent-gold">
        Atlas Kings
      </Link>

      {/* Desktop nav links */}
      <div className="hidden items-center gap-1 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={`/${locale}${item.href}`}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive(item.href)
                ? 'text-accent-gold'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t(item.key)}
          </Link>
        ))}
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
    </nav>
  );
}
