'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { mcFont } from '@/components/match/centre/font';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { TopPlayerRow, TopCardRow, RoundInfo } from '@/lib/db/queries/league';
import type { Locale } from '@/lib/i18n/config';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { formatDateLabel, toSiteDateKey } from '@/lib/utils/date';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { TeamMark } from '@/components/shared/TeamMark';
import { MatchLink } from '@/components/shared/MatchLink';
import { LocalTime } from '@/components/shared/LocalTime';
import { matchHref } from '@/lib/seo/match-slug';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { getMatchState, isFinished } from '@/lib/match-status';
import { asDate, uniqueDayKeys, defaultDayKey, fixtureDayKey, groupFixturesByDay } from '@/lib/competitions/template-model';
import {
  buildCupRounds,
  defaultCupRound,
  findCupRound,
  fixtureLegLabel,
  type CupRound,
} from '@/lib/competitions/domestic-ties';
import { buildTeamHref } from '@/lib/competitions/paths';
import type { LogoStatus } from '@/lib/logos/status';
import {
  CompetitionIdentity,
  CompetitionMatchRow,
  PeriodSelect,
  PlayerRanking,
  StatsBoard,
  mapScorers,
  mapAssists,
  usePatchedFixtures,
} from './CompetitionBits';
import { DrawWindow } from './CupDraw';
import '../competition-page.css';
import '../cup-page.css';

export interface CupTabHashes {
  overview: string;
  fixtures: string;
  stages: string;
  stats: string;
}

export interface DomesticCupPageProps {
  locale: Locale;
  competitionId: number;
  competitionName: string;
  logoSrc: string | null;
  invertLogo: boolean;
  countryName: string | null;
  countryFlag: string | null;
  seasonYear: number;
  seasonLabel: string;
  availableSeasons: { year: number; isCurrent: boolean }[];
  currentSeasonYear?: number | null;
  basePath: string;
  hashes: CupTabHashes;
  fixtures: FixtureWithTeams[];
  rounds: RoundInfo[];
  topScorers: TopPlayerRow[];
  topAssists: TopPlayerRow[];
  topCards: TopCardRow[];
  clubs: {
    id: number;
    slug: string;
    name: string;
    logoUrl: string | null;
    logoStatus?: LogoStatus | null;
    code?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
  }[];
  todayKey: string;
  statsPlayerCount?: number;
  statsThroughLabel?: string | null;
  statsFromLabel?: string | null;
  hideStats?: boolean;
  initialRoundSlug?: string | null;
}

const TAB_KEYS = ['overview', 'fixtures', 'stages', 'stats'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function hashToKey(hashes: CupTabHashes, hash: string): TabKey | null {
  const entries: [TabKey, string][] = [
    ['overview', hashes.overview],
    ['fixtures', hashes.fixtures],
    ['stages', hashes.stages],
    ['stats', hashes.stats],
  ];
  if ((TAB_KEYS as readonly string[]).includes(hash)) return hash as TabKey;
  const found = entries.find(([, h]) => h === hash);
  return found ? found[0] : null;
}

function initScript(hashes: CupTabHashes): string {
  const map: Record<string, TabKey> = {
    [hashes.overview]: 'overview',
    [hashes.fixtures]: 'fixtures',
    [hashes.stages]: 'stages',
    [hashes.stats]: 'stats',
    overview: 'overview',
    fixtures: 'fixtures',
    stages: 'stages',
    stats: 'stats',
  };
  return `(function(){try{var r=document.currentScript.parentElement;var h=location.hash.slice(1);var a=${JSON.stringify(
    map,
  )};var k=a[h];if(k)r.setAttribute('data-tab',k);}catch(e){}})();`;
}

function teamName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  return team ? getTeamDisplayName(team, locale) : '—';
}

function CupFeatured({
  fixture,
  locale,
  roundLabel,
  labels,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  roundLabel: string | null;
  labels: { fullTime: string; matchCentre: string; live: string };
}) {
  const href = matchHref(locale, {
    id: fixture.id,
    homeSlug: fixture.homeTeam?.slug,
    awaySlug: fixture.awayTeam?.slug,
  });
  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    kickoffAt: asDate(fixture.kickoffAt),
  });
  const state = getMatchState(fixture.statusCode, asDate(fixture.kickoffAt));
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const phase = state === 'live' ? labels.live : state === 'finished' ? labels.fullTime : null;

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={href}
      preview={preview}
      prefetchIntent
      className="cup-board"
      ariaLabel={`${teamName(fixture.homeTeam, locale)} vs ${teamName(fixture.awayTeam, locale)}`}
    >
      <div className="herotop">
        <span className="round">{roundLabel}</span>
        {phase ? <span className={`pl-phase${state === 'live' ? ' playing' : ''}`}>{phase}</span> : <span />}
      </div>
      <div className="herocore">
        <div className="cup-heroteam">
          <TeamMark
            className="mark"
            src={fixture.homeTeam?.logoUrl}
            status={fixture.homeTeam?.logoStatus}
            name={fixture.homeTeam?.name}
            shortName={fixture.homeTeam?.shortName}
            code={fixture.homeTeam?.code}
            primary={fixture.homeTeam?.primaryColor}
            secondary={fixture.homeTeam?.secondaryColor}
            sizeVar="clamp(56px, 6vw, 88px)"
          />
          <strong>
            <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          </strong>
        </div>
        <div className="pl-score">
          <span className="bigscore">
            {hasScore ? (
              `${fixture.homeScore}–${fixture.awayScore}`
            ) : (
              <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />
            )}
          </span>
        </div>
        <div className="cup-heroteam">
          <TeamMark
            className="mark"
            src={fixture.awayTeam?.logoUrl}
            status={fixture.awayTeam?.logoStatus}
            name={fixture.awayTeam?.name}
            shortName={fixture.awayTeam?.shortName}
            code={fixture.awayTeam?.code}
            primary={fixture.awayTeam?.primaryColor}
            secondary={fixture.awayTeam?.secondaryColor}
            sizeVar="clamp(56px, 6vw, 88px)"
          />
          <strong>
            <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
          </strong>
        </div>
      </div>
      <div className="herobottom">
        <LocalTime
          date={asDate(fixture.kickoffAt)}
          locale={locale}
          format="date"
          dateOptions={{ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }}
        />
        <span className="link">{labels.matchCentre} →</span>
      </div>
    </MatchLink>
  );
}

function WhenCard({
  title,
  fixture,
  locale,
}: {
  title: string;
  fixture: FixtureWithTeams | null;
  locale: Locale;
}) {
  if (!fixture) return null;
  const href = matchHref(locale, {
    id: fixture.id,
    homeSlug: fixture.homeTeam?.slug,
    awaySlug: fixture.awayTeam?.slug,
  });
  const preview = previewFromFixtureRow({
    homeTeam: fixture.homeTeam,
    awayTeam: fixture.awayTeam,
    homeScore: fixture.homeScore,
    awayScore: fixture.awayScore,
    statusCode: fixture.statusCode,
    kickoffAt: asDate(fixture.kickoffAt),
  });
  return (
    <article className="cup-when-card">
      <h3>{title}</h3>
      <MatchLink matchId={String(fixture.id)} href={href} preview={preview} className="cup-when-row">
        <TeamMark
          className="mark"
          src={fixture.homeTeam?.logoUrl}
          status={fixture.homeTeam?.logoStatus}
          name={fixture.homeTeam?.name}
          sizeVar="20px"
        />
        <span className="names">
          <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
          <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
        </span>
        <span className="when">
          {isFinished(fixture.statusCode) && fixture.homeScore != null ? (
            `${fixture.homeScore}–${fixture.awayScore}`
          ) : (
            <LocalTime date={asDate(fixture.kickoffAt)} locale={locale} format="time" />
          )}
        </span>
      </MatchLink>
    </article>
  );
}

function ClubDirectory({
  clubs,
  locale,
  title,
}: {
  clubs: DomesticCupPageProps['clubs'];
  locale: Locale;
  title: string;
}) {
  if (clubs.length === 0) return null;
  return (
    <section className="cup-clubs">
      <h2>
        {title} ({clubs.length})
      </h2>
      <ul className="cup-club-list">
        {clubs.map((c) => (
          <li key={c.id}>
            <a href={buildTeamHref(locale, c.slug)}>
              <TeamMark
                className="mark cup-mark"
                src={c.logoUrl}
                status={c.logoStatus}
                name={c.name}
                code={c.code}
                primary={c.primaryColor}
                secondary={c.secondaryColor}
                sizeVar="20px"
              />
              <bdi>{c.name}</bdi>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function pickFeatured(fixtures: FixtureWithTeams[], now: Date): FixtureWithTeams | undefined {
  const finished = fixtures
    .filter((f) => isFinished(f.statusCode))
    .sort((a, b) => asDate(b.kickoffAt).getTime() - asDate(a.kickoffAt).getTime());
  if (finished[0]) return finished[0];
  const upcoming = fixtures
    .filter((f) => !isFinished(f.statusCode))
    .sort((a, b) => asDate(a.kickoffAt).getTime() - asDate(b.kickoffAt).getTime());
  return upcoming[0];
}

function nearestOnDay(fixtures: FixtureWithTeams[], dayKey: string): FixtureWithTeams | null {
  const list = fixtures.filter((f) => fixtureDayKey(f) === dayKey);
  return list[0] ?? null;
}

export function DomesticCupPage({
  locale,
  competitionId,
  competitionName,
  logoSrc,
  invertLogo,
  countryName,
  countryFlag,
  seasonYear,
  seasonLabel,
  availableSeasons,
  currentSeasonYear,
  basePath,
  hashes,
  fixtures,
  rounds: roundInfos,
  topScorers,
  topAssists,
  topCards,
  clubs,
  todayKey,
  statsPlayerCount = 0,
  statsThroughLabel = null,
  statsFromLabel = null,
  hideStats = false,
  initialRoundSlug = null,
}: DomesticCupPageProps) {
  const t = useTranslations('leaguePage');
  const tCup = useTranslations('domesticCup');
  const rootRef = useRef<HTMLDivElement>(null);
  const patched = usePatchedFixtures(fixtures);
  const now = useMemo(() => new Date(todayKey + 'T12:00:00Z'), [todayKey]);

  const cupRounds = useMemo(
    () => buildCupRounds(competitionId, seasonYear, patched, roundInfos),
    [competitionId, seasonYear, patched, roundInfos],
  );

  const fallbackRound = useMemo(
    () => defaultCupRound(cupRounds, now) ?? cupRounds[0],
    [cupRounds, now],
  );

  const [roundSlug, setRoundSlug] = useState(
    () => initialRoundSlug ?? fallbackRound?.slug ?? '',
  );
  const activeRound: CupRound | undefined =
    findCupRound(cupRounds, roundSlug) ?? fallbackRound;

  const [tab, setTab] = useState<TabKey>(() => (initialRoundSlug ? 'stages' : 'overview'));
  const [day, setDay] = useState(() => defaultDayKey(patched, now));
  const days = useMemo(() => uniqueDayKeys(patched), [patched]);
  const dayFixtures = useMemo(
    () => patched.filter((f) => fixtureDayKey(f) === day),
    [patched, day],
  );

  const featured = useMemo(() => pickFeatured(patched, now), [patched, now]);
  const tomorrowKey = useMemo(() => {
    const d = new Date(todayKey + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + 1);
    return toSiteDateKey(d);
  }, [todayKey]);
  const todayMatch = useMemo(() => nearestOnDay(patched, todayKey), [patched, todayKey]);
  const tomorrowMatch = useMemo(() => nearestOnDay(patched, tomorrowKey), [patched, tomorrowKey]);

  const overviewScorers = useMemo(() => {
    const all = mapScorers(topScorers);
    if (all.length === 0) return all;
    const cut = all[9]?.value;
    if (cut == null) return all.slice(0, 10);
    return all.filter((p, i) => i < 10 || p.value === cut);
  }, [topScorers]);

  const weekFixtures = activeRound?.fixtures ?? [];
  const weekGroups = useMemo(() => groupFixturesByDay(weekFixtures), [weekFixtures]);

  function hrefFor(slug: string): string {
    const current = currentSeasonYear != null && seasonYear === currentSeasonYear;
    const root = current ? basePath : `${basePath}/${seasonYear}`;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    return `${root}/round/${slug}${hash}`;
  }

  const labeledRounds = cupRounds.map((r) => ({
    slug: r.slug,
    label: r.earlier ? tCup('earlierRounds') : localizeRound(r.label, locale) || r.label,
  }));

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
    { key: 'stages', hash: hashes.stages, label: tCup('stagesTab') },
    ...(!hideStats ? [{ key: 'stats' as const, hash: hashes.stats, label: t('stats') }] : []),
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
  const tieLabels = {
    fullTime: tCup('fullTime'),
    matchCentre: tCup('matchCentre'),
    live: t('live'),
    leg1: tCup('leg1'),
    leg2: tCup('leg2'),
    agg: tCup('agg'),
    aggTitle: tCup('aggregate'),
    previous: t('prevRound'),
    next: t('nextRound'),
    rounds: tCup('rounds'),
  };

  const nextRound = (() => {
    const i = cupRounds.findIndex((r) => r.slug === activeRound?.slug);
    return i >= 0 && i < cupRounds.length - 1 ? cupRounds[i + 1] : undefined;
  })();

  const whenRail = (
    <section className="cup-when pl-coming">
      <div className="upgrid">
        <WhenCard title={t('today')} fixture={todayMatch} locale={locale} />
        <WhenCard title={tCup('tomorrow')} fixture={tomorrowMatch} locale={locale} />
      </div>
    </section>
  );

  const scorersRail = (
    <section className="pl-leaders">
      <div className="pl-head">
        <h2>{t('topScorers')}</h2>
        {!hideStats && (
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
        )}
      </div>
      <PlayerRanking title={t('goals')} players={overviewScorers} locale={locale} />
    </section>
  );

  return (
    <div className={`pl pl-page cup-page ${mcFont.variable}`} data-pl-root data-season={seasonLabel}>
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
                <CupFeatured
                  fixture={featured}
                  locale={locale}
                  roundLabel={
                    featured.round ? localizeRound(featured.round, locale) || featured.round : null
                  }
                  labels={tieLabels}
                />
              ) : (
                <p className="pl-empty">{t('noFixturesAvailable')}</p>
              )}
            </section>
            {whenRail}
            <section className="pl-schedule">
              <div className="pl-head">
                <h2 id="cup-day-heading">{tCup('todaysMatches')}</h2>
                {days.length > 0 && (
                  <PeriodSelect
                    labelledBy="cup-day-heading"
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
                dayFixtures.map((f) => {
                  const parent = cupRounds.find((r) => r.fixtures.some((x) => x.id === f.id));
                  const tie = parent?.ties.find((ti) => ti.fixtures.some((x) => x.id === f.id));
                  const leg = tie ? fixtureLegLabel(tie, f) : null;
                  return (
                    <div key={f.id}>
                      {leg ? (
                        <p className="ghead cup-day-head">
                          <span>
                            {parent ? localizeRound(parent.label, locale) || parent.label : ''}
                          </span>
                          <span className="cup-leg-label">
                            {leg === 'first'
                              ? tCup('firstLeg')
                              : leg === 'second'
                                ? tCup('secondLeg')
                                : tCup('replay')}
                          </span>
                        </p>
                      ) : null}
                      <CompetitionMatchRow fixture={f} locale={locale} />
                    </div>
                  );
                })
              )}
            </section>
            {overviewScorers.length > 0 ? scorersRail : null}
          </div>
        </div>

        <div data-pl-panel="fixtures">
          <div className="pl-mobile-top">
            {whenRail}
            {overviewScorers.length > 0 ? scorersRail : null}
          </div>
          <div className="pl-layout">
            <div className="pl-main">
              <div className="ds-fixture-toolbar">
                <span className="cup-count">
                  {tCup('matchesCount', { n: weekFixtures.length })}
                </span>
                {activeRound && (
                  <nav className="cup-round-nav" aria-label={tCup('rounds')}>
                    <ul>
                      {labeledRounds.map((r) => (
                        <li key={r.slug}>
                          <a
                            href={hrefFor(r.slug)}
                            aria-current={r.slug === activeRound.slug ? 'page' : undefined}
                            onClick={(e) => {
                              e.preventDefault();
                              setRoundSlug(r.slug);
                              window.history.replaceState(null, '', hrefFor(r.slug));
                            }}
                          >
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                )}
              </div>
              {weekGroups.length === 0 ? (
                <p className="pl-empty">{t('noFixtures')}</p>
              ) : (
                weekGroups.map((g) => {
                  const sample = g.fixtures[0];
                  const parent = cupRounds.find((r) => r.fixtures.some((x) => x.id === sample?.id));
                  const tie = parent?.ties.find((ti) => ti.fixtures.some((x) => x.id === sample?.id));
                  const leg = tie && sample ? fixtureLegLabel(tie, sample) : null;
                  const sameLeg = g.fixtures.every((f) => {
                    const t2 = parent?.ties.find((ti) => ti.fixtures.some((x) => x.id === f.id));
                    return t2 && sample ? fixtureLegLabel(t2, f) === leg : !leg;
                  });
                  return (
                    <div key={g.key} className="cup-date-group">
                      <h3 className="ghead cup-day-head">
                        <span>{formatDateLabel(g.key, locale, todayLabel)}</span>
                        {sameLeg && leg ? (
                          <span className="cup-leg-label">
                            {leg === 'first'
                              ? tCup('firstLeg')
                              : leg === 'second'
                                ? tCup('secondLeg')
                                : tCup('replay')}
                          </span>
                        ) : null}
                      </h3>
                      {g.fixtures.map((f) => (
                        <CompetitionMatchRow key={f.id} fixture={f} locale={locale} />
                      ))}
                    </div>
                  );
                })
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">
              {whenRail}
              {overviewScorers.length > 0 ? scorersRail : null}
            </aside>
          </div>
        </div>

        <div data-pl-panel="stages">
          <div className="pl-mobile-top">{whenRail}</div>
          <div className="pl-layout">
            <div className="pl-main">
              {cupRounds.length === 0 ? (
                <p className="pl-empty">{t('comingSoon')}</p>
              ) : (
                <DrawWindow
                  rounds={cupRounds.map((r) => ({
                    ...r,
                    label: r.earlier ? tCup('earlierRounds') : localizeRound(r.label, locale) || r.label,
                  }))}
                  currentSlug={activeRound?.slug ?? ''}
                  locale={locale}
                  hrefFor={hrefFor}
                  nextHref={nextRound ? hrefFor(nextRound.slug) : null}
                  nextLabel={
                    nextRound
                      ? `${localizeRound(nextRound.label, locale) || nextRound.label}`
                      : null
                  }
                  labels={tieLabels}
                />
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">{whenRail}</aside>
          </div>
        </div>

        {!hideStats && (
          <div data-pl-panel="stats">
            <div className="pl-mobile-top">{whenRail}</div>
            <div className="pl-layout">
              <div className="pl-main pl-stats-boards">
                {statsFromLabel ? <p className="cup-note">{statsFromLabel}</p> : null}
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
              <aside className="pl-side pl-aux-desktop">
                {whenRail}
                <ClubDirectory clubs={clubs} locale={locale} title={tCup('clubs')} />
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
