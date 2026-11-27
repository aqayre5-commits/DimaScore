'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeamMark } from '@/components/shared/TeamMark';
import { MatchLink } from '@/components/shared/MatchLink';
import { IntentLink } from '@/components/shared/IntentLink';
import { LocalTime } from '@/components/shared/LocalTime';
import { useFollows } from '@/hooks/useFollows';
import { useLiveFixtures } from '@/hooks/useLiveFixtures';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { matchHref } from '@/lib/seo/match-slug';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { localizeRound } from '@/lib/i18n/feed-labels';
import type { StandingRow } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import {
  CompetitionMatchRow,
  StandingsTable,
  UpcomingCard,
} from '@/components/league/template/CompetitionBits';
import { StagePicker } from '@/components/league/template/StagePicker';
import {
  filterHome,
  groupByCompetition,
  homeDayKey,
  homeState,
  pickComingUp,
  pickHero,
  pickStandingsLeague,
  rankFrom,
  type HomeFilter,
  type HomeFixture,
} from '@/lib/home/model';
import '@/components/league/competition-page.css';
import '@/components/league/cup-page.css';
import './home-page.css';

export interface HomeCompetitionMeta {
  name: string;
  /** Competition page; null when it has none (e.g. Friendlies). */
  href: string | null;
  country: string | null;
  logo: string | null;
  priority: number;
}

export interface HomeStandingsOption {
  id: number;
  label: string;
  href: string;
  logo: string | null;
  rows: StandingRow[];
}

export interface HomeLabels {
  heading: string;
  comingUp: string;
  todaysMatches: string;
  chooseDay: string;
  all: string;
  live: string;
  upcoming: string;
  finished: string;
  liveStandings: string;
  chooseLeague: string;
  provisional: string;
  matchCentre: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  liveTag: string;
  halfTime: string;
  fullTime: string;
  noMatchesDay: string;
  noMatchesFilter: string;
  showAll: string;
}

export interface HomePageProps {
  locale: Locale;
  todayKey: string;
  /** Snapshot time of the server data, used until the client clock takes over. */
  now: number;
  dayKeys: string[];
  fixtures: HomeFixture[];
  competitions: Record<number, HomeCompetitionMeta>;
  editorialOrder: number[];
  standings: HomeStandingsOption[];
  labels: HomeLabels;
}

const INTL: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', ar: 'ar-MA' };

function shortDate(key: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${key}T12:00:00Z`));
}

function ArrowIcon() {
  return (
    <svg className="ic forward" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3 8h9.5M8.5 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function teamName(team: HomeFixture['homeTeam'], locale: Locale) {
  return team ? getTeamDisplayName(team, locale) : '—';
}

function Hero({
  fixture,
  comp,
  locale,
  labels,
  dayLabel,
  now,
}: {
  fixture: HomeFixture;
  comp: HomeCompetitionMeta | undefined;
  locale: Locale;
  labels: HomeLabels;
  dayLabel: string;
  now: Date;
}) {
  const state = homeState(fixture, now);
  const live = state === 'live';
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
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
    kickoffAt: new Date(fixture.kickoffAt),
  });
  const tag = live
    ? fixture.statusCode === 'HT'
      ? labels.halfTime
      : fixture.minute != null
        ? `${labels.liveTag} ${fixture.minute}\u2032`
        : labels.liveTag
    : state === 'finished' || state === 'interrupted'
      ? labels.fullTime
      : dayLabel;
  const names = `${teamName(fixture.homeTeam, locale)} v ${teamName(fixture.awayTeam, locale)}`;
  const round = fixture.round ? localizeRound(fixture.round, locale) : null;
  const team = (side: 'home' | 'away') => {
    const t = side === 'home' ? fixture.homeTeam : fixture.awayTeam;
    return (
      <div className="teamblock">
        <TeamMark
          className="mark"
          src={t?.logoUrl}
          status={t?.logoStatus}
          isNational={t?.isNational}
          countryCode={t?.countryCode}
          name={t?.name}
          shortName={t?.shortName}
          code={t?.code}
          primary={t?.primaryColor}
          secondary={t?.secondaryColor}
        />
        <strong>
          <bdi>{teamName(t, locale)}</bdi>
        </strong>
      </div>
    );
  };
  return (
    <article className="hero">
      <div className="herotop">
        {comp?.href ? (
          <IntentLink href={comp.href} className="league-title">
            {comp.name}
          </IntentLink>
        ) : (
          <span className="league-title">{comp?.name}</span>
        )}
        <span className={`live-tag${live ? '' : ' neutral'}`}>{tag}</span>
      </div>
      <div className="herocore">
        {team('home')}
        <strong className="bigscore">
          {hasScore ? (
            <>
              <span>{fixture.homeScore}</span>
              <span aria-hidden="true">–</span>
              <span>{fixture.awayScore}</span>
            </>
          ) : state === 'upcoming' || live ? (
            <LocalTime date={new Date(fixture.kickoffAt)} locale={locale} format="time" />
          ) : (
            <span aria-hidden="true">–</span>
          )}
        </strong>
        {team('away')}
      </div>
      <div className="herobottom">
        <span className="event">{round}</span>
        <MatchLink
          matchId={String(fixture.id)}
          href={href}
          preview={preview}
          prefetchIntent
          className="link"
          ariaLabel={`${labels.matchCentre} · ${names}`}
        >
          {labels.matchCentre} <ArrowIcon />
        </MatchLink>
      </div>
    </article>
  );
}

export function HomePage({
  locale,
  todayKey,
  now: snapshot,
  dayKeys,
  fixtures,
  competitions,
  editorialOrder,
  standings,
  labels,
}: HomePageProps) {
  const { followedMatches, followedComps } = useFollows();
  const patches = useLiveFixtures();
  const [nowMs, setNowMs] = useState(snapshot);
  const [day, setDay] = useState(todayKey);
  const [filter, setFilter] = useState<HomeFilter>('all');
  const [leagueChoice, setLeagueChoice] = useState<number | null>(null);

  useEffect(() => {
    // After hydration: the live clock replaces the snapshot time, and a shared ?day= link opens
    // that day (the server always renders today, so the page stays static).
    const start = window.setTimeout(() => {
      setNowMs(Date.now());
      const wanted = new URLSearchParams(window.location.search).get('day');
      if (wanted && dayKeys.includes(wanted)) setDay(wanted);
    }, 0);
    const id = window.setInterval(() => setNowMs(Date.now()), 60_000);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [dayKeys]);

  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const rank = useMemo(() => rankFrom(editorialOrder), [editorialOrder]);
  const priority = (id: number) => competitions[id]?.priority ?? 100;

  const patched = useMemo(() => {
    if (patches.size === 0) return fixtures;
    return fixtures.map((f) => {
      const p = patches.get(f.id);
      if (!p) return f;
      return {
        ...f,
        statusCode: p.statusCode ?? f.statusCode,
        homeScore: p.homeScore ?? f.homeScore,
        awayScore: p.awayScore ?? f.awayScore,
        minute: p.minute ?? f.minute,
      };
    });
  }, [fixtures, patches]);

  const dayFixtures = useMemo(() => patched.filter((f) => homeDayKey(f) === day), [patched, day]);
  const prefs = useMemo(
    () => ({ starred: followedMatches, pinned: followedComps }),
    [followedMatches, followedComps],
  );
  const hero = useMemo(
    () => pickHero(dayFixtures, now, prefs, rank),
    [dayFixtures, now, prefs, rank],
  );
  const coming = useMemo(
    () => pickComingUp(patched, day, hero?.id ?? null, now),
    [patched, day, hero, now],
  );
  const groups = useMemo(
    () => groupByCompetition(filterHome(dayFixtures, filter, now), followedComps, rank, priority),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayFixtures, filter, now, followedComps, rank, competitions],
  );

  const dayWord = (key: string) =>
    key === todayKey
      ? labels.today
      : dayKeys.indexOf(key) === dayKeys.indexOf(todayKey) - 1
        ? labels.yesterday
        : dayKeys.indexOf(key) === dayKeys.indexOf(todayKey) + 1
          ? labels.tomorrow
          : shortDate(key, locale);
  const cardDay = (key: string) => {
    if (key === todayKey) return labels.today;
    const d = new Date(`${todayKey}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    if (d.toISOString().slice(0, 10) === key) return labels.tomorrow;
    return shortDate(key, locale);
  };

  const standingIds = standings.map((s) => s.id);
  const leagueId = leagueChoice ?? pickStandingsLeague(standingIds, dayFixtures, now);
  const league = standings.find((s) => s.id === leagueId) ?? standings[0];
  const leagueFixtures = useMemo(
    () => (league ? patched.filter((f) => f.competitionId === league.id) : []),
    [patched, league],
  );

  const pickDay = (key: string) => {
    setDay(key);
    const url = key === todayKey ? window.location.pathname : `?day=${key}`;
    window.history.replaceState(null, '', url);
  };

  const filters: HomeFilter[] = ['all', 'live', 'upcoming', 'finished'];
  const filterLabel: Record<HomeFilter, string> = {
    all: labels.all,
    live: labels.live,
    upcoming: labels.upcoming,
    finished: labels.finished,
  };

  return (
    <div className="pl ds-home">
      <h1 className="ds-home-vh">{labels.heading}</h1>
      <div
        className={`overall ${hero ? 'has-feature' : 'no-feature'} ${coming.length ? 'has-coming' : 'no-coming'}`}
      >
        {hero ? (
          <div className="feature">
            <Hero
              fixture={hero}
              comp={competitions[hero.competitionId]}
              locale={locale}
              labels={labels}
              dayLabel={cardDay(homeDayKey(hero))}
              now={now}
            />
          </div>
        ) : null}
        {coming.length > 0 ? (
          <section className="soon">
            <h2>{labels.comingUp}</h2>
            <div className="upgrid">
              {coming.map((f) => (
                <UpcomingCard
                  key={f.id}
                  fixture={f}
                  locale={locale}
                  dayLabel={cardDay(homeDayKey(f))}
                  kind={competitions[f.competitionId]?.name}
                />
              ))}
            </div>
          </section>
        ) : null}
        <section className="matches" aria-labelledby="home-matches-title">
          <div className="sectionhead">
            <h2 id="home-matches-title">{labels.todaysMatches}</h2>
            <StagePicker
              label={labels.chooseDay}
              current={day}
              options={dayKeys.map((k) => ({
                slug: k,
                label: shortDate(k, locale),
                detail: dayWord(k),
              }))}
              hrefFor={(k) => (k === todayKey ? `/${locale}` : `/${locale}?day=${k}`)}
              onSelect={pickDay}
            />
          </div>
          <div className="tabs" role="group" aria-label={labels.todaysMatches}>
            {filters.map((key) => (
              <button
                key={key}
                type="button"
                className="tab"
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {filterLabel[key]}
              </button>
            ))}
          </div>
          {dayFixtures.length === 0 ? (
            <p className="empty">{labels.noMatchesDay}</p>
          ) : groups.length === 0 ? (
            <p className="empty">
              {labels.noMatchesFilter}{' '}
              <button type="button" className="link" onClick={() => setFilter('all')}>
                {labels.showAll}
              </button>
            </p>
          ) : (
            groups.map((g) => {
              const comp = competitions[g.competitionId];
              return (
                <section key={g.competitionId} className="leaguegroup">
                  <div className="ghead">
                    {comp?.href ? (
                      <IntentLink href={comp.href}>
                        <strong>{comp.name}</strong>
                      </IntentLink>
                    ) : (
                      <strong>{comp?.name}</strong>
                    )}
                    {comp?.country ? <span>· {comp.country}</span> : null}
                  </div>
                  {g.fixtures.map((f) => (
                    <CompetitionMatchRow key={f.id} fixture={f} locale={locale} minute={f.minute} />
                  ))}
                </section>
              );
            })
          )}
        </section>
        {league ? (
          <section className="standings" aria-labelledby="home-standings-title">
            <h2 id="home-standings-title">{labels.liveStandings}</h2>
            <div className="stand-controls">
              <StagePicker
                label={labels.chooseLeague}
                current={String(league.id)}
                options={standings.map((s) => ({
                  slug: String(s.id),
                  label: s.label,
                  icon: (
                    <TeamMark className="mark" src={s.logo} name={s.label} variant="competition" />
                  ),
                }))}
                hrefFor={(slug) => standings.find((s) => String(s.id) === slug)?.href ?? '#'}
                onSelect={(slug) => setLeagueChoice(Number(slug))}
              />
            </div>
            <StandingsTable
              key={league.id}
              standings={league.rows}
              fixtures={leagueFixtures}
              locale={locale}
              split="overall"
              caption={`${league.label} · ${labels.provisional}`}
              plain
            />
            <div className="stand-foot">
              <small>{labels.provisional}</small>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
