'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { TeamMark } from '@/components/shared/TeamMark';
import { MatchLink } from '@/components/shared/MatchLink';
import { LocalTime } from '@/components/shared/LocalTime';
import { matchHref } from '@/lib/seo/match-slug';
import { previewFromFixtureRow } from '@/lib/match-header-preview';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getMatchState, isFinished } from '@/lib/match-status';
import { asDate } from '@/lib/competitions/template-model';
import type { CupTie } from '@/lib/competitions/domestic-ties';
import type { DrawRound } from '@/lib/competitions/bracket';
import type { FixtureWithTeams } from '@/lib/db/queries';
import type { Locale } from '@/lib/i18n/config';
import { buildTeamHref } from '@/lib/competitions/paths';

function teamName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  return team ? getTeamDisplayName(team, locale) : '—';
}

function scoreOf(f: FixtureWithTeams, teamId: number): number | null {
  if (f.homeTeamId === teamId) return f.homeScore;
  if (f.awayTeamId === teamId) return f.awayScore;
  return null;
}

function penOf(f: FixtureWithTeams, teamId: number): number | null {
  if (f.homeTeamId === teamId) return f.homeScorePen;
  if (f.awayTeamId === teamId) return f.awayScorePen;
  return null;
}

function tieSides(tie: CupTie): [number, number] {
  const first = tie.fixtures[0];
  return [first.homeTeamId!, first.awayTeamId!];
}

function teamFromTie(tie: CupTie, teamId: number): FixtureWithTeams['homeTeam'] {
  for (const f of tie.fixtures) {
    if (f.homeTeamId === teamId) return f.homeTeam;
    if (f.awayTeamId === teamId) return f.awayTeam;
  }
  return null;
}

function aggregate(tie: CupTie, teamId: number): number | null {
  if (!tie.fixtures.some((f) => f.homeScore != null && f.awayScore != null)) return null;
  let total = 0;
  let any = false;
  for (const f of tie.fixtures) {
    const s = scoreOf(f, teamId);
    if (s != null) {
      total += s;
      any = true;
    }
  }
  return any ? total : null;
}

function winnerId(tie: CupTie): number | null {
  if (!tie.fixtures.every((f) => isFinished(f.statusCode))) return null;
  const [a, b] = tieSides(tie);
  const last = tie.fixtures[tie.fixtures.length - 1];
  const penA = penOf(last, a);
  const penB = penOf(last, b);
  if (penA != null && penB != null && penA !== penB) return penA > penB ? a : b;
  const aggA = aggregate(tie, a);
  const aggB = aggregate(tie, b);
  if (aggA == null || aggB == null || aggA === aggB) return null;
  return aggA > aggB ? a : b;
}

function Mark({ team, locale }: { team: FixtureWithTeams['homeTeam']; locale: Locale }) {
  return (
    <TeamMark
      className="mark cup-mark"
      src={team?.logoUrl}
      status={team?.logoStatus}
      name={team?.name}
      shortName={team?.shortName}
      code={team?.code}
      primary={team?.primaryColor}
      secondary={team?.secondaryColor}
      sizeVar="21px"
    />
  );
}

function FixtureScore({ fixture, locale }: { fixture: FixtureWithTeams; locale: Locale }) {
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
    <MatchLink matchId={String(fixture.id)} href={href} preview={preview} className="cup-leg">
      {fixture.homeScore != null && fixture.awayScore != null ? (
        <>
          <span className="tie-num">{fixture.homeScore}</span>
          <span className="tie-num">{fixture.awayScore}</span>
        </>
      ) : (
        <>
          <span className="tie-num">–</span>
          <span className="tie-num">–</span>
        </>
      )}
    </MatchLink>
  );
}

export function SingleMatchCard({
  fixture,
  locale,
  labels,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  labels: { fullTime: string; matchCentre: string };
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
  const finished = state === 'finished';
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;
  const win =
    finished && hasScore
      ? fixture.homeScore! > fixture.awayScore!
        ? 'home'
        : fixture.awayScore! > fixture.homeScore!
          ? 'away'
          : null
      : null;

  return (
    <MatchLink
      matchId={String(fixture.id)}
      href={href}
      preview={preview}
      className="cup-pair tie-single-link"
    >
      <div className="tie-identity">
        <span className="tie-cap">
          <LocalTime
            date={asDate(fixture.kickoffAt)}
            locale={locale}
            format="date"
            dateOptions={{ weekday: 'short', day: 'numeric', month: 'short' }}
          />
        </span>
        <div className={`tie-team${win === 'home' ? ' is-winner' : ''}`}>
          <Mark team={fixture.homeTeam} locale={locale} />
          <bdi>{teamName(fixture.homeTeam, locale)}</bdi>
        </div>
        <div className={`tie-team${win === 'away' ? ' is-winner' : ''}`}>
          <Mark team={fixture.awayTeam} locale={locale} />
          <bdi>{teamName(fixture.awayTeam, locale)}</bdi>
        </div>
      </div>
      <div className="tie-column">
        <span className="tie-cap">{finished ? labels.fullTime : ''}</span>
        <span className={`tie-num${win === 'home' ? ' is-winner' : ''}`}>
          {hasScore ? fixture.homeScore : '–'}
        </span>
        <span className={`tie-num${win === 'away' ? ' is-winner' : ''}`}>
          {hasScore ? fixture.awayScore : '–'}
        </span>
      </div>
    </MatchLink>
  );
}

export function TwoLegTieCard({
  tie,
  locale,
  labels,
}: {
  tie: CupTie;
  locale: Locale;
  labels: { leg1: string; leg2: string; agg: string; aggTitle: string };
}) {
  const [idA, idB] = tieSides(tie);
  const teamA = teamFromTie(tie, idA);
  const teamB = teamFromTie(tie, idB);
  const leg1 = tie.fixtures[0];
  const leg2 = tie.fixtures[1];
  const win = winnerId(tie);
  const start = asDate(leg1.kickoffAt);
  const end = asDate((leg2 ?? leg1).kickoffAt);
  const dateRange = start.toDateString() === end.toDateString() ? start : [start, end];

  function col(fixture: FixtureWithTeams | undefined, cap: string) {
    if (!fixture) {
      return (
        <div className="tie-column">
          <span className="tie-cap">{cap}</span>
          <span className="tie-num">–</span>
          <span className="tie-num">–</span>
        </div>
      );
    }
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
    const a = scoreOf(fixture, idA);
    const b = scoreOf(fixture, idB);
    return (
      <MatchLink
        matchId={String(fixture.id)}
        href={href}
        preview={preview}
        className="tie-column cup-leg"
      >
        <span className="tie-cap">{cap}</span>
        <span className="tie-num">{a ?? '–'}</span>
        <span className="tie-num">{b ?? '–'}</span>
      </MatchLink>
    );
  }

  const aggA = aggregate(tie, idA);
  const aggB = aggregate(tie, idB);

  return (
    <article className="cup-pair tie-double">
      <div className="tie-identity">
        <span className="tie-cap">
          {Array.isArray(dateRange) ? (
            <>
              <LocalTime
                date={dateRange[0]}
                locale={locale}
                format="date"
                dateOptions={{ weekday: 'short', day: 'numeric', month: 'short' }}
              />
              {' – '}
              <LocalTime
                date={dateRange[1]}
                locale={locale}
                format="date"
                dateOptions={{ weekday: 'short', day: 'numeric', month: 'short' }}
              />
            </>
          ) : (
            <LocalTime
              date={dateRange}
              locale={locale}
              format="date"
              dateOptions={{ weekday: 'short', day: 'numeric', month: 'short' }}
            />
          )}
        </span>
        <div className={`tie-team${win === idA ? ' is-winner' : ''}`}>
          {teamA?.slug ? (
            <a href={buildTeamHref(locale, teamA.slug)}>
              <Mark team={teamA} locale={locale} />
              <bdi>{teamName(teamA, locale)}</bdi>
            </a>
          ) : (
            <>
              <Mark team={teamA} locale={locale} />
              <bdi>{teamName(teamA, locale)}</bdi>
            </>
          )}
        </div>
        <div className={`tie-team${win === idB ? ' is-winner' : ''}`}>
          {teamB?.slug ? (
            <a href={buildTeamHref(locale, teamB.slug)}>
              <Mark team={teamB} locale={locale} />
              <bdi>{teamName(teamB, locale)}</bdi>
            </a>
          ) : (
            <>
              <Mark team={teamB} locale={locale} />
              <bdi>{teamName(teamB, locale)}</bdi>
            </>
          )}
        </div>
      </div>
      {col(leg1, labels.leg1)}
      {col(leg2, labels.leg2)}
      <div className="tie-column tie-total">
        <span className="tie-cap">
          <abbr title={labels.aggTitle}>{labels.agg}</abbr>
        </span>
        <span className={`tie-num${win === idA ? ' is-winner' : ''}`}>{aggA ?? '–'}</span>
        <span className={`tie-num${win === idB ? ' is-winner' : ''}`}>{aggB ?? '–'}</span>
      </div>
      {tie.fixtures.slice(2).map((f) => (
        <p key={f.id} className="tie-note">
          <FixtureScore fixture={f} locale={locale} />
        </p>
      ))}
    </article>
  );
}

export function TieCard({
  tie,
  locale,
  labels,
}: {
  tie: CupTie;
  locale: Locale;
  labels: {
    fullTime: string;
    matchCentre: string;
    leg1: string;
    leg2: string;
    agg: string;
    aggTitle: string;
  };
}) {
  if (tie.twoLegged || tie.fixtures.length > 1) {
    return <TwoLegTieCard tie={tie} locale={locale} labels={labels} />;
  }
  if (tie.fixtures[0]) {
    return <SingleMatchCard fixture={tie.fixtures[0]} locale={locale} labels={labels} />;
  }
  return (
    <article className="cup-pair">
      <span className="draw-slot">–</span>
    </article>
  );
}

export function RoundNav({
  rounds,
  currentSlug,
  hrefFor,
  labels,
}: {
  rounds: { slug: string; label: string }[];
  currentSlug: string;
  hrefFor: (slug: string) => string;
  labels: { previous: string; next: string; rounds: string };
}) {
  const index = rounds.findIndex((r) => r.slug === currentSlug);
  const prev = index > 0 ? rounds[index - 1] : null;
  const next = index >= 0 && index < rounds.length - 1 ? rounds[index + 1] : null;
  return (
    <nav className="draw-bar cup-round-nav" aria-label={labels.rounds}>
      <a
        className={`draw-step${prev ? '' : ' draw-disabled'}`}
        href={prev ? hrefFor(prev.slug) : undefined}
        aria-label={labels.previous}
        aria-disabled={!prev}
      >
        ‹
      </a>
      <ul>
        {rounds.map((r) => (
          <li key={r.slug}>
            <a href={hrefFor(r.slug)} aria-current={r.slug === currentSlug ? 'page' : undefined}>
              {r.label}
            </a>
          </li>
        ))}
      </ul>
      <a
        className={`draw-step${next ? '' : ' draw-disabled'}`}
        href={next ? hrefFor(next.slug) : undefined}
        aria-label={labels.next}
        aria-disabled={!next}
      >
        ›
      </a>
    </nav>
  );
}

/** Placeholder for a tie that is not known yet (bracket shell). */
function TbdCard({ twoLegged, labels }: { twoLegged: boolean; labels: DrawLabels }) {
  return (
    <article className={`cup-pair tie-tbd${twoLegged ? ' tie-double' : ''}`}>
      <div className="tie-identity">
        <span className="tie-cap">{labels.tbd}</span>
        {[0, 1].map((n) => (
          <div key={n} className="tie-team">
            <span className="tie-ph" aria-hidden="true" />
            <bdi>{labels.tbd}</bdi>
          </div>
        ))}
      </div>
      {twoLegged ? (
        <>
          {[labels.leg1, labels.leg2].map((cap) => (
            <div key={cap} className="tie-column">
              <span className="tie-cap">{cap}</span>
              <span className="tie-num">–</span>
              <span className="tie-num">–</span>
            </div>
          ))}
          <div className="tie-column tie-total">
            <span className="tie-cap">
              <abbr title={labels.aggTitle}>{labels.agg}</abbr>
            </span>
            <span className="tie-num">–</span>
            <span className="tie-num">–</span>
          </div>
        </>
      ) : (
        <div className="tie-column">
          <span className="tie-cap" />
          <span className="tie-num">–</span>
          <span className="tie-num">–</span>
        </div>
      )}
    </article>
  );
}

function clubsOf(tie: CupTie | null): number[] {
  if (!tie) return [];
  const ids = new Set<number>();
  for (const f of tie.fixtures) {
    if (f.homeTeamId != null) ids.add(f.homeTeamId);
    if (f.awayTeamId != null) ids.add(f.awayTeamId);
  }
  return [...ids];
}

/** Ties of the previous round that feed tie `j`: by shared club, else by position. */
function feeders(prev: (CupTie | null)[], cur: (CupTie | null)[], j: number): number[] {
  const target = clubsOf(cur[j]);
  const byClub = prev
    .map((t, i) => (clubsOf(t).some((id) => target.includes(id)) ? i : -1))
    .filter((i) => i >= 0);
  if (byClub.length > 0) return byClub;
  if (prev.length < cur.length) return [];
  const span = Math.max(1, Math.round(prev.length / cur.length));
  const out: number[] = [];
  for (let i = j * span; i < Math.min(prev.length, j * span + span); i++) {
    // Skip a slot that is already linked to another tie by club.
    const mine = clubsOf(prev[i]);
    const elsewhere =
      mine.length > 0 && cur.some((t, k) => k !== j && clubsOf(t).some((id) => mine.includes(id)));
    if (!elsewhere) out.push(i);
  }
  return out;
}

function Gutter({
  prev,
  cur,
  maxSlots,
}: {
  prev: (CupTie | null)[];
  cur: (CupTie | null)[];
  maxSlots: number;
}) {
  const y = (i: number, n: number) => ((i + 0.5) / Math.max(n, 1)) * maxSlots;
  const paths: string[] = [];
  for (let j = 0; j < cur.length; j++) {
    const yj = y(j, cur.length);
    const from = feeders(prev, cur, j);
    for (const i of from) paths.push(`M0 ${y(i, prev.length)} H50 V${yj}`);
    if (from.length > 0) paths.push(`M50 ${yj} H100`);
  }
  return (
    <div className="draw-gutter" aria-hidden="true">
      <svg viewBox={`0 0 100 ${maxSlots}`} preserveAspectRatio="none">
        <path d={paths.join(' ')} />
      </svg>
    </div>
  );
}

type DrawLabels = {
  fullTime: string;
  matchCentre: string;
  leg1: string;
  leg2: string;
  agg: string;
  aggTitle: string;
  previous: string;
  next: string;
  rounds: string;
  tbd: string;
};

export function DrawWindow({
  rounds,
  currentSlug,
  locale,
  hrefFor,
  nextHref,
  nextLabel,
  labels,
  windowSize = 3,
  active = true,
  scrollToFocus = false,
}: {
  rounds: DrawRound[];
  currentSlug: string;
  locale: Locale;
  hrefFor: (slug: string) => string;
  nextHref?: string | null;
  nextLabel?: string | null;
  labels: DrawLabels;
  /** Adjacent rounds shown side by side on desktop (the pane scrolls when it is narrower). */
  windowSize?: number;
  /** True while the draw is on screen, so the pane can scroll the focused round into view. */
  active?: boolean;
  /** Scroll the pane to the focused round (only when a round was asked for). */
  scrollToFocus?: boolean;
}) {
  const paneRef = useRef<HTMLDivElement>(null);
  const visible = rounds.filter((r) => !r.earlier || r.slug === currentSlug);
  const focusIdx = Math.max(
    0,
    visible.findIndex((r) => r.slug === currentSlug) >= 0
      ? visible.findIndex((r) => r.slug === currentSlug)
      : visible.length - 1,
  );
  const focus = visible[focusIdx];
  const size = Math.max(1, Math.min(windowSize, visible.length));
  const start = Math.min(focusIdx, visible.length - size);
  const columns = visible.slice(start, start + size);
  const maxSlots = Math.max(1, ...columns.map((r) => Math.max(r.ties.length, 1)));
  const tracks = columns
    .map((_, i) => (i === 0 ? 'minmax(0,1fr)' : 'var(--draw-gap) minmax(0,1fr)'))
    .join(' ');
  const anyTwoLegged = columns.some((r) => r.twoLegged);

  useEffect(() => {
    const pane = paneRef.current;
    if (!active || !scrollToFocus || !pane) return;
    const target = pane.querySelector<HTMLElement>('.draw-round.draw-selected');
    if (!target || pane.scrollWidth <= pane.clientWidth) return;
    const p = pane.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const rtl = getComputedStyle(pane).direction === 'rtl';
    pane.scrollLeft += rtl ? t.right - p.right : t.left - p.left;
  }, [active, scrollToFocus, focus?.slug]);

  return (
    <div className="cup-draw">
      <RoundNav
        rounds={visible.map((r) => ({ slug: r.slug, label: r.label }))}
        currentSlug={focus?.slug ?? currentSlug}
        hrefFor={hrefFor}
        labels={labels}
      />
      <div className="draw-window" ref={paneRef}>
        <div
          className="draw-tree"
          data-solo={columns.length <= 1 ? '' : undefined}
          style={
            {
              ['--tracks' as string]: tracks,
              ['--cols' as string]: String(columns.length),
              ['--col-min' as string]: anyTwoLegged ? '288px' : '230px',
              ['--slots' as string]: String(maxSlots),
            } as CSSProperties
          }
        >
          {columns.map((round, col) => {
            const selected = round.slug === (focus?.slug ?? currentSlug);
            const slots = Math.max(round.ties.length, 1);
            return (
              <div key={round.slug} style={{ display: 'contents' }}>
                {col > 0 && (
                  <Gutter prev={columns[col - 1].ties} cur={round.ties} maxSlots={maxSlots} />
                )}
                <section
                  className={`draw-round${selected ? ' draw-selected' : ''}`}
                  aria-current={selected ? 'page' : undefined}
                >
                  <h3>
                    <a href={hrefFor(round.slug)}>{round.label}</a>
                  </h3>
                  <div className="draw-matches" style={{ ['--slots' as string]: String(maxSlots) }}>
                    {(round.ties.length > 0 ? round.ties : [null]).map((tie, i) => {
                      const position = ((i + 0.5) / Math.max(slots, 1)) * maxSlots;
                      return (
                        <div
                          key={tie?.key ?? `empty-${i}`}
                          id={tie ? `tie-${tie.fixtures[0]?.id}` : undefined}
                          className="draw-node"
                          style={{ ['--position' as string]: position }}
                        >
                          {tie ? (
                            <TieCard tie={tie} locale={locale} labels={labels} />
                          ) : (
                            <TbdCard twoLegged={round.twoLegged} labels={labels} />
                          )}
                          {selected && nextHref && nextLabel ? (
                            <a className="draw-forward" href={nextHref}>
                              {nextLabel} ›
                            </a>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
