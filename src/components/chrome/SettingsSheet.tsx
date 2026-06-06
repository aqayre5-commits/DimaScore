'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';
import { LangSwitcher } from './LangSwitcher';

/**
 * Mobile "Settings" tab — a bottom sheet exposing the display theme toggle and
 * the language switcher. Reuses the existing self-contained controls so there is
 * no duplicated state. Triggered from the mobile bottom tab bar.
 */
export function SettingsSheet() {
  const t = useTranslations('mobileTabBar');
  const tNav = useTranslations('nav');

  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={t('settings')}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-text-tertiary"
          />
        }
      >
        <Settings className="size-5" />
        <span className="text-xs font-medium">{t('settings')}</span>
      </SheetTrigger>

      <SheetContent side="bottom" className="pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle className="text-text-primary">{t('settings')}</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between border-b border-border-subtle py-3">
            <span className="text-sm font-medium text-text-primary">{t('theme')}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-sm font-medium text-text-primary">{tNav('language')}</span>
            <LangSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
