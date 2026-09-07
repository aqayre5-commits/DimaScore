import { getTranslations } from 'next-intl/server';
import { cacheLife } from 'next/cache';
import { db } from '@/lib/db/client';
import { getHomeMatchesByCategory } from '@/lib/db/queries/homepage';
import { getMediaVideos } from '@/lib/db/queries/media';
import { getHomeRailSecondary } from '@/lib/db/queries/home-rail';
import { partitionHomeMatches } from '@/lib/homepage/slim-payload';
import { HomeMatchTabs } from '@/components/homepage/HomeMatchTabs';
import { HomeFeaturedVideos } from '@/components/homepage/HomeFeaturedVideos';
import { HomeRailWidgets } from '@/components/homepage/HomeRailWidgets';
import type { Locale } from '@/lib/i18n/config';
import type { HomeFixture } from '@/lib/db/queries/homepage';

async function getCachedSecondaryHomepage(locale: Locale) {
  'use cache';
  cacheLife('minutes');
  const [matchesByCategory, featuredVideos, railSecondary] = await Promise.all([
    getHomeMatchesByCategory(db),
    getMediaVideos(db, { isFeatured: true, limit: 12 }),
    getHomeRailSecondary(locale),
  ]);
  const { secondary } = partitionHomeMatches(matchesByCategory, locale);
  return { secondary, featuredVideos: featuredVideos.videos, railSecondary };
}

interface SecondaryTabsProps {
  locale: Locale;
  primary: { live: HomeFixture[]; upcoming: HomeFixture[]; results: HomeFixture[] };
}

export async function HomeSecondaryMatchTabs({ locale, primary }: SecondaryTabsProps) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const { secondary } = await getCachedSecondaryHomepage(locale);
  const labels = {
    all: t('all'),
    live: t('live'),
    upcoming: t('upcoming'),
    results: t('resultsTab'),
    today: t('today'),
    yesterday: t('yesterday'),
    tomorrow: t('tomorrow'),
    viewFullSchedule: t('viewFullSchedule'),
    showLess: t('showLess'),
    noMatches: t('noMatches'),
    noMatchesToday: t('noMatchesToday'),
    emptyState: t('emptyState'),
    yourMatches: t('yourMatches'),
  };
  return (
    <HomeMatchTabs
      live={[...primary.live, ...secondary.live]}
      upcoming={[...primary.upcoming, ...secondary.upcoming]}
      results={[...primary.results, ...secondary.results]}
      locale={locale}
      labels={labels}
    />
  );
}

export async function HomeDeferredVideos({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const { featuredVideos } = await getCachedSecondaryHomepage(locale);
  return (
    <HomeFeaturedVideos videos={featuredVideos} labels={{ featuredVideos: t('featuredVideos') }} />
  );
}

export async function HomeDeferredRail({
  locale,
  variant,
}: {
  locale: Locale;
  variant: 'desktop' | 'mobile';
}) {
  const { railSecondary } = await getCachedSecondaryHomepage(locale);
  return <HomeRailWidgets data={railSecondary} locale={locale} variant={variant} />;
}
