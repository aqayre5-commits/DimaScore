import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  const locale = await getLocale();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-accent-azure text-6xl font-bold">404</span>
        <h1 className="text-display text-2xl font-semibold">{t('heading')}</h1>
        <p className="text-secondary text-sm">{t('body')}</p>
      </div>
      <Link
        href={`/${locale}`}
        className="bg-accent-azure hover:bg-accent-azure/90 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        {t('cta')}
      </Link>
    </div>
  );
}
