'use client';

/**
 * Redesigned team page: club (Arsenal reference) and national team (France reference).
 * Tabs: Overview · Matches · Squad · Stats (+ Transfers for clubs); "Full table" opens #table.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { mcFont } from '@/components/match/centre/font';
import type { Locale } from '@/lib/i18n/config';
import { TeamMark } from '@/components/shared/TeamMark';
import { IntentLink } from '@/components/shared/IntentLink';
import { LocalTime } from '@/components/shared/LocalTime';
import { matchHref } from '@/lib/seo/match-slug';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getMatchState } from '@/lib/match-status';
import { useFollows } from '@/hooks/useFollows';
import { formatDateLabel, toSiteDateKey } from '@/lib/utils/date';
import { CompetitionMatchRow, PeriodSelect } from '@/components/league/template/CompetitionBits';
import type { HubFixture, TeamHubData } from '@/lib/team/load-team-hub';
import {
  SQUAD_POSITIONS,
  TALLY_METRICS,
  rankTallies,
  type SquadPosition,
  type TallyMetric,
} from '@/lib/team/page-model';
import '@/components/league/competition-page.css';
import '@/components/league/cup-page.css';
import './team-hub.css';

type TabKey = 'overview' | 'matches' | 'squad' | 'stats' | 'transfers' | 'table';
type Status = 'allStatus' | 'upcoming' | 'results';

const HASHES: Record<Locale, Record<TabKey, string>> = {
  en: {
    overview: 'overview',
    matches: 'matches',
    squad: 'squad',
    stats: 'stats',
    transfers: 'transfers',
    table: 'table',
  },
  fr: {
    overview: 'apercu',
    matches: 'matchs',
    squad: 'effectif',
    stats: 'stats',
    transfers: 'transferts',
    table: 'classement',
  },
  ar: {
    overview: 'نظرة-عامة',
    matches: 'المباريات',
    squad: 'التشكيلة',
    stats: 'الإحصاءات',
    transfers: 'الانتقالات',
    table: 'الترتيب',
  },
};

function keyFromHash(locale: Locale, raw: string): TabKey | null {
  let h = raw;
  try {
    h = decodeURIComponent(raw);
  } catch {
    /* raw */
  }
  const found = (Object.entries(HASHES[locale]) as [TabKey, string][]).find(
    ([k, v]) => v === h || k === h,
  );
  return found ? found[0] : null;
}

function initScript(locale: Locale): string {
  const map: Record<string, TabKey> = {};
  for (const [k, v] of Object.entries(HASHES[locale]) as [TabKey, string][]) {
    map[v] = k;
    map[k] = k;
  }
  return `(function(){try{var r=document.currentScript.parentElement;var h=decodeURIComponent(location.hash.slice(1));var a=${JSON.stringify(map)};var k=a[h];if(k)r.setAttribute('data-tab',k);}catch(e){}})();`;
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

function ChevronIcon({ dir = 'down' }: { dir?: 'down' | 'right' }) {
  return (
    <svg
      className={`ic${dir === 'right' ? ' forward' : ''}`}
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        d={dir === 'down' ? 'M4 6l4 4 4-4' : 'M6 4l4 4-4 4'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3.6l2.1 5.3 5.6.4-4.3 3.6 1.3 5.4L12 15.7 7.3 18.3l1.3-5.4-4.3-3.6 5.6-.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const fmtNumber = (n: number, locale: Locale) =>
  n.toLocaleString(locale === 'ar' ? 'ar-MA' : locale);
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function Section({
  title,
  action,
  children,
  className = '',
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`nt-section ${className}`}>
      <div className="nt-sectionhead">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Crest({
  team,
  size,
  className = 'cup-mark',
}: {
  team: HubFixture['homeTeam'];
  size: number;
  className?: string;
}) {
  return (
    <TeamMark
      className={className}
      src={team?.logoUrl}
      status={team?.logoStatus}
      isNational={team?.isNational}
      countryCode={team?.countryCode}
      name={team?.name}
      code={team?.code}
      primary={team?.primaryColor}
      secondary={team?.secondaryColor}
      size={size}
    />
  );
}

export function TeamHub({ data, locale }: { data: TeamHubData; locale: Locale }) {
  const t = useTranslations('teamHub');
  const { team } = data;
  const national = team.isNational;
  const hashes = HASHES[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [comp, setComp] = useState<string>('all');
  const [status, setStatus] = useState<Status>('allStatus');
  const [position, setPosition] = useState<string>('allPositions');
  const [moveFilter, setMoveFilter] = useState<string>('both');
  const { followedTeams, toggleTeam } = useFollows();
  const following = followedTeams.has(team.id);

  useEffect(() => {
    function apply() {
      const key = keyFromHash(locale, window.location.hash.slice(1));
      if (key) {
        setTab(key);
        rootRef.current?.setAttribute('data-tab', key);
      }
    }
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, [locale]);

  const select = useCallback(
    (key: TabKey) => {
      setTab(key);
      rootRef.current?.setAttribute('data-tab', key);
      if (window.location.hash.slice(1) !== hashes[key])
        window.history.replaceState(null, '', `#${hashes[key]}`);
      rootRef.current?.scrollIntoView({ block: 'nearest' });
    },
    [hashes],
  );

  const tabLink = (key: TabKey, label: string, className = 'link', onBefore?: () => void) => (
    <a
      href={`#${hashes[key]}`}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onBefore?.();
        select(key);
      }}
    >
      {label}
      <ArrowIcon />
    </a>
  );

  const now = Date.now();
  const state = (f: HubFixture) =>
    getMatchState(f.statusCode, new Date(f.kickoffAt), new Date(now));
  const finished = useMemo(
    () =>
      data.fixtures
        .filter((f) => getMatchState(f.statusCode, new Date(f.kickoffAt)) === 'finished')
        .reverse(),
    [data.fixtures],
  );
  const upcoming = useMemo(
    () =>
      data.fixtures.filter((f) =>
        ['upcoming', 'live'].includes(getMatchState(f.statusCode, new Date(f.kickoffAt))),
      ),
    [data.fixtures],
  );
  const latest = finished[0] ?? null;
  const compName = (id: number | null) => data.competitions.find((c) => c.id === id)?.name ?? '';
  const dayLabel = (f: HubFixture) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Casablanca',
    }).format(new Date(f.kickoffAt));
  const shortDate = (d: Date | string, withWeekday = false) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-MA' : locale === 'fr' ? 'fr-FR' : 'en-GB', {
      ...(withWeekday ? { weekday: 'short' as const } : {}),
      day: 'numeric',
      month: 'short',
      timeZone: 'Africa/Casablanca',
    }).format(new Date(d));
  const playerHref = (slug: string | null | undefined) =>
    slug ? `/${locale}/joueur/${slug}` : null;
  const teamName = (x: HubFixture['homeTeam']) =>
    x ? (x.id === team.id ? team.name : getTeamDisplayName(x, locale)) : '';
  const hrefOf = (f: HubFixture) =>
    matchHref(locale, { id: f.id, homeSlug: f.homeTeam?.slug, awaySlug: f.awayTeam?.slug });
  const stageOf = (f: HubFixture) => {
    const c = compName(f.competitionId) || f.competitionName;
    return f.roundLabel && !/regular season/i.test(f.round ?? '') ? `${c} · ${f.roundLabel}` : c;
  };

  // ── Pieces ──
  const hero = (f: HubFixture) => {
    const st = state(f);
    const done = st === 'finished';
    const pens = f.homeScorePen != null && f.awayScorePen != null;
    const scorers = data.latestScorers && latest && f.id === latest.id ? data.latestScorers : null;
    const block = (side: 'home' | 'away') => {
      const x = side === 'home' ? f.homeTeam : f.awayTeam;
      return (
        <div className="teamblock">
          <Crest team={x} size={108} />
          <strong>
            <bdi>{teamName(x)}</bdi>
          </strong>
          {scorers?.[side].map((line) => (
            <small key={line}>{line}</small>
          ))}
        </div>
      );
    };
    return (
      <article className="hero nt-hero">
        <div className="nt-feature-top">
          <b>{stageOf(f)}</b>
          <span>{shortDate(f.kickoffAt)}</span>
        </div>
        <div className="herocore">
          {block('home')}
          <div className="nt-score">
            <span>{done ? (pens ? t('penalties') : t('ft')) : `${t('kickoff')}`}</span>
            <bdi>
              {done || st === 'live' ? (
                `${f.homeScore ?? 0}–${f.awayScore ?? 0}`
              ) : (
                <LocalTime date={new Date(f.kickoffAt)} locale={locale} format="time" />
              )}
            </bdi>
          </div>
          {block('away')}
        </div>
        <div className="nt-feature-foot">
          <span>
            {pens ? `${t('penalties')} ${f.homeScorePen}–${f.awayScorePen}` : (f.venue?.name ?? '')}
          </span>
          <IntentLink href={hrefOf(f)} className="link">
            {t('matchCentre')}
            <ArrowIcon />
          </IntentLink>
        </div>
      </article>
    );
  };

  const nextCards = () =>
    upcoming.length ? (
      <section className="pl-coming nt-upcoming" aria-label={t('next')}>
        <div className="upgrid">
          {upcoming.slice(0, 3).map((f) => (
            <IntentLink key={f.id} href={hrefOf(f)} className="sooncard">
              <div className="nt-fixture-date">
                <b>{shortDate(f.kickoffAt, true)}</b>
                <span>{compName(f.competitionId) || f.competitionName}</span>
              </div>
              <div className="nt-fixture-body">
                <div>
                  {[f.homeTeam, f.awayTeam].map((x, i) => (
                    <span key={i} className="teamline">
                      <Crest team={x} size={22} />
                      <bdi>{teamName(x)}</bdi>
                    </span>
                  ))}
                </div>
                <bdi className="nt-time">
                  <LocalTime date={new Date(f.kickoffAt)} locale={locale} format="time" />
                </bdi>
              </div>
            </IntentLink>
          ))}
        </div>
      </section>
    ) : null;

  const listGames = (list: HubFixture[]) => {
    let last = '';
    return list.map((f) => {
      const label = `${dayLabel(f)} · ${compName(f.competitionId) || f.competitionName}`;
      const head = label !== last ? <h3 className="nt-datehead">{label}</h3> : null;
      last = label;
      return (
        <div key={f.id} className="nt-gamegroup">
          {head}
          <div className="cup-row nt-row">
            <CompetitionMatchRow fixture={f} locale={locale} />
          </div>
        </div>
      );
    });
  };

  const table = (labels: string[], rows: ReactNode, caption: string, cls = '') => (
    <div className="nt-frame">
      <table className={`nt-table ${cls}`}>
        <caption className="sr">{caption}</caption>
        <thead>
          <tr>
            {labels.map((l, i) => (
              <th key={i} scope="col">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );

  const facts = (rows: [string, ReactNode][]) => (
    <dl className="nt-facts nt-frame">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );

  const standingTable = (full: boolean) => {
    const s = data.standings;
    if (!s) return null;
    const headers = full
      ? [
          '#',
          t(national ? 'teamNameNational' : 'teamName'),
          t('P'),
          t('W'),
          t('D'),
          t('L'),
          t('GF'),
          t('GA'),
          t('GD'),
          t('Pts'),
        ]
      : ['#', t(national ? 'teamNameNational' : 'teamName'), t('P'), t('GD'), t('Pts')];
    const rows = s.rows.map((r) => (
      <tr
        key={`${r.groupLabel}-${r.teamId}`}
        className={r.teamId === team.id ? 'nt-france-row' : undefined}
      >
        <td>{fmtNumber(r.rank, locale)}</td>
        <th scope="row">
          <span className="nt-teamcell">
            <TeamMark
              className="cup-mark"
              src={r.team?.logoUrl}
              status={r.team?.logoStatus}
              isNational={national}
              name={r.team?.name}
              code={r.team?.code}
              size={21}
            />
            {r.team?.slug ? (
              <IntentLink href={`/${locale}/equipe/${r.team.slug}`}>
                <bdi>{r.teamId === team.id ? team.name : getTeamDisplayName(r.team, locale)}</bdi>
              </IntentLink>
            ) : (
              <bdi>{getTeamDisplayName(r.team ?? null, locale)}</bdi>
            )}
          </span>
        </th>
        {(full
          ? [r.played, r.won ?? 0, r.drawn ?? 0, r.lost ?? 0, r.goalsFor ?? 0, r.goalsAgainst ?? 0]
          : [r.played]
        ).map((v, i) => (
          <td key={i}>{fmtNumber(v, locale)}</td>
        ))}
        <td>
          <bdi>{signed(r.goalDiff ?? 0)}</bdi>
        </td>
        <td>
          <b>{fmtNumber(r.points, locale)}</b>
        </td>
      </tr>
    ));
    return (
      <div className={full ? 'ars-full-table' : 'ars-table'}>
        {table(
          headers,
          rows,
          t('table', { competition: s.competitionName }),
          national ? 'nt-stand' : '',
        )}
      </div>
    );
  };

  const details = () => {
    const rows: [string, ReactNode][] = [];
    if (data.details.coach)
      rows.push([t(national ? 'coachNational' : 'coach'), <bdi key="c">{data.details.coach}</bdi>]);
    if (data.details.captain) {
      const href = playerHref(data.details.captain.slug);
      rows.push([
        t('captain'),
        href ? (
          <IntentLink key="cap" href={href} className="nt-person-link">
            <bdi>{data.details.captain.name}</bdi>
          </IntentLink>
        ) : (
          <bdi key="cap">{data.details.captain.name}</bdi>
        ),
      ]);
    }
    if (!national && data.details.venue)
      rows.push([t('homeground'), <bdi key="v">{data.details.venue}</bdi>]);
    if (!national && data.details.founded)
      rows.push([t('founded'), <bdi key="f">{data.details.founded}</bdi>]);
    return rows.length ? (
      <Section title={t(national ? 'detailsNational' : 'details')}>{facts(rows)}</Section>
    ) : null;
  };

  const progress = () =>
    data.progress.length ? (
      <Section title={t('progress')}>
        <div className="nt-frame ars-progress">
          {data.progress.map((p) => (
            <a
              key={p.competitionId}
              href={`#${hashes.matches}`}
              className="ars-stage"
              onClick={(e) => {
                e.preventDefault();
                setComp(String(p.competitionId));
                setStatus('allStatus');
                select('matches');
              }}
            >
              <b>{p.name}</b>
              <span>{p.value}</span>
              <ChevronIcon dir="right" />
            </a>
          ))}
        </div>
      </Section>
    ) : null;

  const standingsCard = () =>
    data.standings ? (
      national ? (
        <Section
          title={t('groupStandings')}
          action={<small className="nt-meta">{data.standings.competitionName}</small>}
        >
          {standingTable(false)}
        </Section>
      ) : (
        <Section
          title={t('table', { competition: data.standings.competitionName })}
          action={tabLink('table', t('fullTable'))}
        >
          {standingTable(false)}
        </Section>
      )
    ) : null;

  const rankTable = (compKey: number | 'all', metric: TallyMetric, limit: number) => {
    const entries = rankTallies(data.tallies, compKey, metric);
    const rows = (limit ? entries.slice(0, limit) : entries).map((e) => {
      const href = playerHref(e.playerId != null ? data.playerSlugs[String(e.playerId)] : null);
      const body = (
        <>
          <TeamMark
            className="cup-mark"
            src={team.logoUrl}
            status={team.logoStatus}
            isNational={national}
            countryCode={team.countryCode}
            name={team.name}
            code={team.code}
            size={20}
          />
          <bdi>{e.name}</bdi>
        </>
      );
      return (
        <tr key={e.key}>
          <td>{fmtNumber(e.rank, locale)}</td>
          <th scope="row">
            {href ? (
              <IntentLink href={href} className="nt-person-link">
                {body}
              </IntentLink>
            ) : (
              <span className="nt-person-link">{body}</span>
            )}
          </th>
          <td>
            <b>{fmtNumber(e.value, locale)}</b>
          </td>
        </tr>
      );
    });
    return {
      total: entries.length,
      node: entries.length ? (
        table(['#', t('player'), t(metric)], rows, `${t(metric)}`, 'nt-ranking')
      ) : (
        <p className="nt-meta">{t('noData')}</p>
      ),
    };
  };

  const side = () => (
    <aside className="nt-side">
      {nextCards()}
      {national ? standingsCard() : progress()}
      {details()}
    </aside>
  );
  const withSide = (main: ReactNode) => (
    <div className="nt-layout">
      <div className="nt-main">{main}</div>
      {side()}
    </div>
  );

  // ── Tabs ──
  const scorers = rankTable('all', 'goals', 10);
  const overview = national ? (
    <div className="nt-overview">
      <div className="nt-feature">
        {latest ? hero(latest) : upcoming[0] ? hero(upcoming[0]) : null}
      </div>
      <div className="nt-up-slot">{nextCards()}</div>
      <div className="nt-main">
        {finished.length > 1 && (
          <Section title={t('recent')} action={tabLink('matches', t('allMatches'))}>
            {listGames(finished.slice(1, 5))}
          </Section>
        )}
        <Section title={t('scorers')} action={tabLink('stats', t('allStats'))}>
          {scorers.node}
        </Section>
      </div>
      <aside className="nt-side">
        {standingsCard()}
        {details()}
      </aside>
    </div>
  ) : (
    <div className="ars-over">
      <div className="ars-primary">
        <div className="nt-feature">
          {latest ? hero(latest) : upcoming[0] ? hero(upcoming[0]) : null}
        </div>
        {finished.length > 1 && (
          <Section title={t('recent')} action={tabLink('matches', t('allMatches'))}>
            {listGames(finished.slice(1, 5))}
          </Section>
        )}
        <Section title={t('scorers')} action={tabLink('stats', t('allStats'))}>
          {scorers.node}
        </Section>
        {progress()}
      </div>
      <aside className="ars-secondary">
        {nextCards()}
        {standingsCard()}
        {details()}
      </aside>
    </div>
  );

  // Matches
  const compKeys = ['all', ...data.competitions.map((c) => String(c.id))];
  const compLabel = (k: string) => (k === 'all' ? t('all') : compName(Number(k)));
  const base =
    comp === 'all' ? data.fixtures : data.fixtures.filter((f) => String(f.competitionId) === comp);
  const ns = base.filter((f) => state(f) !== 'finished');
  const rs = base.filter((f) => state(f) === 'finished').reverse();
  const blocks = (
    [
      [ns, 'upcoming'],
      [rs, 'results'],
    ] as const
  ).filter(([, k]) => status === 'allStatus' || status === k);
  const matchesPanel = withSide(
    <>
      <div className="nt-tools">
        <div className="nt-filtertabs">
          {(['allStatus', 'upcoming', 'results'] as const).map((c) => (
            <a
              key={c}
              href={`#${hashes.matches}`}
              className="nt-chip"
              aria-current={c === status ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault();
                setStatus(c);
              }}
            >
              {t(c)}
            </a>
          ))}
        </div>
        <PeriodSelect value={comp} onChange={setComp} display={compLabel(comp)}>
          {compKeys.map((k) => (
            <option key={k} value={k}>
              {compLabel(k)}
            </option>
          ))}
        </PeriodSelect>
      </div>
      {blocks.map(([list, key]) =>
        list.length ? (
          status === 'allStatus' ? (
            <Section key={key} title={t(key)}>
              {listGames([...list])}
            </Section>
          ) : (
            <div key={key} className="nt-main">
              {listGames([...list])}
            </div>
          )
        ) : status !== 'allStatus' ? (
          <div key={key} className="nt-empty nt-frame">
            <p>{t(key === 'results' ? 'noResults' : 'noUpcoming')}</p>
          </div>
        ) : null,
      )}
    </>,
  );

  // Squad
  const apps = useMemo(
    () => new Map(rankTallies(data.tallies, 'all', 'apps').map((e) => [e.key, e.value])),
    [data.tallies],
  );
  const shown = SQUAD_POSITIONS.filter((p) => position === 'allPositions' || p === position);
  const posLabel = (k: string) => t(k as SquadPosition | 'allPositions');
  const squadPanel = withSide(
    <>
      <div className="nt-tools">
        {national ? (
          <div>
            <b>{data.squadCaption ?? t('squadNational')}</b>
            <span className="nt-meta nt-block">
              {fmtNumber(data.squad.length, locale)} {t('players')}
            </span>
          </div>
        ) : (
          <span className="nt-meta">
            {t('squadList')} · {fmtNumber(data.squad.length, locale)}
          </span>
        )}
        <PeriodSelect value={position} onChange={setPosition} display={posLabel(position)}>
          {['allPositions', ...SQUAD_POSITIONS].map((k) => (
            <option key={k} value={k}>
              {posLabel(k)}
            </option>
          ))}
        </PeriodSelect>
      </div>
      {data.squad.length === 0 ? (
        <p className="nt-empty nt-frame">{t('noData')}</p>
      ) : (
        shown.map((pos) => {
          const list = data.squad
            .filter((p) => p.position === pos)
            .sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
          if (!list.length) return null;
          const rows = list.map((p) => {
            const third = national ? (p.club?.name ?? '') : (p.nationality ?? '');
            const captain = data.details.captain?.slug === p.slug;
            return (
              <tr key={p.id}>
                <td className="nt-num">{p.number != null ? fmtNumber(p.number, locale) : ''}</td>
                <th scope="row">
                  <IntentLink href={`/${locale}/joueur/${p.slug}`} className="nt-person-link">
                    <bdi>{p.name}</bdi>
                    {captain ? (
                      <span className="nt-capt" title={t('captain')} aria-label={t('captain')}>
                        C
                      </span>
                    ) : null}
                  </IntentLink>
                  <small className="nt-mobileclub">{third}</small>
                </th>
                <td className="nt-club">
                  <span>
                    {national && p.club ? (
                      <TeamMark
                        className="nt-clubmark"
                        src={p.club.logoUrl}
                        name={p.club.name}
                        code={p.club.code}
                        size={20}
                      />
                    ) : null}
                    {third}
                  </span>
                </td>
                <td>{fmtNumber(apps.get(String(p.id)) ?? 0, locale)}</td>
              </tr>
            );
          });
          return (
            <Section key={pos} title={t(pos)}>
              {table(
                [
                  '#',
                  t('player'),
                  t(national ? 'club' : 'nationality'),
                  t(national ? 'caps' : 'apps'),
                ],
                rows,
                t(pos),
                'nt-squad',
              )}
            </Section>
          );
        })
      )}
    </>,
  );

  // Stats
  const statComps = [
    'all',
    ...data.competitions
      .filter((c) => data.tallies.some((x) => x.competitionId === c.id))
      .map((c) => String(c.id)),
  ];
  const [statComp, setStatComp] = useState('all');
  const statKey: number | 'all' = statComp === 'all' ? 'all' : Number(statComp);
  const metrics = TALLY_METRICS.filter((m) => rankTallies(data.tallies, statKey, m).length);
  const [metricRaw, setMetric] = useState<TallyMetric>('goals');
  const metric: TallyMetric = metrics.includes(metricRaw) ? metricRaw : (metrics[0] ?? 'goals');
  const [full, setFull] = useState(false);
  const ranked = rankTable(statKey, metric, full ? 0 : 20);
  const scopeMatches = finished.filter(
    (f) => statKey === 'all' || f.competitionId === statKey,
  ).length;
  const statsPanel = withSide(
    <>
      <div className="nt-tools">
        <PeriodSelect
          value={statComp}
          onChange={(v) => {
            setStatComp(v);
            setFull(false);
          }}
          display={compLabel(statComp)}
        >
          {statComps.map((k) => (
            <option key={k} value={k}>
              {compLabel(k)}
            </option>
          ))}
        </PeriodSelect>
        {metrics.length > 0 && (
          <PeriodSelect
            value={metric}
            onChange={(v) => {
              setMetric(v as TallyMetric);
              setFull(false);
            }}
            display={t(metric)}
          >
            {metrics.map((m) => (
              <option key={m} value={m}>
                {t(m)}
              </option>
            ))}
          </PeriodSelect>
        )}
      </div>
      <p className="nt-scope">
        {team.name} · {t('matchCount', { count: scopeMatches })}
      </p>
      {ranked.node}
      {ranked.total > 20 && (
        <button type="button" className="nt-expand" onClick={() => setFull((v) => !v)}>
          {full ? t('showFewer') : t('viewAll', { count: ranked.total })}
          <ChevronIcon />
        </button>
      )}
    </>,
  );

  // Transfers (club)
  const typeLabel = (type: string | null) => {
    const v = (type ?? '').toLowerCase();
    if (v.includes('loan') && v.includes('end')) return t('endLoan');
    if (v.includes('loan')) return t('loan');
    if (v.includes('free')) return t('free');
    if (!v || v === 'n/a' || v === '-') return '';
    return v.includes('€') || v.includes('$') || v.includes('£') || /\d/.test(v)
      ? t('permanent')
      : (type ?? '');
  };
  const transfersPanel = data.transfers
    ? withSide(
        <>
          <div className="nt-tools">
            <div>
              <b>{t('window', { season: data.seasonLabel })}</b>
              <small className="nt-block nt-meta">{t('firstTeam')}</small>
            </div>
            <PeriodSelect
              value={moveFilter}
              onChange={setMoveFilter}
              display={moveFilter === 'both' ? t('allStatus') : t(moveFilter as 'in' | 'out')}
            >
              {(['both', 'in', 'out'] as const).map((k) => (
                <option key={k} value={k}>
                  {k === 'both' ? t('allStatus') : t(k)}
                </option>
              ))}
            </PeriodSelect>
          </div>
          {(['in', 'out'] as const)
            .filter((k) => moveFilter === 'both' || moveFilter === k)
            .map((k) => {
              const list = data.transfers![k];
              return (
                <Section key={k} title={t(k)}>
                  {list.length ? (
                    table(
                      [t('player'), t(k === 'in' ? 'from' : 'to'), t('type')],
                      list.map((m) => (
                        <tr key={m.key}>
                          <th scope="row">
                            {m.player.slug ? (
                              <IntentLink
                                href={`/${locale}/joueur/${m.player.slug}`}
                                className="nt-person-link"
                              >
                                <bdi>{m.player.name}</bdi>
                              </IntentLink>
                            ) : (
                              <bdi>{m.player.name}</bdi>
                            )}
                          </th>
                          <td>
                            <bdi>{m.other}</bdi>
                          </td>
                          <td>{typeLabel(m.type)}</td>
                        </tr>
                      )),
                      t(k),
                      'ars-transfers',
                    )
                  ) : (
                    <p className="nt-empty nt-frame">{t('noData')}</p>
                  )}
                </Section>
              );
            })}
        </>,
      )
    : null;

  const tabs: TabKey[] = national
    ? ['overview', 'matches', 'squad', 'stats']
    : ['overview', 'matches', 'squad', 'stats', 'transfers'];
  const tabLabel = (k: TabKey) =>
    k === 'squad' && national ? t('squadNational') : t(k as Exclude<TabKey, 'table'>);
  const asOfLabel = formatDateLabel(toSiteDateKey(new Date(data.asOf)), locale, '');

  return (
    <div className={`pl pl-page cup-page nt-page ${mcFont.variable}`} data-team-hub>
      <div className="nt-identity">
        <TeamMark
          className="nt-crest"
          src={team.logoUrl}
          status={team.logoStatus}
          isNational={national}
          countryCode={team.countryCode}
          name={team.name}
          code={team.code}
          primary={team.primaryColor}
          secondary={team.secondaryColor}
          size={128}
        />
        <div className="nt-title">
          <h1>
            <bdi>{team.name}</bdi>
          </h1>
          <p>{data.subtitle}</p>
        </div>
        <div className="nt-dateline">
          {national ? (
            <>
              {t('snapshot')}
              <strong>{asOfLabel}</strong>
            </>
          ) : (
            <>
              <strong>
                <bdi>{data.seasonLabel}</bdi>
              </strong>
              {t('asOf', { date: asOfLabel })}
            </>
          )}
        </div>
        <button
          type="button"
          className={`nt-follow${following ? ' active' : ''}`}
          aria-pressed={following}
          aria-label={`${t(following ? 'followed' : 'follow')} · ${team.name}`}
          onClick={() => toggleTeam(team.id)}
        >
          <StarIcon />
          <span>{t(following ? 'followed' : 'follow')}</span>
        </button>
      </div>

      <div ref={rootRef} className="pl-panels nt-panels" data-tab={tab} suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: initScript(locale) }} />
        <nav className="pl-tabs nt-tabs" aria-label={team.name}>
          {tabs.map((k) => (
            <a
              key={k}
              href={`#${hashes[k]}`}
              className="pl-tab"
              data-pl-tab={k}
              aria-current={tab === k ? 'page' : undefined}
              onClick={(e) => {
                e.preventDefault();
                select(k);
              }}
            >
              {tabLabel(k)}
            </a>
          ))}
        </nav>
        <div data-pl-panel="overview">{overview}</div>
        <div data-pl-panel="matches">{matchesPanel}</div>
        <div data-pl-panel="squad">{squadPanel}</div>
        <div data-pl-panel="stats">{statsPanel}</div>
        {transfersPanel ? <div data-pl-panel="transfers">{transfersPanel}</div> : null}
        {!national && data.standings ? (
          <div data-pl-panel="table">
            {withSide(
              <Section title={t('table', { competition: data.standings.competitionName })}>
                {standingTable(true)}
              </Section>,
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
