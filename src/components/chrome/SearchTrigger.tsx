'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { SearchModal } from './SearchModal';

export function SearchTrigger() {
  const t = useTranslations('search');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="icon" aria-label={t('trigger')} onClick={() => setOpen(true)}>
        <Search className="size-4" />
      </Button>
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
