'use client';

import type { CSSProperties, ReactNode } from 'react';
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
import { teamCode } from '@/lib/competitions/team-code';

function teamName(team: FixtureWithTeams['homeTeam'], locale: Locale): string {
  return team ? getTeamDisplayName(team, locale) : '—';
}

/**
 * A team name inside a tie card. In the bracket (`compact`) the column is narrow, so it shows the
 * 3-letter code (API-Football `teams.code`, else a generated one); the full name stays in the
 * title and as visually hidden text for screen readers and crawlers.
 */
function TeamName({
  team,
  locale,
  compact,
}: {
  team: FixtureWithTeams['homeTeam'];
  locale: Locale;
  compact: boolean;
}) {
  const full = teamName(team, locale);
  if (!compact) return <bdi>{full}</bdi>;
  return (
    <bdi className="tie-code" title={full}>
      <span aria-hidden="true">{teamCode(team)}</span>
      <span className="cup-vh">{full}</span>
    </bdi>
  );
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
  compact = false,
}: {
  fixture: FixtureWithTeams;
  locale: Locale;
  labels: { fullTime: string; matchCentre: string };
  /** Bracket cards show 3-letter team codes. */
  compact?: boolean;
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
          <TeamName team={fixture.homeTeam} locale={locale} compact={compact} />
        </div>
        <div className={`tie-team${win === 'away' ? ' is-winner' : ''}`}>
          <Mark team={fixture.awayTeam} locale={locale} />
          <TeamName team={fixture.awayTeam} locale={locale} compact={compact} />
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
  compact = false,
}: {
  tie: CupTie;
  locale: Locale;
  labels: { leg1: string; leg2: string; agg: string; aggTitle: string };
  /** Bracket cards show 3-letter team codes. */
  compact?: boolean;
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
            <a href={buildTeamHref(locale, teamA.slug)} title={teamName(teamA, locale)}>
              <Mark team={teamA} locale={locale} />
              <TeamName team={teamA} locale={locale} compact={compact} />
            </a>
          ) : (
            <>
              <Mark team={teamA} locale={locale} />
              <TeamName team={teamA} locale={locale} compact={compact} />
            </>
          )}
        </div>
        <div className={`tie-team${win === idB ? ' is-winner' : ''}`}>
          {teamB?.slug ? (
            <a href={buildTeamHref(locale, teamB.slug)} title={teamName(teamB, locale)}>
              <Mark team={teamB} locale={locale} />
              <TeamName team={teamB} locale={locale} compact={compact} />
            </a>
          ) : (
            <>
              <Mark team={teamB} locale={locale} />
              <TeamName team={teamB} locale={locale} compact={compact} />
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
  compact = false,
}: {
  tie: CupTie;
  locale: Locale;
  /** Bracket cards show 3-letter team codes; every other view keeps full names. */
  compact?: boolean;
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
    return <TwoLegTieCard tie={tie} locale={locale} labels={labels} compact={compact} />;
  }
  if (tie.fixtures[0]) {
    return (
      <SingleMatchCard
        fixture={tie.fixtures[0]}
        locale={locale}
        labels={labels}
        compact={compact}
      />
    );
  }
  return (
    <article className="cup-pair">
      <span className="draw-slot">–</span>
    </article>
  );
}

const ARROW = {
  back: 'm15 5-7 7 7 7',
  forward: 'm9 5 7 7-7 7',
};

function StepIcon({ dir }: { dir: 'back' | 'forward' }) {
  return (
    <svg className={`ic ${dir}`} aria-hidden="true" viewBox="0 0 24 24">
      <path d={ARROW[dir]} />
    </svg>
  );
}

/** Previous / stage picker / next, as in the reference (`.draw-bar > .draw-tools`). */
export function DrawBar({
  prev,
  next,
  hrefFor,
  onSelect,
  labels,
  children,
}: {
  prev: { slug: string; label: string } | null;
  next: { slug: string; label: string } | null;
  hrefFor: (slug: string) => string;
  onSelect?: (slug: string) => void;
  labels: { previous: string; next: string };
  children: ReactNode;
}) {
  function step(target: { slug: string; label: string } | null, dir: 'back' | 'forward') {
    const text = dir === 'back' ? labels.previous : labels.next;
    if (!target) {
      return (
        <span className="draw-step draw-disabled" aria-disabled="true" aria-label={text}>
          <StepIcon dir={dir} />
        </span>
      );
    }
    return (
      <a
        className="draw-step"
        href={hrefFor(target.slug)}
        aria-label={`${text} · ${target.label}`}
        onClick={(e) => {
          if (!onSelect) return;
          e.preventDefault();
          onSelect(target.slug);
        }}
      >
        <StepIcon dir={dir} />
      </a>
    );
  }
  return (
    <div className="draw-bar">
      <div className="draw-tools">
        {step(prev, 'back')}
        {children}
        {step(next, 'forward')}
      </div>
    </div>
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
  /** "v" in "Quarter-finals · v Liverpool". */
  versus: string;
};

export function DrawWindow({
  rounds,
  currentSlug,
  locale,
  hrefFor,
  onSelect,
  picker,
  labels,
  windowSize = 3,
}: {
  rounds: DrawRound[];
  currentSlug: string;
  locale: Locale;
  hrefFor: (slug: string) => string;
  /** Swap the stage in place (client navigation); the links still work without it. */
  onSelect?: (slug: string) => void;
  /** The stage dropdown, shown between the previous and next arrows. */
  picker: ReactNode;
  labels: DrawLabels;
  /** Adjacent rounds shown side by side on desktop, starting at the selected stage. */
  windowSize?: number;
}) {
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
  const prev = focusIdx > 0 ? visible[focusIdx - 1] : null;
  const next = focusIdx < visible.length - 1 ? visible[focusIdx + 1] : null;

  /** Phone: the tie this one feeds into, "{next stage} · v {opponent}". */
  function forwardOf(round: DrawRound, tie: CupTie | null) {
    const at = visible.findIndex((r) => r.slug === round.slug);
    const nextRound = at >= 0 ? visible[at + 1] : undefined;
    if (!tie || !nextRound) return null;
    const mine = clubsOf(tie);
    const nextTie = nextRound.ties.find((t) => t && clubsOf(t).some((id) => mine.includes(id)));
    if (!nextTie) return null;
    const opponentId = clubsOf(nextTie).find((id) => !mine.includes(id));
    const opponent = opponentId != null ? teamFromTie(nextTie, opponentId) : null;
    if (!opponent) return null;
    return { slug: nextRound.slug, label: nextRound.label, opponent };
  }

  return (
    <div className="cup-draw">
      <DrawBar
        prev={prev ? { slug: prev.slug, label: prev.label } : null}
        next={next ? { slug: next.slug, label: next.label } : null}
        hrefFor={hrefFor}
        onSelect={onSelect}
        labels={labels}
      >
        {picker}
      </DrawBar>
      <div className="draw-window">
        <div
          className="draw-tree"
          data-solo={columns.length <= 1 ? '' : undefined}
          style={
            {
              ['--tracks' as string]: tracks,
              ['--cols' as string]: String(columns.length),
              ['--col-min' as string]: anyTwoLegged ? '280px' : '196px',
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
                      const forward = selected ? forwardOf(round, tie) : null;
                      return (
                        <div
                          key={tie?.key ?? `empty-${i}`}
                          id={tie ? `tie-${tie.fixtures[0]?.id}` : undefined}
                          className="draw-node"
                          style={{ ['--position' as string]: position }}
                        >
                          {tie ? (
                            <TieCard tie={tie} locale={locale} labels={labels} compact />
                          ) : (
                            <TbdCard twoLegged={round.twoLegged} labels={labels} />
                          )}
                          {forward ? (
                            <a
                              className="draw-forward"
                              href={hrefFor(forward.slug)}
                              onClick={(e) => {
                                if (!onSelect) return;
                                e.preventDefault();
                                onSelect(forward.slug);
                              }}
                            >
                              <span>
                                {forward.label} · {labels.versus}{' '}
                                <bdi>{teamName(forward.opponent, locale)}</bdi>
                              </span>
                              <StepIcon dir="forward" />
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
