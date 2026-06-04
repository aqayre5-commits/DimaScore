import { getTranslations } from 'next-intl/server';
import { getHomeRailData } from '@/lib/db/queries/home-rail';
import { HomeNextMatch } from './HomeNextMatch';
import { HomeLiveGroupStandings } from './HomeLiveGroupStandings';
import { HomeTopMatches } from './HomeTodaysMatches';
import { HomeLionsAbroad } from './HomeLionsAbroad';
import { HomeStandingsMini } from './HomeStandingsMini';
import { HomeTopScorers } from './HomeTopScorers';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  locale: Locale;
}

export async function HomeRightRailStreamed({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const {
    nextFeatured,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
    standingsLeagues,
  } = await getHomeRailData(locale);

  const standingsLabels = {
    viewFullStandings: t('viewFullStandings'),
    team: t('team'),
    played: t('played'),
    won: t('won'),
    drawn: t('drawn'),
    lost: t('lost'),
    goalDiff: t('goalDiff'),
    points: t('points'),
  };

  return (
    <div className="space-y-4">
      {nextFeatured && (
        <HomeNextMatch
          match={nextFeatured.match}
          goals={nextFeatured.goals}
          locale={locale}
          labels={{
            nextMatch: t('nextMatch'),
            liveNow: t('liveNow'),
            viewMatch: t('viewMatch'),
          }}
        />
      )}

      {liveGroupStandings.length > 0 && (
        <HomeLiveGroupStandings
          groups={liveGroupStandings}
          locale={locale}
          labels={{
            liveGroupStandings: t('liveGroupStandings'),
            matchesToday: t('matchesToday'),
            viewFullGroup: t('viewFullGroup'),
            team: t('team'),
            played: t('played'),
            won: t('won'),
            drawn: t('drawn'),
            lost: t('lost'),
            goalDiff: t('goalDiff'),
            points: t('points'),
          }}
        />
      )}

      {topMatches.length > 0 && (
        <HomeTopMatches
          groups={topMatches}
          locale={locale}
          labels={{
            topMatches: t('topMatches'),
            seeAll: t('seeAll'),
            today: t('today'),
          }}
        />
      )}

      {moroccanPerformances.length > 0 && (
        <HomeLionsAbroad
          performances={moroccanPerformances}
          locale={locale}
          labels={{
            lionsAbroad: t('lionsAbroad'),
            last48h: t('last48h'),
            goal: t('goal'),
            assist: t('assist'),
            cleanSheet: t('cleanSheet'),
            viewAll: t('viewAll'),
          }}
        />
      )}

      {standingsLeagues[0] && (
        <HomeStandingsMini
          compName={standingsLeagues[0].compName}
          countryKey={standingsLeagues[0].countryKey}
          slug={standingsLeagues[0].slug}
          rows={standingsLeagues[0].rows}
          locale={locale}
          labels={standingsLabels}
        />
      )}

      {topScorersData.scorers.length > 0 && (
        <HomeTopScorers
          competitionName={topScorersData.competitionName}
          scorers={topScorersData.scorers}
          locale={locale}
          labels={{
            topScorers: t('topScorers'),
          }}
        />
      )}
    </div>
  );
}
