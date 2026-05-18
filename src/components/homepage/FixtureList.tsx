import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getFixturesMultiDay, type DaySection } from '@/lib/db/queries/fixtures-by-day';
import { FixtureListClient } from './FixtureListClient';
import type { Locale } from '@/lib/i18n/config';

interface FixtureListProps {
  locale: Locale;
}

export async function FixtureList({ locale }: FixtureListProps) {
  const t = await getTranslations({ locale, namespace: 'fixtureList' });
  const now = new Date();
  const sections = await getFixturesMultiDay(db, now, 14);

  const labels = {
    matches: t('matches'),
    emptyState: t('emptyState'),
  };

  return (
    <FixtureListClient
      sections={sections}
      locale={locale}
      todayStr={now.toISOString().slice(0, 10)}
      labels={labels}
    />
  );
}
