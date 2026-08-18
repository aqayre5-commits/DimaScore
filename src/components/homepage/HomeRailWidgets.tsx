import { Fragment } from 'react';
import { getTranslations } from 'next-intl/server';
import { HomeNextMatch } from './HomeNextMatch';
import { HomeLiveGroupStandings } from './HomeLiveGroupStandings';
import { HomeTopMatches } from './HomeTodaysMatches';
import { HomeLionsAbroad } from './HomeLionsAbroad';
import { HomeLeagueSnapshot } from './HomeLeagueSnapshot';
import { HomeTopPerformances } from './HomeTopPerformances';
import { HomeFifaRanking } from './HomeFifaRanking';
import { FIFA_RANKING_META } from '@/lib/constants/fifa-ranking';
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

// Final rail: next match → league snapshot → FIFA ranking → top performances.
// Mobile omits 'nextMatch' (the Live Now card) — it's lifted above the filter tabs in page.tsx.
// (lions / topMatches / liveGroups slots remain wired below but are no longer placed in the rail.)
const SEQUENCES: Record<Props['variant'], string[]> = {
  desktop: ['nextMatch', 'leagueSnapshot', 'fifaRanking', 'topPerformances'],
  mobile: ['leagueSnapshot', 'fifaRanking', 'topPerformances'],
};

export async function HomeRailWidgets({ data, locale, variant }: Props) {
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const {
    nextFeaturedCandidates,
    liveGroupStandings,
    topMatches,
    moroccanPerformances,
    leagueSnapshots,
    topPerformances,
    fifaRanking,
  } = data;

  // Static release date → deterministic (safe under cacheComponents); localized per request.
  const fifaAsOf = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(FIFA_RANKING_META.updatedAt));

  const widgets: Record<string, React.ReactNode> = {
    nextMatch:
      nextFeaturedCandidates.length > 0 ? (
        <HomeNextMatch
          candidates={nextFeaturedCandidates}
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
    leagueSnapshot:
      leagueSnapshots.length > 0 ? (
        <HomeLeagueSnapshot
          leagues={leagueSnapshots}
          locale={locale}
          labels={{
            tableTab: t('tableTab'),
            scorersTab: t('scorersTab'),
            viewFullStandings: t('viewFullStandings'),
            topScorers: t('topScorers'),
            team: t('team'),
            played: t('played'),
            won: t('won'),
            lost: t('lost'),
            goalDiff: t('goalDiff'),
            points: t('points'),
          }}
        />
      ) : null,
    topPerformances:
      topPerformances.length > 0 ? (
        <HomeTopPerformances
          performances={topPerformances}
          locale={locale}
          labels={{ topPerformances: t('topPerformances') }}
        />
      ) : null,
    fifaRanking:
      fifaRanking.length > 0 ? (
        <HomeFifaRanking
          rows={fifaRanking}
          locale={locale}
          labels={{
            fifaRanking: t('fifaRanking'),
            asOf: t('asOf', { date: fifaAsOf }),
          }}
        />
      ) : null,
  };

  return (
    <div className="space-y-2.5">
      {SEQUENCES[variant].map((key) =>
        widgets[key] ? <Fragment key={key}>{widgets[key]}</Fragment> : null,
      )}
    </div>
  );
}
