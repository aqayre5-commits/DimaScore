import { useTranslations } from 'next-intl';
import { DateStrip } from '@/components/chrome/DateStrip';

export default function HomePage() {
  const t = useTranslations('homepage');

  return (
    <>
      <DateStrip />
      <div className="flex items-center justify-center py-24 px-4">
        <p className="text-lg text-text-secondary">{t('emptyState')}</p>
      </div>
    </>
  );
}
