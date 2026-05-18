import { getTranslations } from 'next-intl/server';
import { db } from '@/lib/db/client';
import { getStandings, getCurrentSeasons } from '@/lib/db/queries';
import { StandingsWidget } from './StandingsWidget';
import { getCountrySlug } from '@/lib/constants/country-slugs';
import type { Locale } from '@/lib/i18n/config';

interface RightRailProps {
  locale: Locale;
}

// Widget definitions: competition ID, country key for URL, slug per locale
const STANDINGS_WIDGETS = [
  {
    compId: 200,
    countryKey: 'maroc',
    slugs: { fr: 'botola-pro', en: 'botola-pro', ar: 'البطولة-الاحترافية' },
    labelKey: 'botolaStandings' as const,
  },
  {
    compId: 39,
    countryKey: 'angleterre',
    slugs: { fr: 'premier-league', en: 'premier-league', ar: 'الدوري-الإنجليزي-الممتاز' },
    labelKey: 'eplStandings' as const,
  },
  {
    compId: 140,
    countryKey: 'espagne',
    slugs: { fr: 'la-liga', en: 'la-liga', ar: 'الدوري-الإسباني' },
    labelKey: 'laLigaStandings' as const,
  },
  {
    compId: 61,
    countryKey: 'france',
    slugs: { fr: 'ligue-1', en: 'ligue-1', ar: 'الدوري-الفرنسي' },
    labelKey: 'ligue1Standings' as const,
  },
  {
    compId: 78,
    countryKey: 'allemagne',
    slugs: { fr: 'bundesliga', en: 'bundesliga', ar: 'الدوري-الألماني' },
    labelKey: 'bundesligaStandings' as const,
  },
  {
    compId: 135,
    countryKey: 'italie',
    slugs: { fr: 'serie-a', en: 'serie-a', ar: 'الدوري-الإيطالي' },
    labelKey: 'serieAStandings' as const,
  },
] as const;

export async function RightRail({ locale }: RightRailProps) {
  const t = await getTranslations({ locale, namespace: 'rightRail' });

  // Get current seasons to know which year to query for each competition
  const currentSeasons = await getCurrentSeasons(db);
  const seasonMap = new Map(currentSeasons.map((s) => [s.competitionId, s.year]));

  // Fetch standings for all widgets in parallel
  const standingsResults = await Promise.all(
    STANDINGS_WIDGETS.map((w) => {
      const year = seasonMap.get(w.compId);
      if (!year) return Promise.resolve([]);
      return getStandings(db, w.compId, year);
    }),
  );

  return (
    <div className="hidden flex-col gap-4 xl:flex">
      {/* Widget 1: Botola Pro standings */}
      <StandingsWidget
        heading={t('botolaStandings')}
        rows={standingsResults[0]}
        viewAllHref={`/${locale}/competition/${getCountrySlug('maroc', locale)}/${STANDINGS_WIDGETS[0].slugs[locale]}`}
        viewAllLabel={t('viewAll')}
        locale={locale}
        rankLabel={t('rank')}
        teamLabel={t('team')}
        playedLabel={t('played')}
        pointsLabel={t('points')}
      />

      {/* Widget 2: UCL top scorers (placeholder — needs player stats data) */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        <div className="px-3 pt-3 pb-2">
          <h2 className="text-base font-semibold text-text-primary">{t('uclTopScorers')}</h2>
        </div>
        <div className="px-3 pb-3">
          <p className="text-xs text-text-tertiary">{t('comingSoon')}</p>
        </div>
      </div>

      {/* Widgets 3-7: European league standings */}
      {STANDINGS_WIDGETS.slice(1).map((w, idx) => (
        <StandingsWidget
          key={w.compId}
          heading={t(w.labelKey)}
          rows={standingsResults[idx + 1]}
          viewAllHref={`/${locale}/competition/${getCountrySlug(w.countryKey, locale)}/${w.slugs[locale]}`}
          viewAllLabel={t('viewAll')}
          locale={locale}
          rankLabel={t('rank')}
          teamLabel={t('team')}
          playedLabel={t('played')}
          pointsLabel={t('points')}
        />
      ))}
    </div>
  );
}
