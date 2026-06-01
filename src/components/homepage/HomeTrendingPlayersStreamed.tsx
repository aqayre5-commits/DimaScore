import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getTrendingPlayers } from '@/lib/db/queries/homepage';
import { HomeTrendingPlayers } from './HomeTrendingPlayers';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  locale: Locale;
}

export async function HomeTrendingPlayersStreamed({ locale }: Props) {
  const [players, t] = await Promise.all([
    getTrendingPlayers(db, 6),
    getTranslations({ locale, namespace: 'homepage' }),
  ]);

  return (
    <HomeTrendingPlayers
      players={players}
      locale={locale}
      labels={{
        trendingPlayers: t('trendingPlayers'),
        viewAll: t('viewAll'),
        goals: t('goals'),
      }}
    />
  );
}
