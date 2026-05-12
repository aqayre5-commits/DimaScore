'use client';

import { useTranslations } from 'next-intl';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';

const sections = [
  { value: 'featured', key: 'featured' },
  { value: 'morocco', key: 'morocco' },
  { value: 'countries', key: 'countries' },
] as const;

export function LeftRail() {
  const t = useTranslations('leftRail');

  return (
    <aside className="hidden w-[280px] shrink-0 border-e border-border-subtle bg-bg-surface lg:block">
      <Accordion defaultValue={[0, 1, 2]} multiple>
        {sections.map((section, index) => (
          <AccordionItem key={section.value} value={index}>
            <AccordionTrigger className="px-4 text-sm font-medium text-text-primary">
              {t(section.key)}
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <p className="py-4 text-sm text-text-tertiary">{t('comingSoon')}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}
