'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function SearchTrigger() {
  const t = useTranslations('search');

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('trigger')}
      onClick={() => {
        // Phase 10: opens Meilisearch modal
      }}
    >
      <Search className="size-4" />
    </Button>
  );
}
