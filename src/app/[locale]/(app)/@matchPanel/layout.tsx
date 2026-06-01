'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

export default function MatchPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const locale = useLocale();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (!children) return null;

  return (
    <Sheet open onOpenChange={handleClose}>
      <SheetContent
        side={locale === 'ar' ? 'left' : 'right'}
        className="w-full overflow-y-auto p-0 sm:max-w-[550px]"
      >
        <SheetTitle className="sr-only">Match details</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
