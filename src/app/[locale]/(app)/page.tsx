import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('app');

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-canvas">
      <h1 className="text-4xl font-bold text-accent-gold">{t('name')}</h1>
    </main>
  );
}
