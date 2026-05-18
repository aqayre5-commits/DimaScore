import { useTranslations } from 'next-intl';

export function MediaCard() {
  const t = useTranslations('matchDetail');

  return (
    <div className="rounded-lg border border-border-subtle bg-bg-surface px-4 py-6 text-center text-sm text-text-tertiary">
      {t('mediaComingSoon')}
    </div>
  );
}
