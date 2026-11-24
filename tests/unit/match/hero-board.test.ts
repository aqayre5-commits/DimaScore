/**
 * Hero card: team names and crests stay in a fixed first row; scorer lists grow under the
 * name, grouping repeat scorers onto one line; lists longer than HERO_SCORER_LIMIT (players)
 * collapse to a quiet +N that links to Events.
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
import {
  formatHeroScorerLine,
  groupHeroScorers,
  heroScorers,
  HERO_SCORER_LIMIT,
  type Incident,
  type Side,
} from '@/lib/match/match-centre';
import ucl from './fixtures/ucl-unknown-card-player.json';

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any

const TAGS = { penalty: '(P)', ownGoal: '(OG)' };

function goal(
  id: number,
  teamId: number,
  minute: number,
  name: string,
  detail: 'Normal Goal' | 'Penalty' | 'Own Goal' = 'Normal Goal',
  extraMinute: number | null = null,
  playerId?: number,
) {
  return {
    id,
    minute,
    extraMinute,
    type: 'Goal',
    detail,
    comments: null,
    teamId,
    player: { id: playerId ?? id, name: { en: name, ar: name } },
    assist: null,
  };
}

function inc(
  partial: Partial<Incident> & Pick<Incident, 'key' | 'minute' | 'side' | 'kind'>,
): Incident {
  return {
    extra: null,
    playerId: null,
    player: null,
    assist: null,
    inId: null,
    inName: null,
    outId: null,
    outName: null,
    detail: null,
    score: null,
    ...partial,
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

describe('groupHeroScorers / formatHeroScorerLine', () => {
  it('puts every goal by the same player on one line, minutes in order, lines by first goal', () => {
    const list = groupHeroScorers(
      [
        inc({
          key: 'a1',
          minute: 2,
          side: 0,
          kind: 'goal',
          playerId: 1,
          player: 'Jordan Henderson',
        }),
        inc({ key: 'b1', minute: 3, side: 0, kind: 'goal', playerId: 2, player: 'Morgan Rogers' }),
        inc({
          key: 'a2',
          minute: 70,
          side: 0,
          kind: 'goal',
          playerId: 1,
          player: 'Jordan Henderson',
        }),
        inc({ key: 'c1', minute: 46, side: 0, kind: 'goal', playerId: 3, player: 'João Pedro' }),
        inc({ key: 'c2', minute: 67, side: 0, kind: 'goal', playerId: 3, player: 'João Pedro' }),
      ],
      0,
    );
    expect(list.map((l) => formatHeroScorerLine(l, TAGS))).toEqual([
      'Jordan Henderson 2′ 70′',
      'Morgan Rogers 3′',
      'João Pedro 46′ 67′',
    ]);
  });

  it('attaches (P) only to the penalty minute', () => {
    const list = groupHeroScorers(
      [
        inc({ key: '1', minute: 64, side: 0, kind: 'goal', playerId: 7, player: 'Mbappé' }),
        inc({ key: '2', minute: 84, side: 0, kind: 'penaltyGoal', playerId: 7, player: 'Mbappé' }),
        inc({
          key: '3',
          minute: 40,
          side: 0,
          kind: 'penaltyGoal',
          playerId: 8,
          player: 'Fernandes',
        }),
        inc({ key: '4', minute: 68, side: 0, kind: 'goal', playerId: 8, player: 'Fernandes' }),
      ],
      0,
    );
    expect(list.map((l) => formatHeroScorerLine(l, TAGS))).toEqual([
      'Mbappé 64′ 84′\u00a0(P)',
      'Fernandes 40′\u00a0(P) 68′',
    ]);
  });

  it('keeps own goals on a separate line from the same player’s normal goals', () => {
    const list = groupHeroScorers(
      [
        inc({ key: '1', minute: 20, side: 0, kind: 'goal', playerId: 9, player: 'Jackson' }),
        inc({ key: '2', minute: 33, side: 0, kind: 'ownGoal', playerId: 9, player: 'Jackson' }),
        inc({
          key: '3',
          minute: 90,
          extra: 4,
          side: 0,
          kind: 'ownGoal',
          playerId: 9,
          player: 'Jackson',
        }),
      ],
      0,
    );
    expect(list.map((l) => formatHeroScorerLine(l, TAGS))).toEqual([
      'Jackson 20′',
      'Jackson 33′\u00a0(OG) 90+4′\u00a0(OG)',
    ]);
  });

  it('does not merge unnamed goals', () => {
    const list = groupHeroScorers(
      [
        inc({ key: '1', minute: 10, side: 0, kind: 'goal' }),
        inc({ key: '2', minute: 20, side: 0, kind: 'goal' }),
      ],
      0,
    );
    expect(list).toHaveLength(2);
    expect(list.map((l) => formatHeroScorerLine(l, TAGS))).toEqual(['10′', '20′']);
  });
});

describe('heroScorers cap', () => {
  const many = (n: number, side: Side): Incident[] =>
    Array.from({ length: n }, (_, i) =>
      inc({
        key: `${side}-${i}`,
        minute: i + 1,
        side,
        kind: 'goal',
        playerId: i,
        player: `P${i}`,
      }),
    );

  it(`shows at most ${HERO_SCORER_LIMIT} player lines and reports the hidden remainder`, () => {
    expect(heroScorers([], 0)).toEqual({ shown: [], hidden: 0 });
    expect(heroScorers(many(1, 0), 0).shown).toHaveLength(1);
    expect(heroScorers(many(5, 0), 0)).toMatchObject({ hidden: 0 });
    expect(heroScorers(many(5, 0), 0).shown).toHaveLength(5);
    expect(heroScorers(many(8, 0), 0).shown).toHaveLength(5);
    expect(heroScorers(many(8, 0), 0).hidden).toBe(3);
    expect(heroScorers(many(8, 0), 1).shown).toHaveLength(0);
  });

  it('counts players, not goals, toward the cap', () => {
    const doubled: Incident[] = [];
    for (let i = 0; i < 6; i++) {
      doubled.push(
        inc({
          key: `a${i}`,
          minute: i * 10 + 1,
          side: 0,
          kind: 'goal',
          playerId: i,
          player: `P${i}`,
        }),
        inc({
          key: `b${i}`,
          minute: i * 10 + 2,
          side: 0,
          kind: 'goal',
          playerId: i,
          player: `P${i}`,
        }),
      );
    }
    const { shown, hidden } = heroScorers(doubled, 0);
    expect(doubled).toHaveLength(12);
    expect(shown).toHaveLength(5);
    expect(hidden).toBe(1);
    expect(shown[0].goals).toHaveLength(2);
  });
});

describe('hero board markup', () => {
  it('keeps the team name outside the scorer list (stable first row)', () => {
    const html = render('en', [goal(1, HOME, 10, 'Mbappé'), goal(2, AWAY, 80, 'Saka')]);
    expect(html).toMatch(/<div class="mc-team"><img[^>]+class="mark"/);
    expect(html).toMatch(/<strong><a[^>]*>Galatasaray<\/a><\/strong><div class="mc-scorers">/);
    expect(html).toContain('Mbappé');
    expect(html).toContain('10′');
    expect(html).toContain('Saka');
    expect(html).toContain('80′');
  });

  it('groups a repeat scorer onto one line with every minute', () => {
    const html = render('en', [
      goal(1, HOME, 2, 'Jordan Henderson', 'Normal Goal', null, 10),
      goal(2, HOME, 3, 'Morgan Rogers', 'Normal Goal', null, 11),
      goal(3, HOME, 46, 'João Pedro', 'Normal Goal', null, 12),
      goal(4, HOME, 67, 'João Pedro', 'Normal Goal', null, 12),
      goal(5, HOME, 70, 'Jordan Henderson', 'Normal Goal', null, 10),
    ]);
    expect(html).toContain('Jordan Henderson <bdi dir="ltr">2′ 70′</bdi>');
    expect(html).toContain('João Pedro <bdi dir="ltr">46′ 67′</bdi>');
    expect(html).toContain('Morgan Rogers <bdi dir="ltr">3′</bdi>');
    expect(html).not.toContain('Jordan Henderson <bdi dir="ltr">2′</bdi>');
  });

  it('labels penalties and own goals, and keeps extra-time minutes', () => {
    const html = render('en', [
      goal(1, HOME, 12, 'Neto', 'Penalty'),
      goal(2, HOME, 90, 'Jackson', 'Own Goal', 4),
    ]);
    expect(html).toContain('Neto');
    expect(html).toContain('12′\u00a0(P)');
    expect(html).toContain('Jackson');
    expect(html).toContain('90+4′\u00a0(OG)');
  });

  it('uses short Arabic marks for penalties and own goals, with LTR minutes', () => {
    const html = render('ar', [
      goal(1, HOME, 12, 'Neto', 'Penalty'),
      goal(2, AWAY, 40, 'Saka', 'Own Goal'),
    ]);
    expect(html).toContain('(ر.ج)');
    expect(html).toContain('(ع.ك)');
    expect(html).toContain('dir="ltr"');
  });

  it('caps a long list at 5 with a +N link to Events, and lists every scorer in Events', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const events = names.map((n, i) => goal(100 + i, HOME, (i + 1) * 8, n));
    const html = render('en', events, { home: 8, away: 0 });
    for (const n of names.slice(0, 5)) expect(html).toContain(`${n}`);
    expect(html).not.toMatch(/>F </);
    expect(html).not.toContain('F 48′');
    expect(html).toMatch(/href="#events"[^>]*>\+3</);
    expect(html).toContain('3 more, view all events');
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
