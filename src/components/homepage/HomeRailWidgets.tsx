import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';
import { HomeNextMatch } from './HomeNextMatch';
import { HomeLiveGroupStandings } from './HomeLiveGroupStandings';
import { HomeTopMatches } from './HomeTodaysMatches';
import { HomeLionsAbroad } from './HomeLionsAbroad';
import { HomeStandingsMini } from './HomeStandingsMini';
import { HomeTopScorers } from './HomeTopScorers';
import type { HomeRailData } from '@/lib/db/queries/home-rail';
import type { Locale } from '@/lib/i18n/config';

interface Props {
  data: HomeRailData;
  locale: Locale;
  /**
   * desktop = right-rail order (unchanged from the original rail).
   * mobile  = value-first order surfaced in the main flow on small screens.
   */
  variant: 'desktop' | 'mobile';
}

// Rail order: live/today content first, reference tables grouped at the bottom.
// Mobile omits 'nextMatch' (the Live Now card) — it's lifted above the filter tabs in page.tsx.
const SEQUENCES: Record<Props['variant'], string[]> = {
  desktop: ['nextMatch', 'topMatches', 'liveGroups', 'standings', 'scorers', 'lions'],
  mobile: ['topMatches', 'standings', 'scorers', 'liveGroups', 'lions'],
};

export async function HomeRailWidgets({ data, locale, variant }: Props) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const {
    nextFeatured,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    topScorersData,
    standingsLeagues,
  } = data;

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

  const widgets: Record<string, React.ReactNode> = {
    nextMatch: nextFeatured ? (
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
    ) : null,
    liveGroups:
      liveGroupStandings.length > 0 ? (
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
            live: t('live'),
          }}
        />
      ) : null,
    topMatches:
      topMatches.length > 0 ? (
        <HomeTopMatches
          groups={topMatches}
          locale={locale}
          labels={{
            topMatches: t('topMatches'),
            seeAll: t('seeAll'),
            today: t('today'),
          }}
        />
      ) : null,
    lions:
      moroccanPerformances.length > 0 ? (
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
      ) : null,
    standings: standingsLeagues[0] ? (
      <HomeStandingsMini
        compName={standingsLeagues[0].compName}
        countryKey={standingsLeagues[0].countryKey}
        slug={standingsLeagues[0].slug}
        rows={standingsLeagues[0].rows}
        locale={locale}
        labels={standingsLabels}
      />
    ) : null,
    scorers:
      topScorersData.scorers.length > 0 ? (
        <HomeTopScorers
          competitionName={topScorersData.competitionName}
          scorers={topScorersData.scorers}
          locale={locale}
          labels={{ topScorers: t('topScorers') }}
        />
      ) : null,
  };

  return (
    <div className="space-y-4">
      {SEQUENCES[variant].map((key) =>
        widgets[key] ? <Fragment key={key}>{widgets[key]}</Fragment> : null,
      )}
    </div>
  );
}
