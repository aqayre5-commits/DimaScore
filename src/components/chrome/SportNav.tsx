import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';

export function SportNav() {
  const t = useTranslations('chrome');

  return (
    <div className="hidden h-10 items-center gap-6 border-b border-border-subtle bg-bg-surface ps-4 pe-4 md:flex">
      {/* Football — active */}
      <span className="flex h-full items-center border-b-2 border-accent-gold text-sm font-medium text-text-primary">
        {t('football')}
      </span>

      {/* Basketball — coming soon */}
      <span className="flex items-center gap-2 text-sm text-text-tertiary">
        {t('basketball')}
        <Badge variant="secondary" className="text-[10px] leading-none">
          {t('comingSoon')}
        </Badge>
      </span>

      {/* Tennis — coming soon */}
      <span className="flex items-center gap-2 text-sm text-text-tertiary">
        {t('tennis')}
        <Badge variant="secondary" className="text-[10px] leading-none">
          {t('comingSoon')}
        </Badge>
      </span>
    </div>
  );
}
