'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import type { MatchLineup, MatchTeamStats } from '@/lib/db/queries/match-detail';
import { useLiveMatch } from '@/components/match/MatchLiveUpdater';
import { useFollows } from '@/hooks/useFollows';
import {
  FINISHED_CODES_ARRAY,
  INTERRUPTED_CODES_ARRAY,
  LIVE_CODES_ARRAY,
} from '@/lib/match-status';
import {
  buildIncidents,
  incidentFilter,
  isGoal,
  KEY_METRICS,
  metric,
  METRIC_GROUPS,
  minuteText,
  formatHeroScorerMinutes,
  heroScorers,
  tableRows,
  type Incident,
  type IncidentFilter,
  type LiveFixture,
  type Metric,
  type MetricKey,
  type Phase,
  type Side,
  type TableScope,
} from '@/lib/match/match-centre';
import { EventIcon, NavIcon } from './icons';
import { Lineups } from './Lineups';
import { useCentreData } from './useCentreData';
import type { McMatch, McTable, McTeam, McUpcoming } from './types';
import { TeamMark } from '@/components/shared/TeamMark';
import type { LogoStatus } from '@/lib/logos/status';

const LIVE = new Set<string>(LIVE_CODES_ARRAY);
const FINISHED = new Set<string>(FINISHED_CODES_ARRAY);
const INTERRUPTED = new Set<string>(INTERRUPTED_CODES_ARRAY);

export type TabId = 'overview' | 'events' | 'stats' | 'lineups' | 'table';

/** Old in-page anchors (#sec-…) still linked from elsewhere. */
const ALIASES: Record<string, TabId> = {
  'sec-lineups': 'lineups',
  'sec-events': 'events',
  'sec-statistics': 'stats',
  'sec-players': 'stats',
};

function phaseOf(code: string, server: Phase): Phase {
  if (code === 'HT') return 'halftime';
  if (LIVE.has(code)) return 'live';
  if (INTERRUPTED.has(code)) return 'interrupted';
  if (FINISHED.has(code)) return 'finished';
  return server;
}

type T = ReturnType<typeof useTranslations<'matchCentre'>>;

const Mark = ({
  src,
  className = 'mark',
  size,
  name,
  code,
  primary,
  secondary,
  status,
  variant = 'team',
}: {
  src: string | null;
  className?: string;
  /** Intrinsic box (width/height attributes) for above-the-fold crests; CSS sets the shown size. */
  size?: number;
  name?: string | null;
  code?: string | null;
  primary?: string | null;
  secondary?: string | null;
  status?: LogoStatus | null;
  variant?: 'team' | 'competition';
}) => (
  <TeamMark
    className={className}
    src={src}
    status={status}
    size={size}
    name={name}
    code={code}
    primary={primary}
    secondary={secondary}
    variant={variant}
  />
);

const TeamName = ({ team }: { team: McTeam }) =>
  team.href ? <a href={team.href}>{team.name}</a> : <>{team.name}</>;

const pair = (h: number, a: number) => <bdi dir="ltr">{`${h}–${a}`}</bdi>;

// ── Header card ──────────────────────────────────────────────────────────────────────────

function Board({
  m,
  phase,
  live,
  incidents,
  t,
}: {
  m: McMatch;
  phase: Phase;
  live: {
    code: string;
    minute: number | null;
    extra: number | null;
    h: number | null;
    a: number | null;
  };
  incidents: Incident[];
  t: T;
}) {
  const { followedMatches, toggleMatch } = useFollows();
  const saved = followedMatches.has(m.id);
  const n = (v: number) => v.toLocaleString(m.bcp);
  const minute =
    live.minute != null ? `${n(live.minute)}${live.extra ? `+${n(live.extra)}` : ''}′` : '';
  let status: string;
  if (phase === 'upcoming') status = t('board.kickoff');
  else if (phase === 'halftime') status = t('board.halfTime');
  else if (phase === 'live')
    status =
      live.code === 'BT'
        ? t('board.breakTime')
        : live.code === 'P'
          ? t('board.penalties')
          : live.code === 'INT'
            ? t('board.interrupted')
            : `${t('board.live')}${minute ? ` ${minute}` : ''}`;
  else if (phase === 'finished')
    status =
      live.code === 'AET'
        ? t('board.afterExtraTime')
        : live.code === 'PEN' && m.homeScorePen != null && m.awayScorePen != null
          ? t('board.afterPenalties', { score: `${m.homeScorePen}–${m.awayScorePen}` })
          : live.code === 'AWD' || live.code === 'WO'
            ? t('board.awarded')
            : live.code === 'CANC'
              ? t('board.cancelled')
              : live.code === 'ABD'
                ? t('board.abandoned')
                : t('board.fullTime');
  else
    status =
      live.code === 'PST'
        ? t('board.postponed')
        : live.code === 'CANC'
          ? t('board.cancelled')
          : live.code === 'ABD'
            ? t('board.abandoned')
            : t('board.suspended');
  const hasScore = phase !== 'upcoming' && live.h != null && live.a != null;
  const team = (side: Side) => {
    const tm = side === 0 ? m.home : m.away;
    const { shown, hidden } = heroScorers(incidents, side);
    return (
      <div className="mc-team">
        <Mark
          src={tm.logo}
          size={112}
          name={tm.name}
          code={tm.code}
          primary={tm.primary}
          secondary={tm.secondary}
          status={tm.logoStatus}
        />
        <strong>
          <TeamName team={tm} />
        </strong>
        <div className="mc-scorers">
          {shown.map((line) => {
            const tags = {
              penalty: t('board.penaltyShort'),
              ownGoal: t('board.ownGoalShort'),
            };
            return (
              <small key={line.key} dir="ltr">
                {line.player ? `${line.player} ` : null}
                <bdi dir="ltr">{formatHeroScorerMinutes(line, tags)}</bdi>
              </small>
            );
          })}
          {hidden > 0 && (
            <small>
              <a
                href="#events"
                className="mc-more-scorers"
                aria-label={t('board.moreScorersHint', { n: hidden })}
              >
                {t('board.moreScorers', { n: hidden })}
              </a>
            </small>
          )}
        </div>
      </div>
    );
  };
  return (
    <article className="mc-board">
      <div className="mc-kicker">
        {m.competition.href ? (
          <a href={m.competition.href} className="mc-league">
            <Mark src={m.competition.logo} name={m.competition.name} variant="competition" />
            <span>{m.competition.name}</span>
          </a>
        ) : (
          <span className="mc-league">
            <Mark src={m.competition.logo} name={m.competition.name} variant="competition" />
            <span>{m.competition.name}</span>
          </span>
        )}
        {m.roundLabel && <span className="mc-round">{m.roundLabel}</span>}
        <button
          type="button"
          className={`save mc-star${saved ? ' on' : ''}`}
          aria-label={t(saved ? 'board.remove' : 'board.save')}
          aria-pressed={saved}
          onClick={() => toggleMatch(m.id)}
        >
          <NavIcon name="star" />
        </button>
      </div>
      <div className="mc-scoreline">
        {team(0)}
        <div className="mc-score">
          <span className={`mc-phase${phase === 'live' ? ' playing' : ''}`}>{status}</span>
          <strong>{hasScore ? pair(live.h!, live.a!) : <bdi dir="ltr">{m.timeText}</bdi>}</strong>
        </div>
        {team(1)}
      </div>
      <div className="mc-meta">
        <span>
          <time dateTime={m.kickoffIso}>{m.dateText}</time>
        </span>
        {m.venue && <span>{m.venue}</span>}
      </div>
    </article>
  );
}

// ── Building blocks ──────────────────────────────────────────────────────────────────────

function Section({
  title,
  link,
  children,
}: {
  title: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section className="mc-section">
      <div className="pl-head">
        <h2>{title}</h2>
        {link && (
          <a href={link.href} className="link">
            {link.label} <NavIcon name="arrow" />
          </a>
        )}
      </div>
      {children}
    </section>
  );
}

function Choices<V extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: Array<[V, string]>;
  value: V;
  onChange: (v: V) => void;
  label: string;
}) {
  // A single option (today: "Match" on the stats tab) is not a useful control.
  // Keep the component for a future half/full split; render nothing until there
  // are at least two periods so the stats card sits flush under the tabs.
  if (items.length < 2) return null;
  return (
    <div className="mc-choices" role="group" aria-label={label}>
      {items.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

function Upcoming({ cards, label }: { cards: McUpcoming[]; label: string }) {
  if (cards.length === 0) return null;
  return (
    <section className="soon pl-coming" aria-label={label}>
      <div className="upgrid">
        {cards.map((c) => (
          <a key={c.id} href={c.href} className="sooncard">
            <div className="cardtop">{c.dayLabel}</div>
            <div className="upcoming-match">
              <div className="pair">
                {[c.home, c.away].map((tm, i) => (
                  <div key={i} className="teamline">
                    <Mark
                      src={tm.logo}
                      name={tm.name}
                      code={tm.code}
                      primary={tm.primary}
                      secondary={tm.secondary}
                      status={tm.logoStatus}
                    />
                    <bdi>{tm.name}</bdi>
                  </div>
                ))}
              </div>
              <time className="when" dateTime={c.iso}>
                <bdi dir="ltr">{c.time}</bdi>
              </time>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// ── Events ───────────────────────────────────────────────────────────────────────────────

type FeedItem =
  | { type: 'incident'; inc: Incident }
  | { type: 'break'; key: string; label: string; score: [number, number] | null };

function incidentLabel(i: Incident, t: T, teamName: string): { label: string; extra: string } {
  switch (i.kind) {
    case 'goal':
      return i.assist
        ? { label: t('events.goal'), extra: `${t('events.assist')} · ${i.assist}` }
        : { label: t('events.goal'), extra: teamName };
    case 'penaltyGoal':
      return { label: t('events.penaltyGoal'), extra: teamName };
    case 'ownGoal':
      return { label: t('events.ownGoal'), extra: teamName };
    case 'missedPenalty':
      return { label: t('events.missedPenalty'), extra: teamName };
    case 'yellow':
      return { label: t('events.yellow'), extra: teamName };
    case 'secondYellow':
      return { label: t('events.secondYellow'), extra: teamName };
    case 'red':
      return { label: t('events.red'), extra: teamName };
    case 'var':
      return { label: 'VAR', extra: i.detail ?? t('events.var') };
    default:
      return { label: t('events.sub'), extra: teamName };
  }
}

function IncidentRow({ i, m, t }: { i: Incident; m: McMatch; t: T }) {
  const team = i.side === 0 ? m.home : m.away;
  const min = <bdi>{minuteText(i)}</bdi>;
  if (i.kind === 'sub') {
    return (
      <li className="mc-incident">
        {min}
        <span className="mc-symbol" aria-hidden="true" />
        <span className="mc-event-name mc-sub-pair">
          <strong>
            <EventIcon kind="on" className="mc-incident-icon" />
            <span className="sr">{t('events.on')} </span>
            {i.inName ?? ''}
          </strong>
          <small>
            <EventIcon kind="off" className="mc-incident-icon" />
            <span className="sr">{t('events.off')} </span>
            {`${i.outName ?? ''} · ${t('events.sub')}`}
          </small>
        </span>
        <b />
        <Mark
          src={team.logo}
          size={36}
          name={team.name}
          code={'code' in team ? team.code : undefined}
          primary={'primary' in team ? team.primary : undefined}
          secondary={'secondary' in team ? team.secondary : undefined}
        />
      </li>
    );
  }
  const { label, extra } = incidentLabel(i, t, team.name);
  const symbol =
    i.kind === 'var' ? (
      <span className="mc-var">VAR</span>
    ) : isGoal(i.kind) ? (
      <EventIcon kind="goal" className="mc-incident-icon" />
    ) : i.kind === 'yellow' ? (
      <EventIcon kind="yellow" className="mc-incident-icon" />
    ) : i.kind === 'red' || i.kind === 'secondYellow' ? (
      <EventIcon kind="red" className="mc-incident-icon" />
    ) : null;
  return (
    <li className="mc-incident">
      {min}
      <span className="mc-symbol" aria-hidden="true">
        {symbol}
      </span>
      <span className="mc-event-name">
        <strong>{i.player ?? team.name}</strong>
        <small>{`${label} · ${extra}`}</small>
      </span>
      <b className="mc-miniscore">{i.score ? pair(i.score[0], i.score[1]) : null}</b>
      <Mark
        src={team.logo}
        size={36}
        name={team.name}
        code={'code' in team ? team.code : undefined}
        primary={'primary' in team ? team.primary : undefined}
        secondary={'secondary' in team ? team.secondary : undefined}
      />
    </li>
  );
}

function Feed({ items, m, t, empty }: { items: FeedItem[]; m: McMatch; t: T; empty: string }) {
  return (
    <ol className="mc-feed">
      {items.length === 0 ? (
        <li className="mc-empty">{empty}</li>
      ) : (
        items.map((it) =>
          it.type === 'break' ? (
            <li key={it.key} className="mc-break">
              {it.label}
              {it.score ? <> · {pair(it.score[0], it.score[1])}</> : null}
            </li>
          ) : (
            <IncidentRow key={it.inc.key} i={it.inc} m={m} t={t} />
          ),
        )
      )}
    </ol>
  );
}

/** Newest first, with the template's Half-time / Full-time rows and Kick-off at the bottom. */
function fullFeed(
  incidents: Incident[],
  m: McMatch,
  phase: Phase,
  code: string,
  score: [number, number] | null,
  t: T,
): FeedItem[] {
  const items: FeedItem[] = [];
  const pastHalf =
    phase === 'halftime' ||
    phase === 'finished' ||
    (phase === 'live' && code !== '1H') ||
    (phase === 'interrupted' && incidents.some((i) => i.minute > 45));
  let htAdded = false;
  const htScore = (): [number, number] | null => {
    if (m.homeScoreHt != null && m.awayScoreHt != null) return [m.homeScoreHt, m.awayScoreHt];
    const first = incidents.filter((i) => isGoal(i.kind) && i.minute <= 45);
    return [first.filter((i) => i.side === 0).length, first.filter((i) => i.side === 1).length];
  };
  for (const inc of incidents) {
    if (pastHalf && !htAdded && inc.minute > 45) {
      items.push({ type: 'break', key: 'ht', label: t('events.halfTime'), score: htScore() });
      htAdded = true;
    }
    items.push({ type: 'incident', inc });
  }
  if (pastHalf && !htAdded)
    items.push({ type: 'break', key: 'ht', label: t('events.halfTime'), score: htScore() });
  if (phase === 'finished')
    items.push({ type: 'break', key: 'ft', label: t('events.fullTime'), score });
  items.reverse();
  if (phase !== 'upcoming')
    items.push({ type: 'break', key: 'ko', label: t('events.kickOff'), score: null });
  return items;
}

// ── Stats ────────────────────────────────────────────────────────────────────────────────

/**
 * Comparison bar: the side with the higher value is green, the other grey; a tie is grey on both
 * sides (no leader). Home is the first segment, so it sits on the right in Arabic.
 */
function Bar({ share }: { share: number }) {
  const lead = share > 50 ? 'home' : share < 50 ? 'away' : 'tie';
  return (
    <div className="mc-bar" data-lead={lead} aria-hidden="true">
      {share > 0 && <i className="mc-bar-home" style={{ width: `${share}%` }} />}
      {share < 100 && <i className="mc-bar-away" />}
    </div>
  );
}

function MetricRow({ row, t }: { row: Metric; t: T }) {
  return (
    <div className="mc-metric">
      <div>
        <bdi>{row.homeText}</bdi>
        <span>{t(`stats.${row.key}`)}</span>
        <bdi>{row.awayText}</bdi>
      </div>
      {row.share != null && <Bar share={row.share} />}
    </div>
  );
}

function StatCard({
  m,
  rows,
  grouped,
  t,
}: {
  m: McMatch;
  rows: Map<MetricKey, Metric>;
  grouped: boolean;
  t: T;
}) {
  return (
    <div className="mc-statcard">
      <div className="mc-cols">
        {[m.home, m.away].map((tm) => (
          <span key={tm.id}>
            <Mark
              src={tm.logo}
              size={36}
              name={tm.name}
              code={tm.code}
              primary={tm.primary}
              secondary={tm.secondary}
              status={tm.logoStatus}
            />
            <bdi>{tm.name}</bdi>
          </span>
        ))}
      </div>
      {grouped
        ? METRIC_GROUPS.map((g) => {
            const list = g.keys.map((k) => rows.get(k)).filter((r): r is Metric => !!r);
            if (list.length === 0) return null;
            return (
              <div key={g.id}>
                <h3>{t(`stats.${g.id}`)}</h3>
                {list.map((r) => (
                  <MetricRow key={r.key} row={r} t={t} />
                ))}
              </div>
            );
          })
        : KEY_METRICS.map((k) => rows.get(k))
            .filter((r): r is Metric => !!r)
            .map((r) => <MetricRow key={r.key} row={r} t={t} />)}
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────────────────

function Standings({
  m,
  table,
  live,
  scope,
  t,
}: {
  m: McMatch;
  table: McTable;
  live: LiveFixture[];
  scope: TableScope;
  t: T;
}) {
  const rows = tableRows(table.base, table.results, live, scope);
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <div className="standings">
      <table
        className="stand-table"
        aria-label={`${t('table.standings')} · ${t(`table.${scope}`)}`}
      >
        <colgroup>
          <col className="rank-col" />
          <col />
          <col className="number-col" />
          <col className="goal-col" />
          <col className="pts-col" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">{t('table.club')}</th>
            <th scope="col">
              <abbr title={t('table.played')}>{t('table.shortP')}</abbr>
            </th>
            <th scope="col">
              <abbr title={t('table.gd')}>{t('table.shortGD')}</abbr>
            </th>
            <th scope="col">
              <abbr title={t('table.points')}>{t('table.shortPts')}</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.teamId}
              aria-current={r.teamId === m.home.id || r.teamId === m.away.id ? 'true' : undefined}
            >
              <td>{i + 1}</td>
              <th scope="row">
                <span className="standing-team">
                  <Mark src={r.logo} name={r.name} />
                  <bdi className="standing-name">
                    {r.href ? <a href={r.href}>{r.name}</a> : r.name}
                  </bdi>
                  {r.live && (
                    <>
                      {' '}
                      <span className="standing-live">
                        {t('table.live')} <bdi dir="ltr">{r.live.join('-')}</bdi>
                      </span>
                    </>
                  )}
                </span>
              </th>
              <td>{r.played}</td>
              <td>
                <bdi>{sign(r.goalDiff)}</bdi>
              </td>
              <td className="standing-pts">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────────────────

function initScript(ids: TabId[]) {
  return `(function(){try{var r=document.currentScript.parentElement;var h=location.hash.slice(1);var a=${JSON.stringify(
    ALIASES,
  )};h=a[h]||h;if(${JSON.stringify(ids)}.indexOf(h)>0)r.setAttribute('data-tab',h);}catch(e){}})();`;
}

function Panel({ id, children }: { id: TabId; children: ReactNode }) {
  return (
    <section id={id} data-mc-panel={id} aria-labelledby={`mc-tab-${id}`} tabIndex={-1}>
      {children}
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────────────────

export interface MatchCentreProps {
  match: McMatch;
  upcoming: McUpcoming[];
  table: McTable | null;
}

export function MatchCentre({ match: m, upcoming, table }: MatchCentreProps) {
  const t = useTranslations('matchCentre');
  const liveCtx = useLiveMatch();
  const code = liveCtx?.statusCode ?? m.statusCode;
  const phase = phaseOf(code, m.phase);
  const live = {
    code,
    minute: liveCtx?.minute ?? m.minute,
    extra: liveCtx?.extraMinute ?? m.extraMinute,
    h: liveCtx ? liveCtx.homeScore : m.homeScore,
    a: liveCtx ? liveCtx.awayScore : m.awayScore,
  };
  const started = phase !== 'upcoming';
  const data = useCentreData(String(m.id), m.coverage, started);
  const incidents = useMemo(
    () => buildIncidents(data.events, m.home.id, data.lineups, m.locale),
    [data.events, data.lineups, m.home.id, m.locale],
  );
  const statsBy = (id: number): MatchTeamStats | null =>
    data.teamStats.find((s) => s.teamId === id) ?? null;
  const metrics = new Map<MetricKey, Metric>();
  for (const g of METRIC_GROUPS)
    for (const k of g.keys) {
      const r = metric(
        k,
        { home: statsBy(m.home.id), away: statsBy(m.away.id) },
        data.events.length > 0 ? incidents : null,
        m.bcp,
      );
      if (r) metrics.set(k, r);
    }
  const hasFeedStats = [...metrics.keys()].some((k) => k !== 'yellow' && k !== 'reds');
  const lineupFor = (id: number): MatchLineup | null =>
    data.lineups.find((l) => l.teamId === id) ?? null;
  const homeLineup = lineupFor(m.home.id);
  const awayLineup = lineupFor(m.away.id);
  const hasLineups = !!(
    homeLineup &&
    awayLineup &&
    homeLineup.starters.length > 0 &&
    awayLineup.starters.length > 0
  );
  const played =
    phase === 'live' ||
    phase === 'halftime' ||
    phase === 'finished' ||
    (phase === 'interrupted' && (incidents.length > 0 || live.h != null));

  const tabs: TabId[] = played
    ? [
        'overview',
        'events',
        ...(hasFeedStats ? (['stats'] as const) : []),
        ...(hasLineups ? (['lineups'] as const) : []),
        ...(table ? (['table'] as const) : []),
      ]
    : [
        'overview',
        ...(hasLineups ? (['lineups'] as const) : []),
        ...(table ? (['table'] as const) : []),
      ];

  const [active, setActive] = useState<TabId>('overview');
  const rootRef = useRef<HTMLDivElement>(null);
  const tabKey = tabs.join('|');
  const resolve = useCallback(
    (hash: string): TabId | null => {
      const h = (ALIASES[hash] ?? hash) as TabId;
      return tabKey.split('|').includes(h) ? h : null;
    },
    [tabKey],
  );
  useLayoutEffect(() => {
    const sync = () => {
      const id = resolve(window.location.hash.slice(1));
      setActive(id ?? 'overview');
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [resolve]);
  useLayoutEffect(() => {
    rootRef.current?.setAttribute('data-tab', active);
  }, [active]);
  const select = (id: TabId) => {
    setActive(id);
    if (window.location.hash.slice(1) !== id)
      window.history.replaceState(window.history.state, '', `#${id}`);
    const top = rootRef.current?.querySelector('.pl-tabs');
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: 'start' });
  };
  // Plain hash links: the hashchange listener above switches the panel.
  const tabLink = (id: TabId, label: string) => ({ href: `#${id}`, label });

  const [filter, setFilter] = useState<IncidentFilter>('all');
  const [scope, setScope] = useState<TableScope>('overall');

  const score: [number, number] | null = live.h != null && live.a != null ? [live.h, live.a] : null;
  const allItems = fullFeed(incidents, m, phase, code, score, t);
  const filtered =
    filter === 'all'
      ? allItems
      : allItems.filter((it) => it.type === 'incident' && incidentFilter(it.inc.kind) === filter);
  const moments: FeedItem[] = incidents
    .filter((i) => i.player || i.inName)
    .slice(-3)
    .reverse()
    .map((inc) => ({ type: 'incident', inc }));

  // Live table: the other fixtures in play plus this one with the live score.
  const liveFixtures: LiveFixture[] = table
    ? [
        ...table.live.filter((f) => f.fixtureId !== m.id),
        ...((phase === 'live' || phase === 'halftime') && score
          ? [
              {
                fixtureId: m.id,
                homeTeamId: m.home.id,
                awayTeamId: m.away.id,
                homeScore: score[0],
                awayScore: score[1],
              },
            ]
          : []),
      ]
    : [];
  const tableState =
    liveFixtures.length > 0
      ? t('overview.liveTable')
      : played
        ? t('overview.resultTable')
        : t('overview.preTable');

  const rail = (extra?: ReactNode) => (
    <aside className="mc-rail">
      <Upcoming cards={upcoming} label={t('upcoming.label')} />
      {extra}
    </aside>
  );
  const frame = (main: ReactNode, extra?: ReactNode) => (
    <div className="mc-grid">
      <div className="mc-main">{main}</div>
      {rail(extra)}
    </div>
  );
  const keyStats = hasFeedStats ? (
    <Section
      title={t('overview.keyStats')}
      link={tabs.includes('stats') ? tabLink('stats', t('overview.allStats')) : undefined}
    >
      <StatCard m={m} rows={metrics} grouped={false} t={t} />
    </Section>
  ) : null;
  const standingsBlock = (title: string) =>
    table ? (
      <Section title={title}>
        <Standings m={m} table={table} live={liveFixtures} scope="overall" t={t} />
      </Section>
    ) : null;

  const labels: Record<TabId, string> = {
    overview: t('tabs.overview'),
    events: t('tabs.events'),
    stats: t('tabs.stats'),
    lineups: t('tabs.lineups'),
    table: t('tabs.table'),
  };

  return (
    <div
      ref={rootRef}
      className="pl-page pl-match mc-page"
      data-tab={active}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: initScript(tabs) }} />
      <h1 className="sr">{m.h1}</h1>
      <Board m={m} phase={phase} live={live} incidents={incidents} t={t} />
      <nav className="pl-tabs" aria-label={m.competition.name}>
        {tabs.map((id) => (
          <a
            key={id}
            id={`mc-tab-${id}`}
            href={`#${id}`}
            className="pl-tab"
            data-mc-tab={id}
            aria-current={active === id ? 'page' : undefined}
            onClick={(e) => {
              e.preventDefault();
              select(id);
            }}
          >
            {labels[id]}
          </a>
        ))}
      </nav>

      <Panel id="overview">
        {played
          ? frame(
              <>
                <Section
                  title={t('overview.moments')}
                  link={tabLink('events', t('overview.allEvents'))}
                >
                  <Feed items={moments} m={m} t={t} empty={t('overview.noEvents')} />
                </Section>
                {keyStats}
              </>,
            )
          : frame(
              <>
                {hasLineups && homeLineup && awayLineup && (
                  <Section
                    title={t('overview.confirmed')}
                    link={tabLink('lineups', t('overview.lineups'))}
                  >
                    <div className="mc-lineup-link">
                      {[
                        [m.home, homeLineup],
                        [m.away, awayLineup],
                      ].map(([tm, l]) => (
                        <span key={(tm as McTeam).id}>
                          <Mark
                            src={(tm as McTeam).logo}
                            name={(tm as McTeam).name}
                            code={(tm as McTeam).code}
                            primary={(tm as McTeam).primary}
                            secondary={(tm as McTeam).secondary}
                            status={(tm as McTeam).logoStatus}
                          />
                          {(tm as McTeam).name} <bdi>{(l as MatchLineup).formation ?? ''}</bdi>
                        </span>
                      ))}
                    </div>
                  </Section>
                )}
                {standingsBlock(t('overview.preTable'))}
              </>,
            )}
      </Panel>

      {tabs.includes('events') && (
        <Panel id="events">
          {frame(
            <>
              <Choices
                items={[
                  ['all', t('events.all')],
                  ['goals', t('events.goals')],
                  ['cards', t('events.cards')],
                  ['sub', t('events.sub')],
                ]}
                value={filter}
                onChange={setFilter}
                label={t('events.label')}
              />
              <Feed items={filtered} m={m} t={t} empty={t('events.neutral')} />
            </>,
            keyStats,
          )}
        </Panel>
      )}

      {tabs.includes('stats') && (
        <Panel id="stats">
          {frame(
            <>
              <Choices
                items={[['match', t('stats.match')]]}
                value="match"
                onChange={() => {}}
                label={t('stats.label')}
              />
              <StatCard m={m} rows={metrics} grouped t={t} />
            </>,
          )}
        </Panel>
      )}

      {tabs.includes('lineups') && homeLineup && awayLineup && (
        <Panel id="lineups">
          <section className="mc-lineups">
            <div className="mc-tactics">
              <div className="mc-linebody">
                <Lineups
                  m={m}
                  phase={phase}
                  lineups={[homeLineup, awayLineup]}
                  incidents={incidents}
                />
              </div>
              {rail()}
            </div>
          </section>
        </Panel>
      )}

      {tabs.includes('table') && table && (
        <Panel id="table">
          {frame(
            <section>
              <div className="mc-table-controls">
                <div className="pl-controls" role="group" aria-label={t('table.scope')}>
                  {(['overall', 'home', 'away'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={scope === s}
                      onClick={() => setScope(s)}
                    >
                      {t(`table.${s}`)}
                    </button>
                  ))}
                </div>
                <small className="mc-table-state">{tableState}</small>
              </div>
              <Standings m={m} table={table} live={liveFixtures} scope={scope} t={t} />
            </section>,
          )}
        </Panel>
      )}
    </div>
  );
}
