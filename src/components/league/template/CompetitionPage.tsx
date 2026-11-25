'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { mcFont } from '@/components/match/centre/font';
import type { FixtureWithTeams, StandingRow } from '@/lib/db/queries';
import type { TopPlayerRow, TopCardRow, RoundInfo } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { formatDateLabel } from '@/lib/utils/date';
import {
  pickKeyMatches,
  pickFeaturedMatch,
  uniqueDayKeys,
  defaultDayKey,
  buildMatchweekOptions,
  filterFixtures,
  groupFixturesByDay,
  fixtureDayKey,
  type FixtureFilter,
  type TableSplit,
} from '@/lib/competitions/template-model';
import {
  CompetitionIdentity,
  FeaturedMatch,
  UpcomingRail,
  CompetitionMatchRow,
  StandingsTable,
  PlayerRanking,
  StatsBoard,
  ClubDetails,
  PeriodSelect,
  mapScorers,
  mapAssists,
  usePatchedFixtures,
} from './CompetitionBits';
import '../competition-page.css';

export interface CompetitionTabHashes {
  overview: string;
  standings: string;
  fixtures: string;
  stats: string;
  teams: string;
}

export interface CompetitionPageProps {
  locale: Locale;
  competitionId: number;
  competitionName: string;
  logoSrc: string | null;
  invertLogo: boolean;
  countryName: string | null;
  countryFlag: string | null;
  introText: string | null;
  seasonYear: number;
  seasonLabel: string;
  availableSeasons: { year: number; isCurrent: boolean }[];
  currentSeasonYear?: number | null;
  basePath: string;
  hashes: CompetitionTabHashes;
  fixtures: FixtureWithTeams[];
  standings: StandingRow[];
  rounds: RoundInfo[];
  defaultRound: number;
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards: TopCardRow[];
  clubs: {
    id: number;
    slug: string;
    name: string;
    logoUrl: string | null;
    logoStatus?: import('@/lib/logos/status').LogoStatus | null;
    code?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }[];
  tableCaption?: string;
  todayKey: string;
  statsPlayerCount?: number;
  statsThroughLabel?: string | null;
}

const TAB_KEYS = ['overview', 'fixtures', 'standings', 'stats', 'teams'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function hashToKey(hashes: CompetitionTabHashes, hash: string): TabKey | null {
  const entries: [TabKey, string][] = [
    ['overview', hashes.overview],
    ['fixtures', hashes.fixtures],
    ['standings', hashes.standings],
    ['stats', hashes.stats],
    ['teams', hashes.teams],
  ];
  if (TAB_KEYS.includes(hash as TabKey)) return hash as TabKey;
  const found = entries.find(([, h]) => h === hash);
  return found ? found[0] : null;
}

function initScript(hashes: CompetitionTabHashes): string {
  const map: Record<string, TabKey> = {
    [hashes.overview]: 'overview',
    [hashes.fixtures]: 'fixtures',
    [hashes.standings]: 'standings',
    [hashes.stats]: 'stats',
    [hashes.teams]: 'teams',
    overview: 'overview',
    fixtures: 'fixtures',
    standings: 'standings',
    stats: 'stats',
    teams: 'teams',
  };
  return `(function(){try{var r=document.currentScript.parentElement;var h=location.hash.slice(1);var a=${JSON.stringify(
    map,
  )};var k=a[h];if(k)r.setAttribute('data-tab',k);}catch(e){}})();`;
}

export function CompetitionPage({
  locale,
  competitionId,
  competitionName,
  logoSrc,
  invertLogo,
  countryName,
  countryFlag,
  introText,
  seasonYear,
  seasonLabel,
  availableSeasons,
  currentSeasonYear,
  basePath,
  hashes,
  fixtures,
  standings,
  rounds,
  defaultRound,
  topScorers,
  topAssists,
  topCards,
  clubs,
  tableCaption,
  todayKey,
  statsPlayerCount = 0,
  statsThroughLabel = null,
}: CompetitionPageProps) {
  const t = useTranslations('leaguePage');
  const rootRef = useRef<HTMLDivElement>(null);
  const patched = usePatchedFixtures(fixtures);
  const [tab, setTab] = useState<TabKey>('overview');

  const now = useMemo(() => new Date(todayKey + 'T12:00:00Z'), [todayKey]);
  const featured = useMemo(() => pickFeaturedMatch(patched, now), [patched, now]);
  const keyMatches = useMemo(() => {
    const keys = pickKeyMatches(patched, 3, now);
    if (!featured) return keys;
    const rest = keys.filter((f) => f.id !== featured.id);
    const filled = rest.length >= 2 ? rest : keys;
    return filled.slice(0, 3);
  }, [patched, featured, now]);

  const days = useMemo(() => uniqueDayKeys(patched), [patched]);
  const [day, setDay] = useState(() => defaultDayKey(patched, now));
  const [filter, setFilter] = useState<FixtureFilter>('all');
  const [round, setRound] = useState(defaultRound);
  const [split, setSplit] = useState<TableSplit>('overall');

  const matchweeks = useMemo(
    () =>
      buildMatchweekOptions(
        patched,
        rounds,
        locale,
        (n, label) => localizeRound(label, locale) || t('roundNumber', { n }),
      ),
    [patched, rounds, locale, t],
  );
  const currentWeek = matchweeks.find((w) => w.roundNumber === round) ?? matchweeks[0];

  const dayFixtures = useMemo(
    () => patched.filter((f) => fixtureDayKey(f) === day),
    [patched, day],
  );
  const weekFixtures = useMemo(() => {
    const ids = new Set(currentWeek?.fixtureIds ?? []);
    const inWeek =
      ids.size > 0
        ? patched.filter((f) => ids.has(f.id))
        : patched.filter((f) => f.roundNumber === round);
    return filterFixtures(inWeek, filter, now);
  }, [patched, currentWeek, round, filter, now]);
  const weekGroups = useMemo(() => groupFixturesByDay(weekFixtures), [weekFixtures]);

  const overviewScorers = useMemo(() => {
    const all = mapScorers(topScorers);
    if (all.length === 0) return all;
    const cut = all[9]?.value;
    if (cut == null) return all.slice(0, 10);
    // Include everyone tied at the 10th-place cut-off.
    return all.filter((p, i) => i < 10 || p.value === cut);
  }, [topScorers]);

  useEffect(() => {
    function apply() {
      const key = hashToKey(hashes, window.location.hash.slice(1));
      if (key) {
        setTab(key);
        rootRef.current?.setAttribute('data-tab', key);
      }
    }
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [hashes]);

  const select = useCallback(
    (key: TabKey) => {
      setTab(key);
      rootRef.current?.setAttribute('data-tab', key);
      const hash = hashes[key];
      if (window.location.hash.slice(1) !== hash) {
        window.history.replaceState(null, '', `#${hash}`);
      }
    },
    [hashes],
  );

  const visibleTabs: { key: TabKey; hash: string; label: string }[] = [
    { key: 'overview', hash: hashes.overview, label: t('overviewTab') },
    { key: 'fixtures', hash: hashes.fixtures, label: t('viewFixtures') },
    { key: 'standings', hash: hashes.standings, label: t('tableTab') },
    { key: 'stats', hash: hashes.stats, label: t('stats') },
  ];

  function onTabKey(e: KeyboardEvent, index: number) {
    let next: number | null = null;
    if (e.key === 'ArrowRight') next = (index + 1) % visibleTabs.length;
    if (e.key === 'ArrowLeft') next = (index - 1 + visibleTabs.length) % visibleTabs.length;
    if (next == null) return;
    e.preventDefault();
    select(visibleTabs[next].key);
  }

  const todayLabel = t('today');
  const upcomingHeading = t('upcoming');
  const rail = <UpcomingRail fixtures={keyMatches} locale={locale} heading={upcomingHeading} />;

  return (
    <div className={`pl pl-page ${mcFont.variable}`} data-pl-root data-season={seasonLabel}>
      <CompetitionIdentity
        competitionId={competitionId}
        name={competitionName}
        logoSrc={logoSrc}
        invertLogo={invertLogo}
        countryName={countryName}
        countryFlag={countryFlag}
        seasonYear={seasonYear}
        availableSeasons={availableSeasons}
        currentSeasonYear={currentSeasonYear}
        locale={locale}
        basePath={basePath}
      />

      <div ref={rootRef} className="pl-panels" data-tab={tab} data-pl-tabs suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: initScript(hashes) }} />
        <nav className="pl-tabs" aria-label={competitionName}>
          {visibleTabs.map((item, i) => (
            <a
              key={item.key}
              href={`#${item.hash}`}
              className="pl-tab"
              data-pl-tab={item.key}
              aria-current={tab === item.key ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                select(item.key);
              }}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div data-pl-panel="overview">
          <div className="pl-layout pl-overview">
            <section className="pl-feature">
              {featured ? (
                <FeaturedMatch
                  fixture={featured}
                  locale={locale}
                  competitionName={competitionName}
                  roundLabel={featured.round ? localizeRound(featured.round, locale) : null}
                />
              ) : (
                <p className="pl-empty">{t('noFixturesAvailable')}</p>
              )}
            </section>
            {rail}
            <section className="pl-schedule">
              <div className="pl-head">
                <h2 id="pl-day-heading">{t('fixtures')}</h2>
                {days.length > 0 && (
                  <PeriodSelect
                    labelledBy="pl-day-heading"
                    value={day}
                    onChange={setDay}
                    display={formatDateLabel(day, locale, todayLabel)}
                  >
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {formatDateLabel(d, locale, todayLabel)}
                      </option>
                    ))}
                  </PeriodSelect>
                )}
              </div>
              {dayFixtures.length === 0 ? (
                <p className="pl-empty">{t('noFixturesOnDay')}</p>
              ) : (
                dayFixtures.map((f) => (
                  <CompetitionMatchRow key={f.id} fixture={f} locale={locale} />
                ))
              )}
            </section>
            <section className="pl-summary">
              <div className="pl-head">
                <h2>{t('standings')}</h2>
              </div>
              {standings.length > 0 ? (
                <StandingsTable
                  standings={standings}
                  fixtures={patched}
                  locale={locale}
                  split="overall"
                  caption={tableCaption}
                />
              ) : (
                <p className="pl-empty">{t('comingSoon')}</p>
              )}
            </section>
            <section className="pl-leaders">
              <div className="pl-head">
                <h2>{t('topScorers')}</h2>
                <a
                  className="link"
                  href={`#${hashes.stats}`}
                  onClick={(e) => {
                    e.preventDefault();
                    select('stats');
                  }}
                >
                  {t('allStats')}
                </a>
              </div>
              <PlayerRanking title={t('goals')} players={overviewScorers} locale={locale} />
            </section>
            <ClubDetails teams={clubs} intro={introText} locale={locale} />
          </div>
        </div>

        <div data-pl-panel="fixtures">
          <div className="pl-mobile-top">{rail}</div>
          <div className="pl-layout">
            <div className="pl-main">
              <div className="ds-fixture-toolbar">
                <div className="pl-controls" role="group" aria-label={t('fixtures')}>
                  {(['all', 'upcoming', 'results'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                    >
                      {t(key === 'all' ? 'all' : key === 'upcoming' ? 'upcoming' : 'results')}
                    </button>
                  ))}
                </div>
                {currentWeek && (
                  <PeriodSelect
                    value={String(currentWeek.roundNumber)}
                    onChange={(v) => setRound(Number(v))}
                    display={currentWeek.rangeLabel || currentWeek.openLabel}
                  >
                    {matchweeks.map((w) => (
                      <option key={w.roundNumber} value={w.roundNumber}>
                        {w.openLabel}
                      </option>
                    ))}
                  </PeriodSelect>
                )}
              </div>
              {weekGroups.length === 0 ? (
                <p className="pl-empty">{t('noFixtures')}</p>
              ) : (
                weekGroups.map((g) => (
                  <div key={g.key}>
                    <h3 className="ghead">{formatDateLabel(g.key, locale, todayLabel)}</h3>
                    {g.fixtures.map((f) => (
                      <CompetitionMatchRow key={f.id} fixture={f} locale={locale} />
                    ))}
                  </div>
                ))
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">{rail}</aside>
          </div>
        </div>

        <div data-pl-panel="standings">
          <div className="pl-mobile-top">{rail}</div>
          <div className="pl-layout">
            <div className="pl-main">
              <div className="pl-controls" role="group" aria-label={t('standings')}>
                {(['overall', 'home', 'away'] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={split === key}
                    onClick={() => setSplit(key)}
                  >
                    {t(key === 'overall' ? 'overall' : key)}
                  </button>
                ))}
              </div>
              {standings.length > 0 ? (
                <StandingsTable
                  standings={standings}
                  fixtures={patched}
                  locale={locale}
                  split={split}
                  caption={tableCaption}
                />
              ) : (
                <p className="pl-empty">{t('comingSoon')}</p>
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">{rail}</aside>
          </div>
        </div>

        <div data-pl-panel="stats">
          <div className="pl-mobile-top">{rail}</div>
          <div className="pl-layout">
            <div className="pl-main pl-stats-boards">
              {topScorers.length + topAssists.length + topCards.length === 0 ? (
                <p className="pl-empty">{t('comingSoon')}</p>
              ) : (
                <StatsBoard
                  scorers={mapScorers(topScorers)}
                  assists={mapAssists(topAssists)}
                  cards={topCards}
                  locale={locale}
                  playerCount={statsPlayerCount}
                  throughLabel={statsThroughLabel}
                />
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">{rail}</aside>
          </div>
        </div>

        <div data-pl-panel="teams">
          <div className="pl-mobile-top">{rail}</div>
          <div className="pl-layout">
            <div className="pl-main">
              <ClubDetails teams={clubs} intro={introText} locale={locale} />
            </div>
            <aside className="pl-side pl-aux-desktop">{rail}</aside>
          </div>
        </div>
      </div>
    </div>
  );
}
