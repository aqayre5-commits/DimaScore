/**
 * Hero card: team names and crests stay in a fixed first row; scorer lists grow under the
 * name; lists longer than HERO_SCORER_LIMIT collapse to a quiet +N that links to Events.
 */
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import en from '@/lib/i18n/messages/en.json';
import ar from '@/lib/i18n/messages/ar.json';
import { qk } from '@/lib/query-keys';
import { MatchCentre } from '@/components/match/centre/MatchCentre';
import { heroScorers, HERO_SCORER_LIMIT, type Incident, type Side } from '@/lib/match/match-centre';
import ucl from './fixtures/ucl-unknown-card-player.json';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function goal(
  id: number,
  teamId: number,
  minute: number,
  name: string,
  detail: 'Normal Goal' | 'Penalty' | 'Own Goal' = 'Normal Goal',
  extraMinute: number | null = null,
) {
  return {
    id,
    minute,
    extraMinute,
    type: 'Goal',
    detail,
    comments: null,
    teamId,
    player: { id, name: { en: name, ar: name } },
    assist: null,
  };
}

function render(
  locale: 'en' | 'ar',
  events: Any[],
  scores: { home: number; away: number } = { home: 5, away: 1 },
) {
  const x: Any = structuredClone(ucl);
  x.props.match.locale = locale;
  x.props.match.homeScore = scores.home;
  x.props.match.awayScore = scores.away;
  x.props.match.phase = 'finished';
  x.props.match.statusCode = 'FT';
  x.events = events;
  const id = String(x.props.match.id);
  const qc = new QueryClient();
  qc.setQueryData(qk.matchEvents(id), x.events);
  qc.setQueryData(qk.matchLineups(id), x.lineups);
  qc.setQueryData(qk.matchStats(id), x.stats);
  const tree = h(QueryClientProvider, { client: qc }, h(MatchCentre, x.props));
  return renderToString(
    h(NextIntlClientProvider, {
      locale,
      messages: locale === 'ar' ? ar : en,
      timeZone: 'Africa/Casablanca',
      children: tree,
    }),
  );
}

const HOME = 645;
const AWAY = 66;

describe('heroScorers', () => {
  const inc = (n: number, side: Side): Incident[] =>
    Array.from({ length: n }, (_, i) => ({
      key: `${side}-${i}`,
      minute: i + 1,
      extra: null,
      side,
      kind: 'goal' as const,
      playerId: i,
      player: `P${i}`,
      assist: null,
      inId: null,
      inName: null,
      outId: null,
      outName: null,
      detail: null,
      score: [side === 0 ? i + 1 : 0, side === 1 ? i + 1 : 0],
    }));

  it(`shows at most ${HERO_SCORER_LIMIT} and reports the hidden remainder`, () => {
    expect(heroScorers([], 0)).toEqual({ shown: [], hidden: 0 });
    expect(heroScorers(inc(1, 0), 0).shown).toHaveLength(1);
    expect(heroScorers(inc(5, 0), 0)).toMatchObject({ hidden: 0 });
    expect(heroScorers(inc(5, 0), 0).shown).toHaveLength(5);
    expect(heroScorers(inc(8, 0), 0).shown).toHaveLength(5);
    expect(heroScorers(inc(8, 0), 0).hidden).toBe(3);
    expect(heroScorers(inc(8, 0), 1).shown).toHaveLength(0);
  });
});

describe('hero board markup', () => {
  it('keeps the team name outside the scorer list (stable first row)', () => {
    const html = render('en', [goal(1, HOME, 10, 'Mbappé'), goal(2, AWAY, 80, 'Saka')]);
    expect(html).toMatch(/<div class="mc-team"><img[^>]+class="mark"/);
    expect(html).toMatch(/<strong><a[^>]*>Galatasaray<\/a><\/strong><div class="mc-scorers">/);
    expect(html).toContain('Mbappé 10′');
    expect(html).toContain('Saka 80′');
  });

  it('labels penalties and own goals, and keeps extra-time minutes', () => {
    const html = render('en', [
      goal(1, HOME, 12, 'Neto', 'Penalty'),
      goal(2, HOME, 90, 'Jackson', 'Own Goal', 4),
    ]);
    expect(html).toContain('Neto 12′ (P)');
    expect(html).toContain('Jackson 90+4′ (OG)');
  });

  it('uses short Arabic marks for penalties and own goals', () => {
    const html = render('ar', [
      goal(1, HOME, 12, 'Neto', 'Penalty'),
      goal(2, AWAY, 40, 'Saka', 'Own Goal'),
    ]);
    expect(html).toContain('(ر.ج)');
    expect(html).toContain('(ع.ك)');
  });

  it('caps a long list at 5 with a +N link to Events, and lists every scorer in Events', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const events = names.map((n, i) => goal(100 + i, HOME, (i + 1) * 8, n));
    const html = render('en', events, { home: 8, away: 0 });
    for (const n of names.slice(0, 5))
      expect(html).toContain(`${n} ${(names.indexOf(n) + 1) * 8}′`);
    expect(html).not.toContain('F 48′'); // hidden from hero
    expect(html).toMatch(/href="#events"[^>]*>\+3</);
    expect(html).toContain('3 more goals, view all events');
    // Events tab (and Overview key moments) still list every scorer
    for (const n of names) {
      expect((html.match(new RegExp(`>${n}<`, 'g')) || []).length).toBeGreaterThan(0);
    }
  });

  it('renders a 0-0 board with empty scorer lists and no +N', () => {
    const html = render('en', [], { home: 0, away: 0 });
    expect(html).toContain('class="mc-board"');
    expect(html).toContain('0–0');
    expect(html).not.toContain('mc-more-scorers');
  });
});
