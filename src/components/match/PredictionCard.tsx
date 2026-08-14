import { useTranslations } from 'next-intl';

export function PredictionCard() {
  const t = useTranslations('matchDetail');

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-6 text-center text-base text-text-tertiary">
      {t('predictionComingSoon')}
    </div>
  );
}
