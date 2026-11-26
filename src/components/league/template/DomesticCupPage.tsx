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
import {
  asDate,
  uniqueDayKeys,
  defaultDayKey,
  fixtureDayKey,
  groupFixturesByDay,
} from '@/lib/competitions/template-model';
import {
  buildCupRounds,
  defaultCupRound,
  findCupRound,
  fixtureLegLabel,
  leaguePhaseMatchday,
  LEAGUE_PHASE_SLUG,
  KNOCKOUT_PLAYOFFS_SLUG,
  type CupRound,
} from '@/lib/competitions/domestic-ties';
import type { StandingRow } from '@/lib/db/queries';
import type { ZoneBand } from '@/lib/competitions/formats';
import { LeaguePhaseTable, LeaguePhaseRules } from './LeaguePhase';
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
import { DrawWindow, TieCard } from './CupDraw';
import { StagePicker } from './StagePicker';
import {
  BRACKET_LABELS,
  isBracketRound,
  layoutRounds,
  uefaBracketRounds,
} from '@/lib/competitions/bracket';
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
  /** UEFA single-table league phase (CL / EL / ECL). Absent for domestic cups. */
  leaguePhase?: { standings: StandingRow[]; zones: ZoneBand[] } | null;
}

const TAB_KEYS = ['overview', 'fixtures', 'stages', 'stats'] as const;
type TabKey = (typeof TAB_KEYS)[number];

function hashToKey(hashes: CupTabHashes, hash: string): TabKey | null {
  try {
    hash = decodeURIComponent(hash); // Arabic tab hashes arrive percent-encoded
  } catch {
    /* keep the raw hash */
  }
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
  return `(function(){try{var r=document.currentScript.parentElement;var h=decodeURIComponent(location.hash.slice(1));var a=${JSON.stringify(
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
        {phase ? (
          <span className={`pl-phase${state === 'live' ? ' playing' : ''}`}>{phase}</span>
        ) : (
          <span />
        )}
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
      <MatchLink
        matchId={String(fixture.id)}
        href={href}
        preview={preview}
        className="cup-when-row"
      >
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
  leaguePhase = null,
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

  const seasonOver = useMemo(
    () =>
      (currentSeasonYear != null && seasonYear < currentSeasonYear) ||
      (patched.length > 0 && patched.every((f) => isFinished(f.statusCode))),
    [currentSeasonYear, seasonYear, patched],
  );
  // A finished season opens Fixtures on its latest played round (the final), not on an upcoming one.
  const latestPlayedRound = useMemo(() => {
    for (let i = cupRounds.length - 1; i >= 0; i--) {
      if (cupRounds[i].fixtures.some((f) => isFinished(f.statusCode))) return cupRounds[i];
    }
    return undefined;
  }, [cupRounds]);
  const startRound = seasonOver ? (latestPlayedRound ?? fallbackRound) : fallbackRound;

  const initialIsPhase = !!leaguePhase && initialRoundSlug === LEAGUE_PHASE_SLUG;
  const initialIsKnockout = !!leaguePhase && !!initialRoundSlug && isBracketRound(initialRoundSlug);
  const [roundSlug, setRoundSlug] = useState(() => {
    if (initialIsPhase || initialIsKnockout) return startRound?.slug ?? '';
    return initialRoundSlug ?? startRound?.slug ?? '';
  });
  const bracketHasFixtures = useMemo(
    () => cupRounds.some((r) => isBracketRound(r.slug) && r.fixtures.length > 0),
    [cupRounds],
  );
  // The knockout stage to open when none was asked for: the live/next round, else the start of the path.
  const defaultKnockoutSlug = useMemo(() => {
    if (seasonOver) return KNOCKOUT_PLAYOFFS_SLUG;
    const withFixtures = cupRounds.filter((r) => isBracketRound(r.slug) && r.fixtures.length > 0);
    return defaultCupRound(withFixtures, now)?.slug ?? KNOCKOUT_PLAYOFFS_SLUG;
  }, [cupRounds, now, seasonOver]);
  // Stages view for the UEFA cups: the league-phase table, or one knockout stage (a window of rounds).
  const [stageSlug, setStageSlug] = useState<string>(() => {
    if (!leaguePhase) return '';
    if (initialIsPhase) return LEAGUE_PHASE_SLUG;
    if (initialIsKnockout) return initialRoundSlug as string;
    return seasonOver || bracketHasFixtures ? defaultKnockoutSlug : LEAGUE_PHASE_SLUG;
  });
  const activeRound: CupRound | undefined = findCupRound(cupRounds, roundSlug) ?? startRound;

  const [tab, setTab] = useState<TabKey>(() => {
    if (!initialRoundSlug) return 'overview';
    if (!leaguePhase || initialIsPhase || initialIsKnockout) return 'stages';
    // League-phase matchdays and qualifying rounds open Fixtures.
    return 'fixtures';
  });
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
  const weekGroups = useMemo(() => {
    const groups = groupFixturesByDay(weekFixtures);
    // Finished season: most recent matchday first.
    return seasonOver ? [...groups].reverse() : groups;
  }, [weekFixtures, seasonOver]);

  function hrefFor(slug: string): string {
    const current = currentSeasonYear != null && seasonYear === currentSeasonYear;
    const root = current ? basePath : `${basePath}/${seasonYear}`;
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    return `${root}/round/${slug}${hash}`;
  }

  function roundLabel(r: { label: string; earlier?: boolean }): string {
    if (r.earlier) return tCup('earlierRounds');
    const md = leaguePhaseMatchday(r.label);
    if (md != null) return tCup('matchday', { n: md });
    return localizeRound(r.label, locale) || r.label;
  }
  const labeledRounds = cupRounds.map((r) => ({ slug: r.slug, label: roundLabel(r) }));
  // Finished season: latest rounds first, so the final leads the round list.
  const navRounds = seasonOver ? [...labeledRounds].reverse() : labeledRounds;
  const playoffZone = leaguePhase?.zones.find((z) => z.key === 'playoff');
  const playoffTies = playoffZone
    ? Math.max(1, Math.round((playoffZone.to - playoffZone.from + 1) / 2))
    : 8;
  const bracketRounds = useMemo(
    () =>
      leaguePhase
        ? uefaBracketRounds(
            cupRounds,
            (slug, r) =>
              r
                ? roundLabel(r)
                : localizeRound(BRACKET_LABELS[slug], locale) || BRACKET_LABELS[slug],
            playoffTies,
          )
        : layoutRounds(cupRounds.map((r) => ({ ...r, label: roundLabel(r) }))),
    // roundLabel depends only on locale and the translator
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cupRounds, leaguePhase, playoffTies, locale],
  );
  const stageIsPhase = !!leaguePhase && stageSlug === LEAGUE_PHASE_SLUG;
  // Stage in the draw: the picked knockout stage; domestic cups follow the active round.
  const drawSlug = !leaguePhase
    ? (activeRound?.slug ?? '')
    : isBracketRound(stageSlug)
      ? stageSlug
      : defaultKnockoutSlug;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>('.cup-round-nav ul').forEach((ul) => {
      const cur = ul.querySelector<HTMLElement>('a[aria-current="page"]');
      if (!cur || ul.scrollWidth <= ul.clientWidth) return;
      const u = ul.getBoundingClientRect();
      const c = cur.getBoundingClientRect();
      const rtl = getComputedStyle(ul).direction === 'rtl';
      ul.scrollLeft += rtl ? c.right - u.right : c.left - u.left;
    });
  }, [tab, activeRound?.slug]);

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
    previous: tCup('previousStage'),
    next: tCup('nextStage'),
    rounds: tCup('rounds'),
    tbd: tCup('tbd'),
    versus: tCup('versus'),
  };

  const stageOptions = [
    ...(leaguePhase ? [{ slug: LEAGUE_PHASE_SLUG, label: tCup('leaguePhase') }] : []),
    ...bracketRounds.filter((r) => !r.earlier).map((r) => ({ slug: r.slug, label: r.label })),
  ];
  function selectStage(slug: string) {
    if (leaguePhase) setStageSlug(slug);
    else setRoundSlug(slug);
    window.history.replaceState(null, '', hrefFor(slug));
  }
  const stagePicker = (
    <StagePicker
      label={tCup('stage')}
      current={leaguePhase ? stageSlug || drawSlug : drawSlug}
      options={stageOptions}
      hrefFor={hrefFor}
      onSelect={selectStage}
    />
  );

  const phaseTable = leaguePhase ? (
    <LeaguePhaseTable
      standings={leaguePhase.standings}
      zones={leaguePhase.zones}
      locale={locale}
      caption={tCup('leaguePhaseStandings')}
    />
  ) : null;
  const phaseRules = leaguePhase ? (
    <LeaguePhaseRules zones={leaguePhase.zones} title={tCup('whatNext')} />
  ) : null;

  // Side card on the league-phase view: the first two play-off ties, with a link to the stage.
  const playoffsRound = bracketRounds.find((r) => r.slug === KNOCKOUT_PLAYOFFS_SLUG);
  const playoffTiesPreview = (playoffsRound?.ties ?? [])
    .filter((ti): ti is NonNullable<typeof ti> => ti != null)
    .slice(0, 2);
  const koCard =
    leaguePhase && playoffsRound && playoffTiesPreview.length > 0 ? (
      <section>
        <div className="pl-head">
          <h2>{playoffsRound.label}</h2>
          <a
            className="link"
            href={hrefFor(KNOCKOUT_PLAYOFFS_SLUG)}
            onClick={(e) => {
              e.preventDefault();
              selectStage(KNOCKOUT_PLAYOFFS_SLUG);
            }}
          >
            {tCup('stagesTab')}{' '}
            <svg className="ic forward" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M3 12h17m-6-6 6 6-6 6" />
            </svg>
          </a>
        </div>
        <div className="cup-ties">
          {playoffTiesPreview.map((ti) => (
            <TieCard key={ti.key} tie={ti} locale={locale} labels={tieLabels} />
          ))}
        </div>
      </section>
    ) : null;

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
    <div
      className={`pl pl-page cup-page ${mcFont.variable}`}
      data-pl-root
      data-season={seasonLabel}
    >
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
                  roundLabel={featured.round ? roundLabel({ label: featured.round }) : null}
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
                          <span>{parent ? roundLabel(parent) : ''}</span>
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
            {phaseTable ? (
              <section className="pl-summary">
                <div className="pl-head">
                  <h2>{tCup('leaguePhaseStandings')}</h2>
                </div>
                {phaseTable}
              </section>
            ) : null}
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
                      {navRounds.map((r) => (
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
                  const tie = parent?.ties.find((ti) =>
                    ti.fixtures.some((x) => x.id === sample?.id),
                  );
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
          <div className="pl-layout cup-grid">
            <div className="pl-main">
              {leaguePhase && stageIsPhase ? (
                <>
                  <section>
                    <div className="cup-controls">{stagePicker}</div>
                    {phaseTable}
                  </section>
                  <div className="pl-mobile-top">
                    {phaseRules}
                    {koCard}
                  </div>
                </>
              ) : bracketRounds.length === 0 ? (
                <p className="pl-empty">{t('comingSoon')}</p>
              ) : (
                <DrawWindow
                  rounds={bracketRounds}
                  currentSlug={drawSlug}
                  locale={locale}
                  hrefFor={hrefFor}
                  onSelect={selectStage}
                  picker={stagePicker}
                  labels={tieLabels}
                />
              )}
            </div>
            <aside className="pl-side pl-aux-desktop">
              {whenRail}
              {stageIsPhase ? (
                <>
                  {phaseRules}
                  {koCard}
                </>
              ) : null}
            </aside>
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
