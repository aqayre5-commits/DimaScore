import type { Metadata } from 'next';
import { hubOgImage } from '@/lib/seo/hub-og-image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { cacheLife } from 'next/cache';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';
import { requireLocale } from '@/lib/i18n/require-locale';
import { BASE_URL } from '@/lib/constants/site';
import { db } from '@/lib/db/client';
import { getStandings } from '@/lib/db/queries';
import { getCurrentSeasonYear } from '@/lib/db/queries/league';
import { getHomeWindowFixtures } from '@/lib/db/queries/home-page';
import { directoryEntries, POPULAR_ORDER } from '@/lib/constants/competition-directory';
import { getLeagueCountryName } from '@/lib/constants/league-content';
import { competitionDisplayName } from '@/lib/competitions/display-name';
import { toSiteDateKey } from '@/lib/utils/date';
import { shiftDayKey, homeDayKey, type HomeFixture } from '@/lib/home/model';
import type { TeamSnapshot } from '@/lib/db/queries-hydrate';
import { CompetitionRail } from '@/components/match/centre/CompetitionRail';
import { getRailProps } from '@/components/match/centre/rail-props';
import { NavCompetitionRegister } from '@/components/chrome/NavCompetitionRegister';
import { mcFont } from '@/components/match/centre/font';
import {
  HomePage as HomeView,
  type HomeCompetitionMeta,
  type HomeStandingsOption,
} from '@/components/home/HomePage';
import '@/components/match/centre/match-centre.css';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const baseUrl = BASE_URL;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = requireLocale((await params).locale);
  const typedLocale: Locale = locale;
  const t = await getTranslations({ locale, namespace: 'homepage' });
  const title = t('metaTitle');
  const description = t('metaDescription');
  const pageUrl = `${baseUrl}/${locale}`;

  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${baseUrl}/${loc}`;
  }
  languages['x-default'] = `${baseUrl}/${defaultLocale}`;

  const ogImage = hubOgImage('home', locale, title);

  return {
    title,
    description,
    alternates: { canonical: pageUrl, languages },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'DimaScore',
      locale: typedLocale === 'fr' ? 'fr_FR' : typedLocale === 'ar' ? 'ar_MA' : 'en_US',
      type: 'website',
      images: ogImage.og,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title,
      description,
      images: ogImage.twitter,
    },
  };
}

// ── Data ──

/** Friendlies show only as matches on Home: they have no competition page of their own. */
const NO_PAGE_IDS = new Set([10, 667]);
/** Leagues always offered in "Live standings" (the reference's popular leagues, in its order). */
const STANDINGS_LEAGUES = [200, 39, 140, 61, 135, 78];
const STANDINGS_MAX = 12;
const STANDINGS_HASH: Record<Locale, string> = { en: 'standings', fr: 'classement', ar: 'الترتيب' };

function slimName(record: Record<string, string> | null | undefined, locale: Locale) {
  const r = record ?? {};
  const en = r.en ?? Object.values(r)[0] ?? '';
  return locale === 'en' ? { en } : { [locale]: r[locale] ?? en, en };
}

function slimTeam(t: TeamSnapshot | null, locale: Locale): TeamSnapshot | null {
  if (!t) return null;
  return {
    id: t.id,
    slug: t.slug,
    name: slimName(t.name, locale),
    shortName: slimName(t.shortName, locale),
    code: t.code,
    countryCode: t.countryCode,
    logoUrl: t.logoUrl,
    logoStatus: t.logoStatus ?? null,
    primaryColor: t.primaryColor ?? null,
    secondaryColor: t.secondaryColor ?? null,
    isNational: t.isNational,
  };
}

/**
 * Yesterday, today and tomorrow (Morocco calendar days) plus the next two days, so "Coming up"
 * can reach the following matchday. Every competition, friendlies included.
 */
async function getCachedHomeWindow() {
  'use cache';
  cacheLife('minutes');
  const now = Date.now();
  const todayKey = toSiteDateKey(new Date(now));
  // Morocco is UTC+0/+1: a UTC window one day wider on each side covers the site days; the
  // fixtures are then kept by their site-day key.
  const from = new Date(`${shiftDayKey(todayKey, -2)}T00:00:00Z`);
  const to = new Date(`${shiftDayKey(todayKey, 5)}T00:00:00Z`);
  const keep = new Set([-1, 0, 1, 2, 3].map((n) => shiftDayKey(todayKey, n)));
  const { fixtures, competitions } = await getHomeWindowFixtures(db, from, to);
  return {
    now,
    todayKey,
    fixtures: fixtures.filter((f) => keep.has(homeDayKey(f))),
    competitions,
  };
}

async function getCachedStandings(ids: number[], seasons: Record<number, number>) {
  'use cache';
  cacheLife('minutes');
  const out = await Promise.all(
    ids.map(async (id) => {
      const season = seasons[id] ?? (await getCurrentSeasonYear(db, id));
      if (season == null) return null;
      const rows = await getStandings(db, id, season);
      return rows.length > 0 ? { id, rows } : null;
    }),
  );
  return out.filter(
    (x): x is { id: number; rows: Awaited<ReturnType<typeof getStandings>> } => !!x,
  );
}

// ── Page ──

export default async function HomePage({ params }: PageProps) {
  const locale = requireLocale((await params).locale);
  setRequestLocale(locale);
  const typedLocale: Locale = locale;
  const [win, nav, t, tHome, tMenu, tMatch] = await Promise.all([
    getCachedHomeWindow(),
    getRailProps(typedLocale, -1),
    getTranslations({ locale, namespace: 'homepage' }),
    getTranslations({ locale, namespace: 'home' }),
    getTranslations({ locale, namespace: 'megaMenu' }),
    getTranslations({ locale, namespace: 'matchDetail' }),
  ]);

  const directory = new Map(directoryEntries(typedLocale).map((e) => [e.competitionId, e]));
  const compRows = new Map(win.competitions.map((c) => [c.id, c]));
  const competitions: Record<number, HomeCompetitionMeta> = {};
  for (const c of win.competitions) {
    const entry = directory.get(c.id);
    const menu = entry && tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : null;
    competitions[c.id] = {
      name: competitionDisplayName(c.name, typedLocale, menu, c.slug),
      href: entry && !NO_PAGE_IDS.has(c.id) ? entry.href : null,
      country: getLeagueCountryName(c.countryCode, typedLocale),
      logo: c.logoUrl,
      priority: c.displayPriority,
    };
  }

  const fixtures: HomeFixture[] = win.fixtures.map((f) => ({
    ...f,
    homeTeam: slimTeam(f.homeTeam, typedLocale),
    awayTeam: slimTeam(f.awayTeam, typedLocale),
  }));

  // Live standings: the popular leagues, then every other league playing in the window.
  const seasons: Record<number, number> = {};
  for (const f of fixtures) seasons[f.competitionId] ??= f.seasonYear;
  const playingLeagues = [...new Set(fixtures.map((f) => f.competitionId))]
    .filter((id) => compRows.get(id)?.type === 'League' && directory.has(id))
    .sort(
      (a, b) =>
        (POPULAR_ORDER as readonly number[]).indexOf(a) -
          (POPULAR_ORDER as readonly number[]).indexOf(b) || a - b,
    );
  const leagueIds = [...new Set([...STANDINGS_LEAGUES, ...playingLeagues])].slice(0, STANDINGS_MAX);
  const leagueSeasons = Object.fromEntries(
    leagueIds.filter((id) => seasons[id] != null).map((id) => [id, seasons[id]]),
  );
  const tables = await getCachedStandings(leagueIds, leagueSeasons);
  const railLogo = new Map(nav.rail.all.map((e) => [e.id, e.logo]));
  const standings: HomeStandingsOption[] = tables.flatMap(({ id, rows }) => {
    const entry = directory.get(id);
    if (!entry) return [];
    return [
      {
        id,
        label: tMenu.has(entry.labelKey) ? tMenu(entry.labelKey) : String(id),
        href: `${entry.href}#${STANDINGS_HASH[typedLocale]}`,
        logo: railLogo.get(id) ?? compRows.get(id)?.logoUrl ?? null,
        rows: rows.map((r) => ({ ...r, team: slimTeam(r.team, typedLocale) })),
      },
    ];
  });

  const dayKeys = [-1, 0, 1].map((n) => shiftDayKey(win.todayKey, n));
  const overall = nav.rail.labels.overall;
  const rail = { ...nav.rail, overallCurrent: true };

  return (
    <>
      <NavCompetitionRegister current={{ id: -1, label: overall, short: overall }} rail={rail} />
      <div className={`mc ${mcFont.variable}`}>
        <div className="shell">
          <aside className="rail">
            <CompetitionRail {...rail} />
          </aside>
          <div className="mc-mainarea">
            <HomeView
              locale={typedLocale}
              todayKey={win.todayKey}
              now={win.now}
              dayKeys={dayKeys}
              fixtures={fixtures}
              competitions={competitions}
              editorialOrder={[...POPULAR_ORDER]}
              standings={standings}
              labels={{
                heading: t('pageHeading'),
                comingUp: tHome('comingUp'),
                todaysMatches: tHome('todaysMatches'),
                chooseDay: tHome('chooseDay'),
                all: tHome('all'),
                live: tHome('live'),
                upcoming: tHome('upcoming'),
                finished: tHome('finished'),
                liveStandings: tHome('liveStandings'),
                chooseLeague: tHome('chooseLeague'),
                provisional: tHome('provisional'),
                matchCentre: tHome('matchCentre'),
                today: t('today'),
                yesterday: t('yesterday'),
                tomorrow: t('tomorrow'),
                liveTag: tMatch('live'),
                halfTime: tMatch('halfTime'),
                fullTime: tMatch('fullTime'),
                noMatchesDay: tHome('noMatchesDay'),
                noMatchesFilter: tHome('noMatchesFilter'),
                showAll: tHome('showAll'),
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
